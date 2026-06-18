import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { persistReferralCode, parseReferralFromParams } from '@/lib/referralLink';

/**
 * Landing route for shared invite links:
 * https://truwellai.xyz/join?ref=CODE  or  truwell://join?ref=CODE
 */
export default function JoinReferralScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ref?: string; referral?: string }>();

  useEffect(() => {
    const go = async () => {
      const code = parseReferralFromParams(params);
      if (code) await persistReferralCode(code);
      router.replace({
        pathname: '/(auth)/login',
        params: code ? { ref: code } : {},
      } as never);
    };
    void go();
  }, [params, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#020A14', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#00E5C8" />
    </View>
  );
}
