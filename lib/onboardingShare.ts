import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

/**
 * Share score / blueprint preview — spec line 361 (expo-sharing with graceful fallback).
 */
export async function shareOnboardingText(title: string, body: string): Promise<void> {
  const message = `${title}\n\n${body}\n\n— TruWell AI`;

  try {
    const available = await Sharing.isAvailableAsync();
    if (available) {
      const uri = `${FileSystem.cacheDirectory ?? ''}truwell-onboarding-share.txt`;
      await FileSystem.writeAsStringAsync(uri, message);
      await Sharing.shareAsync(uri, {
        mimeType: 'text/plain',
        dialogTitle: title,
        UTI: 'public.plain-text',
      });
      return;
    }
  } catch {
    /* fall through to RN Share */
  }

  try {
    await Share.share({ message, title });
  } catch {
    /* user cancelled or share unavailable */
  }
}
