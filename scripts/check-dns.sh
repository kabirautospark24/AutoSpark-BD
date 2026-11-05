#!/usr/bin/env bash
#
# Production DNS health check for Auto Spark BD (Vercel).
#
# Verifies that autosparkbd.com (apex) and www.autosparkbd.com are delegated to
# a real DNS provider (not a registrar parking / suspension endpoint), that they
# resolve to Vercel, and that HTTPS reaches the canonical www host.
#
# Exit codes:
#   0  healthy
#   2  DNS mismatch / misconfiguration
#   3  registrar verification hold, suspension or parking detected
#
set -uo pipefail

DOMAIN="autosparkbd.com"
WWW_DOMAIN="www.${DOMAIN}"
CANONICAL_URL="https://www.${DOMAIN}"
REPORT_FILE="scripts/dns-report.txt"

# Exact values are shown in Vercel -> Project -> Settings -> Domains.
# 216.198.79.1 / 64.29.17.1 are the current anycast pool; 76.76.21.21 is legacy
# but still accepted by Vercel. Apex domains must use an A record.
APEX_EXPECTED_A=("216.198.79.1" "64.29.17.1" "76.76.21.21")
WWW_CNAME_SUFFIX="vercel-dns.com"

# Anything matching these means the domain is NOT delegated to Vercel DNS.
SUSPENSION_RE='suspended-domain|verification-hold'
PARKING_RE='parkpage|foundationapi|parking|sedoparking|above\.com|bodis|afternic|hugedomains|dan\.com|domainmarket|buydomains|parklogic|parkingcrew|undeveloped'

FAILURES=0
SUSPENDED=0

mkdir -p "$(dirname "$REPORT_FILE")"
: > "$REPORT_FILE"

log()  { printf '%s\n' "$*" | tee -a "$REPORT_FILE"; }
ok()   { log "[ OK ] $*"; }
warn() { log "[WARN] $*"; }
fail() { FAILURES=$((FAILURES + 1)); log "[FAIL] $*"; }

contains() {
  local needle="$1"; shift
  local item
  for item in "$@"; do
    [ "$item" = "$needle" ] && return 0
  done
  return 1
}

is_ipv4() {
  printf '%s' "$1" | grep -qE '^[0-9]+(\.[0-9]+){3}$'
}

log "DNS monitor for ${DOMAIN} (Vercel)"
log "Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
log "Canonical host: ${CANONICAL_URL}"
log ""

# ---------------------------------------------------------------------------
# 1. Authoritative nameservers
# ---------------------------------------------------------------------------
log "== Authoritative nameservers =="
NSLIST=$(dig +short NS "$DOMAIN" 2>/dev/null | sed 's/\.$//' | sort -u)
if [ -z "$NSLIST" ]; then
  fail "No authoritative nameservers returned for ${DOMAIN}"
  log ""
  log "RESULT: FAIL (no NS delegation)"
  exit 2
fi

while IFS= read -r ns; do
  [ -n "$ns" ] || continue
  log "  NS ${ns}"
  if printf '%s' "$ns" | grep -qiE "${SUSPENSION_RE}|${PARKING_RE}"; then
    fail "Nameserver '${ns}' is a registrar suspension/parking endpoint, not Vercel DNS"
    SUSPENDED=1
  fi
done <<< "$NSLIST"
log ""

# ---------------------------------------------------------------------------
# 2. SOA suspension marker
# ---------------------------------------------------------------------------
log "== SOA (suspension marker) =="
SOA=$(dig +short SOA "$DOMAIN" 2>/dev/null | head -n 1)
log "  ${SOA:-<none>}"
if [ -n "$SOA" ] && printf '%s' "$SOA" | grep -qiE "$SUSPENSION_RE"; then
  fail "SOA reports a registrar verification/suspension hold"
  SUSPENDED=1
fi
log ""

# ---------------------------------------------------------------------------
# 3. Suspension sinkhole
# ---------------------------------------------------------------------------
# Registrar holds commonly publish 127.0.0.1 for every record.
APEX_PUBLIC_A=$(dig +short A "$DOMAIN" @8.8.8.8 2>/dev/null | grep -E '^[0-9]+(\.[0-9]+){3}$' | sort -u)
if printf '%s\n' "$APEX_PUBLIC_A" | grep -qx '127.0.0.1'; then
  fail "Public DNS returns 127.0.0.1 for the apex (registrar hold sinkhole)"
  SUSPENDED=1
fi

if [ "$SUSPENDED" -eq 1 ]; then
  log ""
  log "RESULT: SUSPENDED / PARKED"
  log "The domain is not delegated to Vercel. This cannot be fixed from the repository."
  log "1. Verify the registrant email with the registrar (Purple IT Ltd) to lift the ICANN hold."
  log "2. Set the domain nameservers to your DNS provider (Cloudflare or the registrar's DNS)."
  log "3. Add both apex and www to the Vercel project and apply:"
  log "   A     @     216.198.79.1   (use the exact value shown in Vercel -> Domains)"
  log "   CNAME www   cname.vercel-dns.com"
  log "4. Set www as the primary domain and redirect the apex to www in Vercel."
  exit 3
fi

# ---------------------------------------------------------------------------
# 4. Apex A records at every authoritative nameserver
# ---------------------------------------------------------------------------
log "== Apex A records (authoritative) =="
while IFS= read -r ns; do
  [ -n "$ns" ] || continue
  ANSWERS=$(dig +short A "$DOMAIN" @"$ns" 2>/dev/null | grep -E '^[0-9]+(\.[0-9]+){3}$' | sort -u)
  if [ -z "$ANSWERS" ]; then
    fail "${ns} returned no A record for ${DOMAIN}"
    continue
  fi
  while IFS= read -r ip; do
    [ -n "$ip" ] || continue
    if contains "$ip" "${APEX_EXPECTED_A[@]}"; then
      ok "${ns} -> ${ip}"
    else
      fail "${ns} -> ${ip} is not a Vercel apex IP (expected: ${APEX_EXPECTED_A[*]})"
    fi
  done <<< "$ANSWERS"
