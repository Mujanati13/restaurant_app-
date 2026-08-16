<?php

namespace App\Jobs;

use App\Platform\Models\AppBuild;
use App\Platform\Builds\ExternalBuildCompiler;
use App\Notifications\AppBuildFailed;
use Igniter\User\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Throwable;
use RuntimeException;

class PrepareAppBuild implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        public readonly int $buildId,
        public readonly ?int $restaurantId = null,
    ) {}

    public function handle(?ExternalBuildCompiler $compiler = null): void
    {
        $compiler ??= app(ExternalBuildCompiler::class);
        $build = AppBuild::query()->with('restaurant')
            ->when($this->restaurantId, fn($query) => $query->where('restaurant_id', $this->restaurantId))
            ->findOrFail($this->buildId);
        if ($build->cancelled_at || $build->status === 'cancelled') return;
        $build->update(['status' => 'preparing', 'started_at' => now(), 'attempts' => $build->attempts + 1, 'failure_message' => null]);
        $build->recordEvent('build.preparing', 'Preparing the tenant build manifest.', context: ['attempt' => $build->attempts]);

        $path = 'builds/'.$build->restaurant->public_id.'/'.$build->public_id.'/manifest.json';
        $disk = (string) config('vondo.build_disk', 'local');
        $appHost = $build->restaurant->domains()->whereNotNull('verified_at')->orderBy('is_primary')->value('host');
        if (!$appHost) throw new RuntimeException('A verified restaurant domain is required before building a mobile application.');
        $configuration = [...$build->configuration,
            'restaurant_key' => $build->restaurant->public_id,
            'app_host' => $appHost,
            'url_scheme' => 'vondo-'.$build->restaurant->slug,
        ];
        $manifest = json_encode([
            'schema' => 1, 'build_id' => $build->public_id, 'restaurant_id' => $build->restaurant->public_id,
            'platform' => $build->platform, 'configuration' => $configuration,
            'dart_defines' => ['VONDO_RESTAURANT' => $build->restaurant->public_id, 'VONDO_APP_NAME' => $configuration['app_name'],
                'VONDO_APP_HOST' => $appHost, 'VONDO_URL_SCHEME' => $configuration['url_scheme']],
            'created_at' => now()->toIso8601String(),
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
        Storage::disk($disk)->put($path, $manifest);
        $build->artifacts()->create([
            'restaurant_id' => $build->restaurant_id, 'kind' => 'manifest', 'disk' => $disk, 'path' => $path,
            'size_bytes' => strlen($manifest), 'sha256' => hash('sha256', $manifest),
            'expires_at' => now()->addDays(max(1, (int) config('vondo.build_artifact_retention_days', 30))),
        ]);
        $build->update(['status' => 'configuration_ready', 'artifact_path' => $path, 'finished_at' => now()]);
        $build->recordEvent('build.configuration_ready', 'Tenant build manifest is ready for the external compiler.', context: ['artifact' => $path]);
        if ($compiler->configured()) {
            $jobId = $compiler->submit($build, $path, hash('sha256', $manifest));
            $build->update([
                'status' => 'submitted', 'external_job_id' => $jobId,
                'submitted_at' => now(), 'finished_at' => null,
            ]);
            $build->recordEvent('build.submitted', 'Build submitted to the external compiler.', context: ['external_job_id' => $jobId]);
        }
    }

    public function failed(Throwable $exception): void
    {
        $build = AppBuild::query()->with('restaurant')->whereKey($this->buildId)
            ->when($this->restaurantId, fn($query) => $query->where('restaurant_id', $this->restaurantId))
            ->first();
        if (!$build) return;
        $message = (string) str($exception->getMessage())->limit(1000);
        $build->update(['status' => 'failed', 'failure_message' => $message, 'finished_at' => now()]);
        $build->recordEvent('build.failed', $message, 'error');
        $requester = $build->requested_by ? User::query()->find($build->requested_by) : null;
        $requester?->notify(new AppBuildFailed($build->platform, $build->restaurant->name));
    }
}
