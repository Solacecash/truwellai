import { LevelUpModal } from '@/components/rewards/LevelUpModal';
import { TabBar } from '@/components/ui/TabBar';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <>
      <LevelUpModal />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="scan" />
        <Tabs.Screen name="wellness" />
        <Tabs.Screen name="safecircle" />
        <Tabs.Screen name="profile" options={{ href: '/(tabs)/profile' }} />
        {/* Hidden entry-point tab used by login/post-signup routing to
            unambiguously reach this Tabs group. See enter.tsx for details. */}
        <Tabs.Screen name="enter" options={{ href: null }} />
      </Tabs>
    </>
  );
}