done <<< "$NSLIST"
log ""

# ---------------------------------------------------------------------------
# 5. Public resolvers (apex)
# ---------------------------------------------------------------------------
log "== Public resolvers (apex) =="
for resolver in 8.8.8.8 1.1.1.1 9.9.9.9 208.67.222.222; do
  IPS=$(dig +short A "$DOMAIN" @"$resolver" 2>/dev/null | grep -E '^[0-9]+(\.[0-9]+){3}$' | sort -u | tr '\n' ' ')
  if [ -z "$IPS" ]; then
    fail "${resolver} returned no apex A record"
    continue
  fi
  BAD=0
  for ip in $IPS; do
    contains "$ip" "${APEX_EXPECTED_A[@]}" || BAD=1
  done
  if [ "$BAD" -eq 0 ]; then
    ok "${resolver} -> ${IPS}"
  else
    fail "${resolver} -> ${IPS} (not a Vercel apex IP)"
  fi
done
log ""

# ---------------------------------------------------------------------------
# 6. www record
# ---------------------------------------------------------------------------
log "== www record =="
WWW_CNAME=$(dig +short CNAME "$WWW_DOMAIN" @8.8.8.8 2>/dev/null | sed 's/\.$//' | head -n 1)
WWW_A=$(dig +short A "$WWW_DOMAIN" @8.8.8.8 2>/dev/null | grep -E '^[0-9]+(\.[0-9]+){3}$' | sort -u | tr '\n' ' ')

if printf '%s\n' $WWW_A | grep -qx '127.0.0.1'; then
  fail "www resolves to 127.0.0.1 (registrar hold sinkhole)"
elif [ -n "$WWW_CNAME" ]; then
  case "$WWW_CNAME" in
    *"$WWW_CNAME_SUFFIX"*) ok "www CNAME -> ${WWW_CNAME}" ;;
    *) fail "www CNAME -> ${WWW_CNAME} is not a Vercel target (*.${WWW_CNAME_SUFFIX})" ;;
  esac
elif [ -n "$WWW_A" ]; then
  BAD=0
  for ip in $WWW_A; do
    contains "$ip" "${APEX_EXPECTED_A[@]}" || BAD=1
  done
  if [ "$BAD" -eq 0 ]; then
    ok "www A -> ${WWW_A} (flattened CNAME)"
  else
    fail "www A -> ${WWW_A} is not a Vercel IP and no Vercel CNAME was found"
  fi
else
  fail "www has no CNAME or A record"
fi
log ""

# ---------------------------------------------------------------------------
# 7. HTTPS response
# ---------------------------------------------------------------------------
log "== HTTPS response =="
if command -v curl >/dev/null 2>&1; then
  APEX_HTTP=$(curl -sS -o /dev/null -L --max-time 25 \
    -w '%{http_code} %{url_effective} %{remote_ip}' "https://${DOMAIN}" 2>/dev/null || echo "000 - -")
  APEX_CODE=$(printf '%s' "$APEX_HTTP" | awk '{print $1}')
  APEX_FINAL=$(printf '%s' "$APEX_HTTP" | awk '{print $2}')
  APEX_REMOTE=$(printf '%s' "$APEX_HTTP" | awk '{print $3}')
  log "  apex -> HTTP ${APEX_CODE} ${APEX_FINAL} (remote ${APEX_REMOTE})"

  case "$APEX_REMOTE" in
    127.0.0.1|::1|"") fail "apex HTTPS has no routable remote address" ;;
  esac
  if [ "$APEX_CODE" = "200" ]; then
    case "$APEX_FINAL" in
      https://www.*) ok "apex redirects to canonical www" ;;
      *) warn "apex serves ${APEX_FINAL} instead of redirecting to ${CANONICAL_URL}" ;;
    esac
  else
    fail "apex HTTPS returned HTTP ${APEX_CODE}"
  fi

  WWW_HTTP=$(curl -sS -o /dev/null -L --max-time 25 \
    -w '%{http_code} %{url_effective} %{remote_ip}' "https://${WWW_DOMAIN}" 2>/dev/null || echo "000 - -")
  WWW_CODE=$(printf '%s' "$WWW_HTTP" | awk '{print $1}')
  WWW_FINAL=$(printf '%s' "$WWW_HTTP" | awk '{print $2}')
  WWW_REMOTE=$(printf '%s' "$WWW_HTTP" | awk '{print $3}')
  log "  www  -> HTTP ${WWW_CODE} ${WWW_FINAL} (remote ${WWW_REMOTE})"
  if [ "$WWW_CODE" = "200" ]; then
    ok "www serves HTTPS 200"
  else
    fail "www HTTPS returned HTTP ${WWW_CODE}"
  fi
else
  warn "curl not available, skipping HTTPS checks"
fi

# ---------------------------------------------------------------------------
# 8. Summary
# ---------------------------------------------------------------------------
log ""
if [ "$FAILURES" -eq 0 ]; then
  log "RESULT: HEALTHY - apex and www resolve to Vercel and HTTPS is working."
  exit 0
fi

log "RESULT: FAIL (${FAILURES} issue(s)) - see docs/DNS-RUNBOOK.md for remediation."
exit 2
