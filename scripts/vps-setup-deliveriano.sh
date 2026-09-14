#!/usr/bin/env bash
# Configure the Deliveriano domains, start the Docker stack, and obtain TLS.
# Run from the project directory on an Ubuntu/Debian VPS:
#   sudo bash scripts/vps-setup-deliveriano.sh admin@deliveriano.ch
set -Eeuo pipefail

EMAIL="${1:-}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NGINX_SITE="/etc/nginx/sites-available/deliveriano"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root (for example: sudo bash scripts/vps-setup-deliveriano.sh you@example.com)." >&2
  exit 1
fi

if [[ -z "${EMAIL}" || "${EMAIL}" != *@* ]]; then
  echo "Usage: sudo bash scripts/vps-setup-deliveriano.sh admin@deliveriano.ch" >&2
  exit 1
fi

command -v docker >/dev/null || { echo "Docker is required. Install Docker Engine and the Docker Compose plugin first." >&2; exit 1; }
docker compose version >/dev/null || { echo "Docker Compose plugin is required." >&2; exit 1; }

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx

cd "${PROJECT_DIR}"
if [[ ! -f .env ]]; then
  cp .env.example .env
fi

set_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    printf '\n%s=%s\n' "${key}" "${value}" >> .env
  fi
}

set_env APP_ENV production
set_env APP_DEBUG false
set_env APP_URL https://backend.deliveriano.ch
set_env VONDO_BASE_DOMAIN deliveriano.ch
set_env VONDO_OWNER_PORTAL_URL https://backend.deliveriano.ch/vondo-admin
set_env VONDO_STOREFRONT_URL https://deliveriano.ch
set_env VONDO_API_HEALTH_URL https://backend.deliveriano.ch/api/v1/health/live
set_env VONDO_STOREFRONT_HEALTH_URL https://deliveriano.ch/health
set_env VONDO_ALLOW_TENANT_HEADER false
# Keep Docker services private; Nginx below is the only public entry point.
set_env APP_HTTP_PORT 127.0.0.1:8081
set_env STOREFRONT_HTTP_PORT 127.0.0.1:3000

docker compose up -d --build

cat > "${NGINX_SITE}" <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name deliveriano.ch *.deliveriano.ch;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name backend.deliveriano.ch;

    client_max_body_size 32m;
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -sfn "${NGINX_SITE}" /etc/nginx/sites-enabled/deliveriano
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# HTTP-01 validation requires both A/AAAA records to reach this VPS on port 80.
certbot --nginx --non-interactive --agree-tos --email "${EMAIL}" --redirect \
  -d deliveriano.ch -d backend.deliveriano.ch

docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan config:cache

echo "Deployment complete."
echo "Storefront: https://deliveriano.ch"
echo "API/admin:  https://backend.deliveriano.ch"
echo "Certificate renewal is installed by Certbot; verify it with: systemctl list-timers | grep certbot"
