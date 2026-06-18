import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

const GOLD = '#C9A84C';

interface Props {
  onPress?: () => void;
  label?: string;
}

function LockIconSmall() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UpgradeChip({ onPress, label }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/settings/subscription');
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.75} hitSlop={6}>
      <View style={styles.chip}>
        <LockIconSmall />
        <Text style={styles.chipText}>{label ?? 'Upgrade'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,168,76,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 9, fontWeight: '800', color: GOLD },
});
