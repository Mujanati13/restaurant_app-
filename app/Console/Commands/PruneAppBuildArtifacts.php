<?php

namespace App\Console\Commands;

use App\Platform\Models\AppBuildArtifact;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneAppBuildArtifacts extends Command
{
    protected $signature = 'vondo:prune-build-artifacts {--dry-run}';
    protected $description = 'Remove expired app-build artifacts using their recorded storage disk';

    public function handle(): int
    {
        $count = 0;
        AppBuildArtifact::query()->whereNotNull('expires_at')->where('expires_at', '<=', now())
            ->orderBy('id')->chunkById(100, function ($artifacts) use (&$count): void {
                foreach ($artifacts as $artifact) {
                    $count++;
                    if ($this->option('dry-run')) continue;
                    Storage::disk($artifact->disk)->delete($artifact->path);
                    $artifact->delete();
                }
            });
        $this->info(($this->option('dry-run') ? 'Would prune ' : 'Pruned ').$count.' expired build artifact(s).');
        return self::SUCCESS;
    }
}
