import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OB } from '@/components/onboarding/tokens';

type Props = {
  text: string;
  role: 'user' | 'ai';
};

function ChatBubbleInner({ text, role }: Props) {
  const isUser = role === 'user';
  return (
    <View style={[styles.wrap, isUser ? styles.userWrap : styles.aiWrap]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

export const ChatBubble = memo(ChatBubbleInner);

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  userWrap: { alignItems: 'flex-end' },
  aiWrap: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '88%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: 'rgba(212,175,55,0.18)',
    borderColor: 'rgba(212,175,55,0.35)',
  },
  aiBubble: {
    backgroundColor: 'rgba(53,214,255,0.12)',
    borderColor: 'rgba(53,214,255,0.30)',
  },
  text: { color: OB.t100, fontSize: 14, lineHeight: 21, fontWeight: '500' },
});
