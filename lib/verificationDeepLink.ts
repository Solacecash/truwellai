import type { Router } from 'expo-router';

/**
 * Stub � professional verification deep links have been removed.
 * Guardian users do not use post-verify deep links.
 */
export async function handleVerificationDeepLink(
  _url: string,
  _router: Pick<Router, 'replace' | 'push'>
): Promise<void> {
  // no-op
}
