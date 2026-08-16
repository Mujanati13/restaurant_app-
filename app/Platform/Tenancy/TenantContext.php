<?php

namespace App\Platform\Tenancy;

use App\Platform\Models\Restaurant;
use LogicException;

class TenantContext
{
    private ?Restaurant $restaurant = null;

    public function set(Restaurant $restaurant): void
    {
        $this->restaurant = $restaurant;
    }

    public function clear(): void
    {
        $this->restaurant = null;
    }

    public function has(): bool
    {
        return $this->restaurant !== null;
    }

    public function get(): Restaurant
    {
        return $this->restaurant ?? throw new LogicException('No restaurant tenant has been resolved.');
    }

    public function id(): int
    {
        return (int)$this->get()->getKey();
    }
}
