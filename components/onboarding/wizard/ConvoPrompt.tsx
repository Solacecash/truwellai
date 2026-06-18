import React, { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { TruWellShield } from '../TruWellShield';
import { OB } from '../tokens';

type Props = {
  html: string;
};

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

function ConvoPromptInner({ html }: Props) {
  const plain = useMemo(() => stripTags(html), [html]);
  const [len, setLen] = useState(0);
  const [done, setDone] = useState(false);
  const cursorOp = useSharedValue(1);

  useEffect(() => {
    setLen(0);
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setLen(Math.min(i, plain.length));
      if (i >= plain.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 18);
    return () => clearInterval(id);
  }, [html, plain]);

  useEffect(() => {
    if (done) return;
    cursorOp.value = withRepeat(
      withSequence(withTiming(0, { duration: 350 }), withTiming(1, { duration: 350 })),
      -1,
      true
    );
  }, [cursorOp, done]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOp.value,
  }));

  const renderRich = () => {
    if (!done) {
      return (
        <View style={styles.typeRow}>
          <Text style={styles.bubbleText}>{plain.slice(0, len)}</Text>
          <Animated.View style={[styles.cursorBar, cursorStyle]} />
        </View>
      );
    }
    const parts = html.split(/(<strong>.*?<\/strong>)/g);
    return (
      <Text style={styles.bubbleText}>
        {parts.map((part, idx) => {
          const m = part.match(/^<strong>(.*)<\/strong>$/);
          if (m) {
            return (
              <Text key={idx} style={styles.strong}>
                {m[1]}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bubble}>
        <View style={styles.avatar}>
          <TruWellShield size={16} animated={false} />
        </View>
        <View style={styles.textArea}>{renderRich()}</View>
      </View>
    </View>
  );
}

export const ConvoPrompt = memo(ConvoPromptInner);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingVertical: 16 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(12,28,48,0.8)',
    borderWidth: 1,
    borderColor: OB.glassBorder,
    borderRadius: OB.r16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textArea: { flex: 1 },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 21,
    color: OB.t70,
  },
  strong: { fontWeight: '700', color: OB.t100 },
  cursorBar: {
    width: 2,
    height: 14,
    marginLeft: 2,
    backgroundColor: OB.teal,
    alignSelf: 'center',
  },
});
