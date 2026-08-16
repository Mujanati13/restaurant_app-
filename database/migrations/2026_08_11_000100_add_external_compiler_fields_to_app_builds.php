<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_builds', function (Blueprint $table): void {
            $table->string('external_job_id', 190)->nullable()->unique()->after('artifact_path');
            $table->timestamp('submitted_at')->nullable()->after('started_at');
        });
    }

    public function down(): void
    {
        Schema::table('app_builds', function (Blueprint $table): void {
            $table->dropUnique(['external_job_id']);
            $table->dropColumn(['external_job_id', 'submitted_at']);
        });
    }
};
