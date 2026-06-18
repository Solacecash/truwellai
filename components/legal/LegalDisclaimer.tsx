import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, SafeAreaView
} from 'react-native';

interface Props {
  text: string;
  variant?: 'banner' | 'inline' | 'footer' | 'card';
  expandable?: boolean;
  fullText?: string;
  style?: object;
}

export default function LegalDisclaimer({
  text,
  variant = 'footer',
  expandable = false,
  fullText,
  style,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const containerStyle = [
    styles.base,
    variant === 'banner' && styles.banner,
    variant === 'inline' && styles.inline,
    variant === 'footer' && styles.footer,
    variant === 'card' && styles.card,
    style,
  ];

  return (
    <View style={containerStyle}>
      <Text style={styles.text}>{text}</Text>
      {expandable && fullText && (
        <>
          <TouchableOpacity
            onPress={() => setExpanded(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.readMore}>Read full notice</Text>
          </TouchableOpacity>
          <Modal
            visible={expanded}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setExpanded(false)}
          >
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Important Notice</Text>
                <TouchableOpacity onPress={() => setExpanded(false)}>
                  <Text style={styles.modalClose}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <Text style={styles.modalText}>{fullText}</Text>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 12,
  },
  banner: {
    backgroundColor: 'rgba(255,165,2,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,165,2,0.18)',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  inline: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 10,
  },
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'rgba(0,229,200,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.15)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  text: {
    fontSize: 10,
    color: 'rgba(238,242,255,0.42)',
    lineHeight: 15,
    fontStyle: 'italic',
  },
  readMore: {
    fontSize: 10,
    color: '#00E5C8',
    fontWeight: '700',
    marginTop: 4,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: '#020A14',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EEF2FF',
  },
  modalClose: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00E5C8',
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  modalText: {
    fontSize: 13,
    color: 'rgba(238,242,255,0.72)',
    lineHeight: 20,
  },
});
