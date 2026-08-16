<?php

namespace App\Platform\Branding;

use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

final class BrandConfiguration
{
    public static function defaults(string $name): array
    {
        return [
            'identity' => ['name' => $name, 'tagline' => 'Made fresh for your table', 'logo_url' => null],
            'theme' => [
                'primary' => '#c95028', 'secondary' => '#29231f', 'accent' => '#f6a623',
                'background' => '#fffaf6', 'surface' => '#ffffff', 'text' => '#29231f', 'radius' => 16,
            ],
            'content' => [
                'hero_title' => 'Restaurant-quality food, on your schedule.',
                'hero_subtitle' => 'Order freshly prepared favourites or reserve a table.',
                'hero_image_url' => null,
                'footer_text' => "{$name}. All rights reserved.",
            ],
            'navigation' => [
                ['label' => 'Home', 'href' => '#/'],
                ['label' => 'Menu', 'href' => '#/menu'],
                ['label' => 'Reserve Table', 'href' => '#/reservations'],
                ['label' => 'Locations', 'href' => '#/locations'],
            ],
            'sections' => [
                ['id' => 'hero', 'type' => 'hero', 'visible' => true, 'position' => 10],
                ['id' => 'categories', 'type' => 'categories', 'visible' => true, 'position' => 20],
                ['id' => 'featured', 'type' => 'featured_dishes', 'visible' => true, 'position' => 30],
                ['id' => 'reservation', 'type' => 'reservation_cta', 'visible' => true, 'position' => 40],
            ],
            'mobile' => [
                'android' => ['package_name' => null, 'sha256_cert_fingerprints' => []],
                'ios' => ['team_id' => null, 'bundle_id' => null],
            ],
        ];
    }

    public static function rules(): array
    {
        return [
            'identity' => ['required', 'array'],
            'identity.name' => ['required', 'string', 'max:80'],
            'identity.tagline' => ['nullable', 'string', 'max:160'],
            'identity.logo_url' => ['nullable', 'url:http,https', 'max:2048'],
            'theme' => ['required', 'array'],
            'theme.primary' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.secondary' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.accent' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.background' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.surface' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.text' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.radius' => ['required', 'integer', 'between:0,32'],
            'content' => ['required', 'array'],
            'content.hero_title' => ['required', 'string', 'max:120'],
            'content.hero_subtitle' => ['nullable', 'string', 'max:300'],
            'content.hero_image_url' => ['nullable', 'url:http,https', 'max:2048'],
            'content.footer_text' => ['nullable', 'string', 'max:240'],
            'navigation' => ['required', 'array', 'min:1', 'max:8'],
            'navigation.*.label' => ['required', 'string', 'max:40'],
            'navigation.*.href' => ['required', 'string', 'regex:/^#\/[a-z0-9\-\/?=&]*$/i', 'distinct'],
            'sections' => ['required', 'array', 'max:20'],
            'sections.*.id' => ['required', 'alpha_dash', 'max:40', 'distinct'],
            'sections.*.type' => ['required', Rule::in(['hero', 'categories', 'featured_dishes', 'reservation_cta', 'about', 'locations', 'gallery', 'contact', 'custom_text'])],
            'sections.*.visible' => ['required', 'boolean'],
            'sections.*.position' => ['required', 'integer', 'between:0,1000'],
            'mobile' => ['sometimes', 'array'],
            'mobile.android' => ['sometimes', 'array'],
            'mobile.android.package_name' => ['nullable', 'regex:/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/', 'max:255'],
            'mobile.android.sha256_cert_fingerprints' => ['nullable', 'array', 'max:10'],
            'mobile.android.sha256_cert_fingerprints.*' => ['string', 'regex:/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i'],
            'mobile.ios' => ['sometimes', 'array'],
            'mobile.ios.team_id' => ['nullable', 'regex:/^[A-Z0-9]{10}$/', 'max:10'],
            'mobile.ios.bundle_id' => ['nullable', 'regex:/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*)+$/', 'max:255'],
        ];
    }

    public static function publicPayload(array $configuration): array
    {
        return Arr::only($configuration, ['identity', 'theme', 'content', 'navigation', 'sections', 'mobile']);
    }
}
