<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->job(new \App\Jobs\RecordQueueHeartbeat)->everyMinute()->name('vondo-queue-heartbeat');
        $schedule->command('vondo:prune-build-artifacts')->dailyAt('03:20')->withoutOverlapping();
        $schedule->command('vondo:monitor')->everyFiveMinutes()->withoutOverlapping();
        $schedule->command('vondo:renew-domain-tls')->hourly()->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
