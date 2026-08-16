<?php

return [
    'middleware' => [
        'api',
        App\Http\Middleware\StorefrontApiAuthenticate::class,
    ],
];
