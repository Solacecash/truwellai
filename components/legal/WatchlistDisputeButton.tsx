import React, { useState } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Alert, TextInput,
  Modal, View, SafeAreaView
} from 'react-native';
import { supabase } from '@/lib/supabase';

interface Props {
  ingredientName: string;
  jurisdiction: string;
  userId: string;
}

export default function WatchlistDisputeButton({
  ingredientName, jurisdiction, userId
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Please describe the issue before submitting.');
      return;
    }

    setSending(true);
    try {
      await supabase.from('watchlist_disputes').insert({
        user_id: userId,
        ingredient_name: ingredientName,
        jurisdiction,
        dispute_description: message.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      setModalVisible(false);
      setMessage('');
      Alert.alert(
        'Dispute Submitted',
        'Thank you. Our team will review this information within 48 hours. If our database needs updating, we will correct it promptly.'
      );
    } catch (err) {
      if (__DEV__) console.error('[WatchlistDispute] error:', err);
      Alert.alert('Could not submit dispute. Please email legal@truwell.ai directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.btnText}>Is this information incorrect?</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dispute Regulatory Information</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <Text style={styles.info}>
              Flagged: {ingredientName} ({jurisdiction})
            </Text>
            <Text style={styles.label}>
              Please describe why you believe this information may be incorrect
              or outdated, and include any regulatory references if available:
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Describe the issue..."
              placeholderTextColor="rgba(238,242,255,0.25)"
              multiline
              numberOfLines={5}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, sending && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={sending}
            >
              <Text style={styles.submitText}>
                {sending ? 'Submitting...' : 'Submit Dispute'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 8, paddingHorizontal: 12, marginTop: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8, alignSelf: 'flex-start',
  },
  btnText: { fontSize: 10, color: 'rgba(238,242,255,0.45)', fontWeight: '600' },
  safe: { flex: 1, backgroundColor: '#020A14' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#EEF2FF' },
  cancel: { fontSize: 14, fontWeight: '700', color: '#00E5C8' },
  body: { padding: 20 },
  info: {
    fontSize: 12, color: '#FFA502', fontWeight: '700',
    marginBottom: 14, padding: 10,
    backgroundColor: 'rgba(255,165,2,0.08)',
    borderRadius: 8,
  },
  label: {
    fontSize: 12, color: 'rgba(238,242,255,0.65)',
    lineHeight: 17, marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 14,
    fontSize: 13, color: '#EEF2FF', minHeight: 120,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#00E5C8', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.5 },
  submitText: { fontSize: 14, fontWeight: '800', color: '#020A14' },
});
