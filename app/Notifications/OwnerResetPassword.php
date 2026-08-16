<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OwnerResetPassword extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $restaurantPublicId,
        public readonly string $restaurantName,
        public readonly string $token,
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
        $url = rtrim((string) config('vondo.owner_portal_url'), '/')
            .'/?action=reset-password&restaurant='.urlencode($this->restaurantPublicId)
            .'&token='.urlencode($this->token);

        return (new MailMessage)
            ->subject('Reset your Vondo owner password')
            ->line('A password reset was requested for '.$this->restaurantName.'.')
            ->action('Reset password', $url)
            ->line('This link expires in 60 minutes. If you did not request it, no action is required.');
    }
}
