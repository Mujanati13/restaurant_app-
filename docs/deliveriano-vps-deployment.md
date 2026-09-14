# Deliveriano VPS deployment

The public storefront is `https://deliveriano.ch`; the Laravel API and owner portal are `https://backend.deliveriano.ch` and `https://backend.deliveriano.ch/vondo-admin`.

Before running the script, point these DNS records at the VPS and ensure ports 80 and 443 are open:

- `deliveriano.ch` — A (and AAAA, if used)
- `*.deliveriano.ch` — A (and AAAA, if used) (Wildcard record for restaurant subdomains `<slug>.deliveriano.ch`)
- `backend.deliveriano.ch` — A (and AAAA, if used)

On the VPS, clone/copy this project, configure the required database passwords and `APP_KEY` in `.env`, then run:

```bash
sudo bash scripts/vps-setup-deliveriano.sh admin@deliveriano.ch
```

The script installs Nginx and Certbot, starts the Docker stack, restricts its HTTP ports to localhost, configures reverse proxies for `deliveriano.ch`, `*.deliveriano.ch`, and `backend.deliveriano.ch`, obtains an initial Let's Encrypt certificate covering `deliveriano.ch` and `backend.deliveriano.ch`, applies migrations, and caches Laravel configuration.

### Restaurant Subdomain Wildcard TLS (`*.deliveriano.ch`)
Let's Encrypt wildcard certificates require a DNS-01 challenge. To enable wildcard TLS across all restaurant subdomains:

**Option 1: DNS Provider Plugin (Recommended for automated renewals)**
Install the Certbot plugin matching your DNS registrar/provider (e.g., Cloudflare, Route53, DigitalOcean):
```bash
sudo apt-get install -y python3-certbot-dns-cloudflare
# Create /etc/letsencrypt/cloudflare.ini with dns_cloudflare_api_token = <YOUR_TOKEN>
sudo chmod 600 /etc/letsencrypt/cloudflare.ini
sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d deliveriano.ch -d "*.deliveriano.ch" -d backend.deliveriano.ch
```

**Option 2: Manual DNS-01 Challenge**
```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d deliveriano.ch -d "*.deliveriano.ch" -d backend.deliveriano.ch
```

**Option 3: Per-subdomain expansion via HTTP-01**
If wildcard DNS-01 is not available, expand the existing certificate as new restaurants launch:
```bash
sudo certbot --nginx --expand -d deliveriano.ch -d backend.deliveriano.ch -d <slug>.deliveriano.ch
```

Certbot installs automatic renewal; check it with `systemctl list-timers | grep certbot`.

Both Flutter apps now default to `https://backend.deliveriano.ch/api`. For an explicit production build, use `--dart-define=VONDO_API_URL=https://backend.deliveriano.ch/api`.
