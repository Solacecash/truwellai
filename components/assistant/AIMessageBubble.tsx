import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';
import { hapticLight } from '@/lib/haptics';
import { DrTruWellAvatar } from '@/components/ai/DrTruWellAvatar';
import AIDisclosureBadge from '@/components/legal/AIDisclosureBadge';
import { LEGAL } from '@/lib/legalContent';
import { MarkdownText } from './MarkdownText';
export interface SpecialtySuggestion {
  specialty: string;
  reason: string;
}

export interface SpecialistRecommendation {
  specialist_id: string;
  name: string;
  title: string;
  reason: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  specialist_recommendation?: SpecialistRecommendation;
  specialty_suggestion?: SpecialtySuggestion;
  documentName?: string;
  documentSizeKb?: number;
  created_at: string;
}

interface Props {
  message: Message;
  onDismissSpecialty?: (messageId: string) => void;
  /** Called when the user taps the Listen button on this message. */
  onRequestListen?: (messageId: string, text: string) => void;
  /** Id of the message currently being synthesized (loading state). */
  listenLoadingId?: string | null;
  /** Id of the message currently being played (active state). */
  listenPlayingId?: string | null;
}

// ── Speaker + Stop icons for the Listen button ────────────────────────────────
function SpeakerSmallIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9v6h4l5 4V5L7 9H3z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M15 9c1.5 1 2.5 2.5 2.5 3s-1 2-2.5 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function StopSmallIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={6} y={6} width={12} height={12} rx={2} fill={color} />
    </Svg>
  );
}

// ── Document icon (for file upload bubbles) ───────────────────────────────────
function DocIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={2} width={12} height={18} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M14 2v4h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={7} y1={10} x2={15} y2={10} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={7} y1={14} x2={12} y2={14} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function UserAvatar({ theme }: { theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: `${theme.teal}22`, borderColor: `${theme.teal}44` },
      ]}
    >
      <Text style={[styles.avatarText, { color: theme.teal }]}>You</Text>
    </View>
  );
}

export function AIMessageBubble({
  message,
  onDismissSpecialty,
  onRequestListen,
  listenLoadingId,
  listenPlayingId,
}: Props) {
  const { theme } = useTheme();
  const isUser = message.role === 'user';
  const isFailed = !!(message as Message & { failed?: boolean }).failed;
  const isLoadingListen = listenLoadingId === message.id;
  const isPlayingListen = listenPlayingId === message.id;
  const canListen =
    !isUser &&
    !!onRequestListen &&
    !message.documentName &&
    message.content.trim().length > 0 &&
    !isFailed;

  return (
    <View style={[styles.wrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
      {!isUser && (
        <View style={styles.aiAvatarWrap} pointerEvents="none">
          <DrTruWellAvatar size="small" />
        </View>
      )}
      <View style={styles.bubbleContainer}>
        {message.documentName ? (
          // Document upload card
          <View
            style={[
              styles.docCard,
              { backgroundColor: `${theme.teal}12`, borderColor: `${theme.teal}35` },
            ]}
          >
            <View style={[styles.docIconWrap, { backgroundColor: `${theme.teal}22` }]}>
              <DocIcon color={theme.teal} size={16} />
            </View>
            <View style={styles.docInfo}>
              <Text style={[styles.docName, { color: theme.text1 }]} numberOfLines={2}>
                {message.documentName}
              </Text>
              {(message.documentSizeKb ?? 0) > 0 && (
                <Text style={[styles.docSize, { color: theme.text3 }]}>
                  {message.documentSizeKb} KB
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.bubble,
              isUser
                ? {
                    backgroundColor: theme.teal,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    borderBottomRightRadius: 5,
                    borderBottomLeftRadius: 20,
                  }
                : {
                    backgroundColor: 'rgba(255,255,255,0.055)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.10)',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 20,
                    borderBottomRightRadius: 20,
                    borderBottomLeftRadius: 20,
                  },
            ]}
          >
            {isUser ? (
              <Text style={[styles.text, { color: theme.bg0 }]}>
                {message.content}
              </Text>
            ) : (
              <MarkdownText
                content={message.content}
                color={theme.text2}
                accentColor={theme.text1}
                size={14}
              />
            )}
          </View>
        )}
        {!isUser && !message.documentName && message.content.trim().length > 0 && (
          <>
            <AIDisclosureBadge compact />
            <Text style={styles.aiFooter}>{LEGAL.AI_RESPONSE_FOOTER}</Text>
          </>
        )}
        {canListen && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              hapticLight();
              onRequestListen?.(message.id, message.content);
            }}
            hitSlop={6}
            style={[
              styles.listenBtn,
              {
                backgroundColor: isPlayingListen ? theme.teal : `${theme.teal}14`,
                borderColor: isPlayingListen ? theme.teal : `${theme.teal}44`,
              },
            ]}
            accessibilityLabel={
              isPlayingListen ? 'Stop reading aloud' : 'Listen to this reply'
            }
          >
            {isLoadingListen ? (
              <ActivityIndicator size="small" color={theme.teal} />
            ) : isPlayingListen ? (
              <StopSmallIcon color={theme.bg0} size={11} />
            ) : (
              <SpeakerSmallIcon color={theme.teal} size={12} />
            )}
            <Text
              style={[
                styles.listenTxt,
                { color: isPlayingListen ? theme.bg0 : theme.teal },
              ]}
            >
              {isLoadingListen ? 'Preparing audio...' : isPlayingListen ? 'Stop' : 'Listen'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {isUser && <UserAvatar theme={theme} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  aiWrapper: {
    justifyContent: 'flex-start',
  },
  bubbleContainer: {
    flex: 1,
    maxWidth: '80%',
    gap: 6,
  },
  aiAvatarWrap: {
    alignSelf: 'flex-end',
    marginRight: 0,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  listenBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  listenTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Document card
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    maxWidth: '78%',
  },
  docIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docInfo:  { flex: 1 },
  docName:  { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  docSize:  { fontSize: 11, fontWeight: '500', marginTop: 2 },
  aiFooter: {
    fontSize: 9,
    color: 'rgba(238,242,255,0.30)',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 13,
  },
});
