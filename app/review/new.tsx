import { BackHeader } from '@/components/ui/BackHeader';
import { StarRating } from '@/components/ui/StarRating';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAGS = [
  'Great ingredients',
  'Clean label',
  'Good value',
  'Highly recommend',
  'Avoid',
  'Allergen warning',
  'Good taste',
  'Overpriced',
  'Kid-friendly',
  'Keto-friendly',
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NewReviewScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  // Pre-populated from navigation params
  const params = useLocalSearchParams<{ barcode?: string; productName?: string }>();
  const [productName, setProductName] = useState(params.productName ?? '');
  const [barcode] = useState(params.barcode ?? '');
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Toggle tag ────────────────────────────────────────────────────────────
  const toggleTag = (tag: string) => {
    hapticLight();
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ── Photo upload ──────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setPhotoBase64(res.assets[0].base64 ?? null);
    }
  };

  const uploadPhoto = async (reviewId: string): Promise<string | null> => {
    if (!photoBase64 || !userId) return null;
    try {
      const ext = 'jpg';
      const path = `${userId}/${reviewId}.${ext}`;
      const decoded = Uint8Array.from(atob(photoBase64), (c) => c.charCodeAt(0));
      const { error } = await supabase.storage
        .from('review-photos')
        .upload(path, decoded, { contentType: 'image/jpeg', upsert: true });
      if (error) return null;
      const { data } = supabase.storage.from('review-photos').getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!productName.trim()) {
      Alert.alert('Missing product', 'Please enter a product name.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Missing rating', 'Please select a star rating.');
      return;
    }
    if (!userId) {
      Alert.alert('Not signed in', 'Please sign in to leave a review.');
      return;
    }

    setSubmitting(true);
    hapticLight();

    try {
      const reviewId = `${userId}-${Date.now()}`;

      // Upload photo first (best effort)
      const photoUrl = await uploadPhoto(reviewId);

      // Insert review
      const { error } = await supabase.from('product_reviews').insert({
        id: reviewId,
        user_id: userId,
        product_name: productName.trim(),
        barcode: barcode || null,
        rating,
        body: body.trim() || null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        photo_url: photoUrl,
        helpful_count: 0,
      });

      if (error) {
        Alert.alert('Error', error.message);
        setSubmitting(false);
        return;
      }

      // Award +25 guardian points
      try {
        await supabase.rpc('increment_guardian_points', {
          user_id_input: userId,
          points_to_add: 25,
        });
      } catch {
        // best-effort
      }

      hapticSuccess();
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Write Review" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Product name ───────────────────────────────────────────── */}
          <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Product name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bg1, borderColor: theme.border, color: theme.text1 }]}
            placeholder="e.g. Organic Almond Butter"
            placeholderTextColor={theme.text3}
            value={productName}
            onChangeText={setProductName}
            returnKeyType="next"
          />

          {/* ── Star rating ────────────────────────────────────────────── */}
          <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Your rating</Text>
          <View style={styles.ratingWrap}>
            <StarRating value={rating} onChange={setRating} size={38} />
          </View>

          {/* ── Review body ────────────────────────────────────────────── */}
          <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Review (optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.inputMulti,
              { backgroundColor: theme.bg1, borderColor: theme.border, color: theme.text1 },
            ]}
            placeholder="What did you think about this product?"
            placeholderTextColor={theme.text3}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* ── Tag pills ──────────────────────────────────────────────── */}
          <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Tags (optional)</Text>
          <View style={styles.tagWrap}>
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: active ? `${theme.teal}18` : theme.bg1,
                      borderColor: active ? `${theme.teal}60` : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: active ? theme.teal : theme.text3 }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Photo upload ────────────────────────────────────────────── */}
          <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Photo (optional)</Text>
          {photoUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
              <TouchableOpacity
                onPress={() => { setPhotoUri(null); setPhotoBase64(null); }}
                style={[styles.photoRemove, { backgroundColor: `${theme.red}20`, borderColor: `${theme.red}40` }]}
              >
                <Text style={[styles.photoRemoveText, { color: theme.red }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => void pickPhoto()}
              style={[styles.photoBtn, { backgroundColor: theme.bg1, borderColor: theme.border }]}
            >
              <Text style={[styles.photoBtnIcon, { color: theme.text3 }]}>+</Text>
              <Text style={[styles.photoBtnText, { color: theme.text3 }]}>Add photo</Text>
            </TouchableOpacity>
          )}

          {/* ── Points note ─────────────────────────────────────────────── */}
          <View style={[styles.pointsNote, { backgroundColor: `${theme.gold}10`, borderColor: `${theme.gold}25` }]}>
            <Text style={[styles.pointsText, { color: theme.gold }]}>
              +25 Guardian Points awarded for submitting a review
            </Text>
          </View>

          {/* ── Submit ──────────────────────────────────────────────────── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => void submit()}
            disabled={submitting}
            style={[
              styles.submitBtn,
              {
                backgroundColor: submitting ? `${theme.teal}20` : `${theme.teal}18`,
                borderColor: `${theme.teal}50`,
                opacity: submitting ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.submitText, { color: theme.teal }]}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48, gap: 4 },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  inputMulti: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  ratingWrap: { marginBottom: 4 },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, fontWeight: '600' },

  photoBtn: {
    height: 80,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoBtnIcon: { fontSize: 24, fontWeight: '300' },
  photoBtnText: { fontSize: 13, fontWeight: '600' },
  photoPreviewWrap: { gap: 8 },
  photoPreview: { width: '100%', height: 160, borderRadius: 14 },
  photoRemove: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  photoRemoveText: { fontSize: 12, fontWeight: '700' },

  pointsNote: {
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  pointsText: { fontSize: 12, fontWeight: '700' },

  submitBtn: {
    marginTop: 14,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  submitText: { fontSize: 15, fontWeight: '800', letterSpacing: -0.1 },
});
