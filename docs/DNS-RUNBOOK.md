# DNS Runbook - autosparkbd.com (Vercel)

Single source of truth for the production domain. The site is hosted on
**Vercel** (`autospark-bd`, project id `prj_4z16vBfwG38EmuISBPrgRASQx13H`).
The legacy GitHub Pages configuration in `docs/archive/DNS_RUNBOOK.md` is
obsolete and must not be used.

## Canonical host

- Canonical: `https://www.autosparkbd.com`
- Apex: `https://autosparkbd.com` is attached to the same Vercel project and
  redirects to the canonical www host.
- `vercel.json` also enforces the apex -> www redirect at the edge, so apex
  traffic works even if the dashboard primary-domain redirect is removed.
- SEO canonicals, sitemap, share images and API fallbacks all use
  `https://www.autosparkbd.com`.

## Required DNS records

Use the exact values shown in **Vercel -> Project -> Settings -> Domains**.
The values below are the accepted Vercel endpoints.

| Type  | Name | Value                 | Purpose                  |
|-------|------|-----------------------|--------------------------|
| A     | @    | `216.198.79.1`        | Apex (Vercel anycast)    |
| CNAME | www  | `cname.vercel-dns.com`| Canonical www host       |

Notes:

- Vercel may assign a different apex IP (for example `64.29.17.1`);
  `76.76.21.21` is the legacy value and is still valid. Always copy the value
  from the domain card.
- Do not add AAAA records. Vercel does not support IPv6 for custom domains on
  third-party DNS and stray AAAA records split traffic.
- Do not mix nameservers from multiple DNS providers.
- If Cloudflare is the DNS provider, keep these records **DNS-only (grey
  cloud)**. Proxying them makes the apex return Cloudflare IPs, which prevents
  Vercel from verifying the domain and makes the DNS monitor report a mismatch.
- Keep TTL at 300 during changes; raise it after verification.

## Registrar

- Registrar: **Purple IT Ltd**
- Expiry: 2027-11-01
- The domain must remain on **clientTransferProhibited** (registrar lock).
- Enable 2FA on both the registrar and DNS provider accounts.

## Verification

Run the automated check:

```bash
./scripts/check-dns.sh
cat scripts/dns-report.txt
```

Manual checks (all resolvers must agree):

```bash
dig +short NS autosparkbd.com
dig +short A autosparkbd.com @8.8.8.8
dig +short A autosparkbd.com @1.1.1.1
dig +short CNAME www.autosparkbd.com @8.8.8.8
curl -IL https://autosparkbd.com
curl -IL https://www.autosparkbd.com
```

Healthy state:

- Authoritative nameservers are your DNS provider (Cloudflare or the registrar),
  never `*.parkpage.foundationapi.com`.
- SOA does not contain `suspended-domain` or `verification-hold`.
- Apex A record is one of the Vercel IPs above.
- www is a CNAME to `*.vercel-dns.com` (or a flattened Vercel A record).
- `https://autosparkbd.com` returns 200 after following the redirect to
  `https://www.autosparkbd.com`.

## Incident: registrar verification hold / parking

Symptoms:

- Apex and www both resolve to `127.0.0.1`.
- `NS` shows `dns10/dns11.parkpage.foundationapi.com`.
- `SOA` shows `ns1.verification-hold.suspended-domain.com`.

This is a registrar-level hold. It cannot be fixed from this repository.

Recovery:

1. Check the registrant email on the Purple IT domain record (including spam)
   for an ICANN registrant-verification message and complete it. If none
   arrived, open the Purple IT control panel and re-send or confirm the
   registrant contact.
2. Set the domain nameservers to your authoritative DNS provider. Do not mix
   providers.
3. Recreate the two records in the table above.
4. In Vercel, add both `autosparkbd.com` and `www.autosparkbd.com`. Set `www`
   as primary and configure the apex -> www redirect.
5. Wait for TTL (300s) and re-run `./scripts/check-dns.sh`. If it still fails,
   purge the provider cache and contact Purple IT support with the RDAP record,
   proof of ownership, and the suspension SOA output.

## Monitoring

`.github/workflows/dns-monitor.yml` runs `scripts/check-dns.sh` hourly and on
changes to the script. It:

- detects registrar suspension, parking nameservers and loopback sinkholes,
- verifies apex A records at every authoritative nameserver and at public
  resolvers,
- verifies the www CNAME/A record,
- checks the HTTPS response and apex -> www redirect,
- uploads `scripts/dns-report.txt` as an artifact and opens an issue when
  unhealthy, then fails the job.

Keep the workflow enabled. Optionally add an external uptime monitor for
`https://www.autosparkbd.com` and `https://autosparkbd.com` that alerts to
email/Slack.

## Rollback

- If a DNS change breaks the site, restore the previous nameserver set or the
  previous A/CNAME values from the DNS provider audit log.
- If a deploy breaks the site but DNS is healthy, use the Vercel dashboard to
  promote the last good deployment.
- Never point the domain at a parking or hold service as a "temporary" fix.
