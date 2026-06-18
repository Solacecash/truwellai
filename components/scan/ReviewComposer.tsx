import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlowCard } from '@/components/ui/GlowCard';
import { supabase } from '@/lib/supabase';
import { useRewardStore } from '@/stores/rewardStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  /** When set, review is linked to `products` row for SafeCircle context */
  barcode?: string | null;
  productLabel: string;
};

export function ReviewComposer({ barcode, productLabel }: Props) {
  const [rating, setRating] = useState(4);
  const [body, setBody] = useState('');
  const queryClient = useQueryClient();
  const addXp = useRewardStore((s) => s.addXp);

  const mutation = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error('Sign in to post a review.');

      let productId: string | null = null;
      if (barcode) {
        const clean = String(barcode).replace(/\D/g, '');
        if (clean.length >= 8) {
          const { data: prod } = await supabase
            .from('barcode_products')
            .select('id')
            .eq('barcode', clean)
            .maybeSingle();
          productId = prod?.id ?? null;
        }
      }

      const { error } = await supabase.from('product_reviews').insert({
        user_id: uid,
        product_id: productId,
        rating,
        body: body.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      addXp(15);
      setBody('');
      void queryClient.invalidateQueries({ queryKey: ['community-reviews'] });
    },
  });

  return (
    <GlowCard style={styles.card}>
      <Text style={[typography.headlineSm, styles.h]}>Rate this product</Text>
      <Text style={[typography.caption, styles.sub]} numberOfLines={2}>
        {productLabel}
      </Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
            <Text style={[styles.star, n <= rating && styles.starOn]}>{n <= rating ? '★' : '☆'}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Optional short note for the community"
        placeholderTextColor={colors.textMuted}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={280}
      />
      <PrimaryButton
        label={mutation.isPending ? 'Posting…' : 'Post review'}
        onPress={() => mutation.mutate()}
        loading={mutation.isPending}
        disabled={mutation.isPending}
      />
      {mutation.isError ? (
        <Text style={[typography.caption, styles.err]}>{(mutation.error as Error).message}</Text>
      ) : null}
      {mutation.isSuccess ? (
        <Text style={[typography.caption, styles.ok]}>Thanks, +15 XP</Text>
      ) : null}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  h: { marginBottom: 4 },
  sub: { marginBottom: 10 },
  stars: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  star: { fontSize: 28, color: colors.textMuted },
  starOn: { color: colors.accentGold },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    color: colors.textPrimary,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  err: { color: '#ff8a80', marginTop: 8 },
  ok: { color: colors.tealGlow, marginTop: 8 },
});
