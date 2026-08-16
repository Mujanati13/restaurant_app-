<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OwnerVerifyEmail extends Notification implements ShouldQueue
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
            .'/?action=verify-email&restaurant='.urlencode($this->restaurantPublicId)
            .'&token='.urlencode($this->token);

        return (new MailMessage)
            ->subject('Verify your Vondo restaurant owner account')
            ->greeting('Welcome to Vondo')
            ->line('Verify your email address to activate '.$this->restaurantName.'.')
            ->action('Verify email', $url)
            ->line('This verification link expires in 24 hours.');
    }
}
