<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RestaurantStaffInvitation extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $restaurantPublicId,
        public readonly string $restaurantName,
        public readonly string $invitationPublicId,
        public readonly string $token,
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('vondo.owner_portal_url'), '/')
            .'/?action=accept-invite&restaurant='.urlencode($this->restaurantPublicId)
            .'&invitation='.urlencode($this->invitationPublicId)
            .'&token='.urlencode($this->token);

        return (new MailMessage)
            ->subject('Join '.$this->restaurantName.' on Vondo')
            ->line('You have been invited to join '.$this->restaurantName.'.')
            ->action('Accept invitation', $url)
            ->line('This invitation expires in seven days and can only be used once.');
    }
}
