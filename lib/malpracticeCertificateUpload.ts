import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

const MAX_BYTES = 10 * 1024 * 1024;

export async function pickAndUploadMalpracticeCertificate(
  userId: string
): Promise<{ path: string; signedUrl: string | null }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets[0]) {
    throw new Error('cancelled');
  }

  const file = result.assets[0];
  if (file.size != null && file.size > MAX_BYTES) {
    Alert.alert('File too large', 'Certificate must be under 10 MB');
    throw new Error('file_too_large');
  }

  const ext = file.name?.split('.').pop()?.toLowerCase() ?? 'pdf';
  const safeExt = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext) ? ext : 'pdf';
  const path = `${userId}/malpractice.${safeExt}`;

  const response = await fetch(file.uri);
  const blob = await response.blob();

  const mime =
    file.mimeType ??
    (safeExt === 'pdf' ? 'application/pdf' : safeExt === 'png' ? 'image/png' : 'image/jpeg');

  const { error: upErr } = await supabase.storage.from('professional-docs').upload(path, blob, {
    contentType: mime,
    upsert: true,
  });

  if (upErr) throw upErr;

  const { data: signed, error: signErr } = await supabase.storage
    .from('professional-docs')
    .createSignedUrl(path, 86400);

  if (signErr) throw signErr;

  return { path, signedUrl: signed?.signedUrl ?? null };
}
