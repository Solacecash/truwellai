import React from 'react';
import { View } from 'react-native';

/** Returns a plain dark screen. TruWellSplash handles branded loading. */
export function BootstrapLoading() {
  return <View style={{ flex: 1, backgroundColor: '#020A14' }} />;
}
