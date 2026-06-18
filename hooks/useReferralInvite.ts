import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
  captureReferralFromInitialUrl,
  normalizeReferralCode,
  parseReferralFromUrl,
  persistReferralCode,
  resolveIncomingReferralCode,
} from '@/lib/referralLink';

export function useReferralInvite() {
  const params = useLocalSearchParams<{ ref?: string; referral?: string }>();
  const [referralCode, setReferralCode] = useState('');
  const [fromInviteLink, setFromInviteLink] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const resolved = await resolveIncomingReferralCode(params);
      if (cancelled) return;
      if (resolved) {
        setReferralCode(resolved);
        setFromInviteLink(true);
      } else {
        const initial = await captureReferralFromInitialUrl();
        if (!cancelled && initial) {
          setReferralCode(initial);
          setFromInviteLink(true);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.ref, params.referral]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const code = parseReferralFromUrl(url);
      if (code) {
        void persistReferralCode(code).then((saved) => {
          if (saved) {
            setReferralCode(saved);
            setFromInviteLink(true);
          }
        });
      }
    });
    return () => sub.remove();
  }, []);

  const updateReferralCode = useCallback((value: string) => {
    setReferralCode(normalizeReferralCode(value));
    setFromInviteLink(false);
  }, []);

  const persistReferral = useCallback(async () => {
    if (!referralCode.trim()) return;
    await persistReferralCode(referralCode);
  }, [referralCode]);

  return {
    referralCode,
    fromInviteLink,
    ready,
    setReferralCode: updateReferralCode,
    persistReferral,
  };
}
