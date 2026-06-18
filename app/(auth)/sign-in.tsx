import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

/** Spec sign-in route alias — preserves existing login screen (spec line 229). */
export default function SignInRoute() {
  const params = useLocalSearchParams<{ ref?: string; referral?: string }>();
  const ref =
    typeof params.ref === 'string'
      ? params.ref
      : typeof params.referral === 'string'
        ? params.referral
        : undefined;

  return (
    <Redirect
      href={ref ? { pathname: '/login', params: { ref } } : '/login'}
    />
  );
}
