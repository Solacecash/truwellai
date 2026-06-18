/**
 * Normalizes and validates EXPO_PUBLIC_SUPABASE_URL (and extra.supabaseUrl) before any
 * native networking (OkHttp on Android, URLSession on iOS) uses it.
 *
 * Supabase JS passes this base into fetch + WebSocket; the TLS SNI server name must be
 * a real hostname — not a full URL pasted into a "host" field, not a path suffix, and
 * (for release) not a local/private address with broken TLS expectations.
 */

export type SupabaseUrlSanitizeOptions = {
  /**
   * When true: allow `http:` and localhost / private LAN hosts (local Supabase, LAN dev).
   * Use EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE=1 in .env for dev-only; never in production builds.
   */
  allowLocalInsecure: boolean;
};

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

function trimEnv(raw: string): string {
  return raw.trim().replace(/^['"]+|['"]+$/g, '');
}

function isUnderscoreInHost(hostname: string): boolean {
  return hostname.includes('_');
}

function ipv4Parts(host: string): [number, number, number, number] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = Number(m[3]);
  const d = Number(m[4]);
  if ([a, b, c, d].some((n) => n > 255)) return null;
  return [a, b, c, d];
}

/**
 * Hosts that must not be used as TLS SNI targets for the default Supabase cloud client
 * in production-like builds (cleartext / cert issues / wrong hostname verification).
 */
export function isLocalOrPrivateHost(hostname: string): boolean {
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

export function isStd3AsciiHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 253) return false;
  if (hostname.endsWith('.')) return false;
  if (isUnderscoreInHost(hostname)) return false;

  const labels = hostname.split('.');
  for (const label of labels) {
    if (!label.length || label.length > 63) return false;
    if (!LABEL.test(label)) return false;
  }
  return true;
}

/**
 * Returns `https://host[:port]` or (when allowed) `http://...` with path/query/hash stripped.
 * Empty string if invalid.
 */
export function sanitizeSupabaseProjectUrl(
  rawInput: string | undefined | null,
  options: SupabaseUrlSanitizeOptions
): string {
  const raw = trimEnv(rawInput ?? '');
  if (!raw) return '';

  let candidate = raw;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    if (__DEV__) console.error('[Supabase URL] Invalid URL — check EXPO_PUBLIC_SUPABASE_URL.');
    return '';
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'https:' && protocol !== 'http:') {
    if (__DEV__) console.error('[Supabase URL] Only http(s) URLs are allowed.');
    return '';
  }

  if (protocol === 'http:' && !options.allowLocalInsecure) {
    if (__DEV__) console.error(
      '[Supabase URL] http:// is not allowed in this build. Use https:// or set EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE=1 for local dev only.'
    );
    return '';
  }

  const hostForChecks = url.hostname;
  const hostLc = hostForChecks.toLowerCase();
  if (!hostForChecks) {
    if (__DEV__) console.error('[Supabase URL] Missing hostname.');
    return '';
  }

  const isIpv6Literal = hostForChecks.includes(':');
  if (isIpv6Literal && !options.allowLocalInsecure) {
    if (__DEV__) console.error(
      '[Supabase URL] IPv6 literals are blocked unless EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE=1 (dev LAN / local Supabase).'
    );
    return '';
  }

  if (!isIpv6Literal) {
    if (isUnderscoreInHost(hostLc)) {
      if (__DEV__) console.error('[Supabase URL] Hostname must not contain underscores (invalid for TLS/SNI).');
      return '';
    }
    if (!isStd3AsciiHostname(hostLc)) {
      if (__DEV__) console.error(
        '[Supabase URL] Hostname must use STD3 ASCII labels (international domains: use Punycode in env).'
      );
      return '';
    }
  }

  if (isLocalOrPrivateHost(hostForChecks) && !options.allowLocalInsecure) {
    if (__DEV__) console.error(
      '[Supabase URL] Local/private hosts are blocked for secure networking. For local Supabase set EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE=1 (dev only).'
    );
    return '';
  }

  // Critical: SDK + Realtime derive REST / wss host from this origin. Strip path, query,
  // hash and userinfo so native TLS uses a single coherent SNI host (no accidental
  // "https://" embedded in hostname fields, no `/rest/v1` doubling).
  const origin = `${url.protocol}//${url.host}`;
  return origin.replace(/\/$/, '');
}

export function allowLocalSupabaseFromEnv(): boolean {
  return (
    process.env.EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE === '1' ||
    process.env.EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE === 'true'
  );
}
