<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Builds\ExternalBuildCompiler;
use App\Platform\Models\AppBuild;
use App\Notifications\AppBuildFailed;
use Igniter\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class BuildCompilerCallbackController extends Controller
{
    public function __invoke(Request $request, ExternalBuildCompiler $compiler): JsonResponse
    {
        abort_unless($compiler->validCallbackSignature(
            $request->getContent(),
            $request->header('X-Vondo-Timestamp'),
            $request->header('X-Vondo-Signature'),
        ), 401, 'Invalid compiler callback signature.');

        $data = $request->validate([
            'build_id' => ['required', 'uuid'],
            'job_id' => ['required', 'string', 'max:190'],
            'status' => ['required', Rule::in(['building', 'succeeded', 'failed'])],
            'message' => ['nullable', 'string', 'max:1000'],
            'artifact' => ['required_if:status,succeeded', 'array'],
            'artifact.kind' => ['required_if:status,succeeded', Rule::in(['apk', 'aab', 'ipa'])],
            'artifact.disk' => ['required_if:status,succeeded', 'string', 'max:64'],
            'artifact.path' => ['required_if:status,succeeded', 'string', 'max:1024'],
            'artifact.size_bytes' => ['required_if:status,succeeded', 'integer', 'min:1'],
            'artifact.sha256' => ['required_if:status,succeeded', 'string', 'regex:/^[a-f0-9]{64}$/'],
            'identity' => ['required_if:status,succeeded', 'array'],
            'identity.package_name' => ['nullable', 'regex:/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/', 'max:180'],
            'identity.sha256_cert_fingerprints' => ['nullable', 'array', 'between:1,10'],
            'identity.sha256_cert_fingerprints.*' => ['string', 'regex:/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/'],
            'identity.team_id' => ['nullable', 'regex:/^[A-Z0-9]{10}$/'],
            'identity.bundle_id' => ['nullable', 'regex:/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*){2,}$/', 'max:180'],
        ]);
        $build = AppBuild::query()->with('restaurant')
            ->where('public_id', $data['build_id'])
            ->where('external_job_id', $data['job_id'])
            ->firstOrFail();
        abort_if($build->status === 'cancelled', 409, 'This build was cancelled.');

        if ($data['status'] === 'building') {
            if ($build->status !== 'building') {
                abort_unless(in_array($build->status, ['submitted', 'configuration_ready'], true), 409, 'Invalid build transition.');
                $build->update(['status' => 'building']);
                $build->recordEvent('build.building', $data['message'] ?? 'External compilation started.');
            }
        } elseif ($data['status'] === 'failed') {
            if ($build->status !== 'failed') {
                abort_unless(in_array($build->status, ['submitted', 'building', 'configuration_ready'], true), 409, 'Invalid build transition.');
                $message = $data['message'] ?? 'External compilation failed.';
                $build->update(['status' => 'failed', 'failure_message' => $message, 'finished_at' => now()]);
                $build->recordEvent('build.failed', $message, 'error');
                $requester = $build->requested_by ? User::query()->find($build->requested_by) : null;
                $requester?->notify(new AppBuildFailed($build->platform, $build->restaurant->name));
            }
        } elseif ($build->status !== 'succeeded') {
            abort_unless(in_array($build->status, ['submitted', 'building'], true), 409, 'Invalid build transition.');
            $artifact = $data['artifact'];
            $identity = $data['identity'];
            if ($build->platform === 'android') {
                abort_unless(($identity['package_name'] ?? null) === ($build->configuration['bundle_id'] ?? null)
                    && !empty($identity['sha256_cert_fingerprints']), 422, 'The Android signing identity does not match this build.');
            } else {
                abort_unless(($identity['bundle_id'] ?? null) === ($build->configuration['bundle_id'] ?? null)
                    && !empty($identity['team_id']), 422, 'The iOS signing identity does not match this build.');
            }
            $expectedDisk = (string) config('vondo.build_disk', 'local');
            $prefix = 'builds/'.$build->restaurant->public_id.'/'.$build->public_id.'/';
            abort_unless($artifact['disk'] === $expectedDisk && str_starts_with($artifact['path'], $prefix), 422, 'The artifact path is outside this build.');
            $disk = Storage::disk($artifact['disk']);
            abort_unless($disk->exists($artifact['path']), 422, 'The compiler artifact is unavailable.');
            abort_unless((int) $disk->size($artifact['path']) === (int) $artifact['size_bytes'], 422, 'The compiler artifact size does not match.');
            $stream = $disk->readStream($artifact['path']);
            abort_unless(is_resource($stream), 422, 'The compiler artifact cannot be read.');
            $hash = hash_init('sha256');
            hash_update_stream($hash, $stream);
            fclose($stream);
            abort_unless(hash_equals($artifact['sha256'], hash_final($hash)), 422, 'The compiler artifact checksum does not match.');

            $build->artifacts()->updateOrCreate(
                ['path' => $artifact['path']],
                ['restaurant_id' => $build->restaurant_id, 'kind' => $artifact['kind'], 'disk' => $artifact['disk'],
                    'size_bytes' => $artifact['size_bytes'], 'sha256' => $artifact['sha256'],
                    'expires_at' => now()->addDays(max(1, (int) config('vondo.build_artifact_retention_days', 30)))],
            );
            $configuration = $build->configuration;
            $configuration['mobile_identity'] = $identity;
            $build->update(['status' => 'succeeded', 'artifact_path' => $artifact['path'], 'configuration' => $configuration,
                'failure_message' => null, 'finished_at' => now()]);
            $build->recordEvent('build.succeeded', $data['message'] ?? 'Signed application artifact is ready.', context: ['artifact' => $artifact['path']]);
        }

        return response()->json(['data' => ['build_id' => $build->public_id, 'status' => $build->fresh()->status]]);
    }
}
