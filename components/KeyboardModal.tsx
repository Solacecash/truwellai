import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
};

/** Keyboard-safe wrapper for full-screen or bottom-sheet modals with inputs */
export function KeyboardModal({
  visible,
  onRequestClose,
  children,
  footer,
  sheetStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, sheetStyle]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              padding: 24,
              paddingBottom: footer ? 16 : 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer ? (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              {footer}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111D26',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
