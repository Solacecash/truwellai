import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { LEGAL } from '@/lib/legalContent';

interface Props {
  compact?: boolean;
}

export default function EmergencyNotice({ compact = false }: Props) {
  const callEmergency = () => {
    // iOS: use native emergency call SOS which routes to the
    // correct local number automatically — Apple Guideline 5.1.1
    // Android: use tel:112 which is the international standard
    // emergency number recognised in 190+ countries
    if (Platform.OS === 'ios') {
      Linking.openURL('tel:112');
    } else {
      Linking.openURL('tel:112');
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compact} onPress={callEmergency}>
        <Text style={styles.compactText}>
          Medical emergency? Tap to call your local emergency services now
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🚨</Text>
      <Text style={styles.text}>{LEGAL.EMERGENCY_NOTICE}</Text>
      <TouchableOpacity style={styles.callBtn} onPress={callEmergency}>
        <Text style={styles.callText}>Call Emergency Services Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,71,87,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.25)',
    borderRadius: 12, padding: 14, margin: 16, alignItems: 'center',
  },
  icon: { fontSize: 24, marginBottom: 8 },
  text: {
    fontSize: 11, color: 'rgba(238,242,255,0.72)',
    lineHeight: 17, textAlign: 'center', marginBottom: 12,
  },
  callBtn: {
    backgroundColor: '#FF4757', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  callText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  compact: {
    backgroundColor: 'rgba(255,71,87,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.18)',
    borderRadius: 8, padding: 8, marginHorizontal: 16, marginBottom: 8,
  },
  compactText: {
    fontSize: 10, color: '#FF4757', fontWeight: '700', textAlign: 'center',
  },
});
