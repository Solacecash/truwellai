import type { PropsWithChildren } from 'react';

/**
 * Passthrough wrapper. TruWell mobile IAP uses Adapty (no native Stripe SDK).
 */
export function StripeRoot({ children }: PropsWithChildren) {
  return <>{children}</>;
}
