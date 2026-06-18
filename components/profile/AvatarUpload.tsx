import React, { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  userId:            string;
  currentAvatarUrl?: string | null;
  displayName?:      string;
  size?:             number;
  onUploadComplete:  (publicUrl: string) => void;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  displayName,
  size = 90,
  onUploadComplete,
}: Props) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [localUri,  setLocalUri]  = useState<string | null>(null);

  const initials = (displayName ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const displayUri = localUri ?? currentAvatarUrl;

  const upload = async (pickerResult: ImagePicker.ImagePickerResult) => {
    if (pickerResult.canceled || !pickerResult.assets[0]) return;
    const asset = pickerResult.assets[0];
    setLocalUri(asset.uri);
    setUploading(true);
    try {
      const fetchRes = await fetch(asset.uri);
      const blob     = await fetchRes.blob();
      const path     = `${userId}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // Bust cache with timestamp
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      onUploadComplete(publicUrl);
    } catch (err) {
      setLocalUri(null);
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openPicker = async (fromCamera: boolean) => {
    const fn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const res = await fn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    await upload(res);
  };

  const handlePress = () => {
    if (uploading) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) void openPicker(true); if (i === 2) void openPicker(false); }
      );
    } else {
      Alert.alert('Profile Photo', 'Select source', [
        { text: 'Take Photo',           onPress: () => void openPicker(true)  },
        { text: 'Choose from Library',  onPress: () => void openPicker(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <Pressable onPress={handlePress} style={[styles.wrap, { width: size, height: size }]}>
      {/* Avatar circle */}
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: `${theme.teal}22`, borderColor: `${theme.teal}44` },
        ]}
      >
        {displayUri ? (
          <Image source={{ uri: displayUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <Text style={[styles.initials, { color: theme.teal, fontSize: size * 0.35 }]}>{initials}</Text>
        )}
        {uploading && (
          <View style={[StyleSheet.absoluteFill, styles.uploadingOverlay, { borderRadius: size / 2 }]}>
            <ActivityIndicator color={theme.teal} />
          </View>
        )}
      </View>

      {/* Camera icon badge */}
      {!uploading && (
        <View style={[styles.cameraBadge, { backgroundColor: theme.teal, borderColor: theme.bg0 }]}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              stroke="#fff" strokeWidth={2} strokeLinejoin="round"
            />
            <Path d="M12 13m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0" stroke="#fff" strokeWidth={2} />
          </Svg>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap:            { alignSelf: 'center', marginBottom: 20 },
  circle:          { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials:        { fontWeight: '800' },
  uploadingOverlay:{ backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  cameraBadge: {
    position:       'absolute',
    bottom:         0,
    right:          0,
    width:          26,
    height:         26,
    borderRadius:   13,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
