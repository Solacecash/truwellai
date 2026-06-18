import type { ReactNode, RefObject } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type KeyboardScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  /** When true, reserve space for a fixed footer above the keyboard */
  hasFixedFooter?: boolean;
  footer?: ReactNode;
  extraPadding?: number;
  /** Default true — set false when parent already applies horizontal padding */
  horizontalPadding?: number;
  scrollRef?: RefObject<ScrollView | null>;
  keyboardVerticalOffset?: number;
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle' | 'style'>;
};

export function KeyboardScreen({
  children,
  style,
  contentStyle,
  backgroundColor = '#020B14',
  hasFixedFooter = false,
  footer,
  extraPadding = 0,
  horizontalPadding = 24,
  scrollRef,
  keyboardVerticalOffset,
  scrollProps,
}: KeyboardScreenProps) {
  const insets = useSafeAreaInsets();
  const offset =
    keyboardVerticalOffset ??
    (Platform.OS === 'ios' ? insets.top : 0);

  const bottomPad = (hasFixedFooter ? 120 : 40) + extraPadding + insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor }, style]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={offset}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: bottomPad,
            },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export const keyboardInputStyle = {
  backgroundColor: 'rgba(255,255,255,0.07)',
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.12)',
  borderRadius: 14,
  paddingVertical: 14,
  paddingHorizontal: 16,
  color: '#FFFFFF',
  fontSize: 16,
  minHeight: 52,
} as const;

export const keyboardInputFocusedBorder = '#00A878';

export const keyboardLabelStyle = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.55)',
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 1.2,
  marginBottom: 7,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
});
