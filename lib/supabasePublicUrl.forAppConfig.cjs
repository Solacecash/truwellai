/**
 * Mirrors lib/supabasePublicUrl.ts logic for Expo app.config evaluation (plain Node/CommonJS).
 * Keep in sync with supabasePublicUrl.ts when changing URL validation rules.
 */

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

function trimEnv(raw) {
  return raw.trim().replace(/^['"]+|['"]+$/g, '');
}

function isUnderscoreInHost(hostname) {
  return hostname.includes('_');
}

function ipv4Parts(host) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = Number(m[3]);
  const d = Number(m[4]);
  if ([a, b, c, d].some((n) => n > 255)) return null;
  return [a, b, c, d];
}

function isLocalOrPrivateHost(hostname) {
  const host =
    hostname.startsWith('[') && hostname.endsWith(']')
      ? hostname.slice(1, -1).toLowerCase()
      : hostname.toLowerCase();

  if (host === 'localhost') return true;
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') return true;

  const v4 = ipv4Parts(host);
  if (v4) {
    const [a, b] = v4;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  }

  return false;
}

function isStd3AsciiHostname(hostname) {
  if (!hostname || hostname.length > 253) return false;
  if (hostname.endsWith('.')) return false;
  if (isUnderscoreInHost(hostname)) return false;

  const labels = hostname.split('.');
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (!label.length || label.length > 63) return false;
    if (!LABEL.test(label)) return false;
  }
  return true;
}

function sanitizeSupabaseProjectUrl(rawInput, options) {
  const raw = trimEnv(rawInput ?? '');
  if (!raw) return '';

  let candidate = raw;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  /** @type {URL} */
  let url;
  try {
    url = new URL(candidate);
  } catch {
    console.error('[Supabase URL] Invalid URL — check EXPO_PUBLIC_SUPABASE_URL.');
    return '';
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'https:' && protocol !== 'http:') {
    console.error('[Supabase URL] Only http(s) URLs are allowed.');
    return '';
  }

  if (protocol === 'http:' && !options.allowLocalInsecure) {
    console.error(
      '[Supabase URL] http:// is not allowed in this build. Use https:// or set EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE=1 for local dev only.'
    );
    return '';
  }

  const hostForChecks = url.hostname;
  const hostLc = hostForChecks.toLowerCase();
  if (!hostForChecks) {
    console.error('[Supabase URL] Missing hostname.');
    return '';
  }

  const isIpv6Literal = hostForChecks.includes(':');
  if (isIpv6Literal && !options.allowLocalInsecure) {
    console.error(
      '[Supabase URL] IPv6 literals are blocked unless EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE=1 (dev LAN / local Supabase).'
    );
    return '';
  }

  if (!isIpv6Literal) {
    if (isUnderscoreInHost(hostLc)) {
      console.error('[Supabase URL] Hostname must not contain underscores (invalid for TLS/SNI).');
      return '';
    }
    if (!isStd3AsciiHostname(hostLc)) {
      console.error(
        '[Supabase URL] Hostname must use STD3 ASCII labels (international domains: use Punycode in env).'
      );
      return '';
    }
  }

  if (isLocalOrPrivateHost(hostForChecks) && !options.allowLocalInsecure) {
    console.error(
      '[Supabase URL] Local/private hosts are blocked for secure networking. For local Supabase set EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE=1 (dev only).'
    );
    return '';
  }

  const origin = `${url.protocol}//${url.host}`;
  return origin.replace(/\/$/, '');
}

function allowLocalSupabaseFromEnv() {
  return (
    process.env.EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE === '1' ||
    process.env.EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE === 'true'
  );
}

module.exports = {
  isLocalOrPrivateHost,
  isStd3AsciiHostname,
  sanitizeSupabaseProjectUrl,
  allowLocalSupabaseFromEnv,
};
