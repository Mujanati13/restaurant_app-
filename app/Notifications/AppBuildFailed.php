<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppBuildFailed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $platform,
        public readonly string $restaurantName,
    )
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Vondo app build needs attention')
            ->line('The '.$this->platform.' build for '.$this->restaurantName.' failed.')
            ->line('Open the build history to review the failure details and retry when the issue is resolved.')
            ->action('Review app builds', rtrim((string) config('vondo.owner_portal_url'), '/'));
    }
}
