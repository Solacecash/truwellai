import * as ImagePicker from 'expo-image-picker';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/lib/supabase';

export async function pickAndUploadProfileAvatar(
  userId: string
): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission needed',
      'Allow photo access to add a profile picture.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;

  const asset = result.assets[0];
  const uri = asset.uri;
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
    ? ext
    : 'jpg';
  const mimeType =
    safeExt === 'png'
      ? 'image/png'
      : safeExt === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

  const path = `${userId}/avatar.${safeExt}`;

  // Read as base64 — works on both iOS and Android local URIs
  const base64 = await readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  });

  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Add cache-busting param so React Native reloads the new image
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) throw profileError;

  return publicUrl;
}
