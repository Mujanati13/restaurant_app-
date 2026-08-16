FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libjpeg62-turbo-dev libfreetype6-dev libonig-dev libxml2-dev libzip-dev libicu-dev zip unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd intl zip
RUN pecl install redis && docker-php-ext-enable redis

COPY docker/php/zz-vondo.conf /usr/local/etc/php-fpm.d/zz-vondo.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
