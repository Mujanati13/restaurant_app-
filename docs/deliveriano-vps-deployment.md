# Deliveriano VPS deployment

The public storefront is `https://deliveriano.ch`; the Laravel API and owner portal are `https://backend.deliveriano.ch` and `https://backend.deliveriano.ch/vondo-admin`.

Before running the script, point these DNS records at the VPS and ensure ports 80 and 443 are open:

- `deliveriano.ch` — A (and AAAA, if used)
- `backend.deliveriano.ch` — A (and AAAA, if used)

On the VPS, clone/copy this project, configure the required database passwords and `APP_KEY` in `.env`, then run:

```bash
sudo bash scripts/vps-setup-deliveriano.sh admin@deliveriano.ch
```

The script installs Nginx and Certbot, starts the Docker stack, restricts its HTTP ports to localhost, configures reverse proxies, obtains one Let's Encrypt certificate covering all three names, applies migrations, and caches Laravel configuration. Certbot installs automatic renewal; check it with `systemctl list-timers | grep certbot`.

Both Flutter apps now default to `https://backend.deliveriano.ch/api`. For an explicit production build, use `--dart-define=VONDO_API_URL=https://backend.deliveriano.ch/api`.
