/**
 * Member dashboard entry point.
 *
 * This screen exists solely to give login / post-signup routing a
 * UNIQUE, unambiguous path (/enter) that only exists inside app/(tabs)/.
 *
 * Problem context: navigating to '/(tabs)' is ambiguous — Expo Router
 * also has an app/(expert)/(tabs)/ folder, and React Navigation resolves
 * the nearest '(tabs)' route relative to the currently-active navigator,
 * which can be the expert one. '/(tabs)/enter' (i.e. the route '/enter')
 * has no counterpart in the expert group, so it always lands here.
 *
 * Once focused, we immediately jump to the 'index' (Home) tab via the
 * Tabs navigator's own jumpTo action. We use useFocusEffect (not
 * useLayoutEffect) because the Tabs navigator has lazy:false, so this
 * component stays mounted. If login/signup redirects to /enter a second
 * time, useLayoutEffect would NOT re-fire and the user would get stuck
 * on this blank screen — useFocusEffect fires every time the tab becomes
 * focused, guaranteeing the redirect works every time.
 */
import { TabActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { View } from 'react-native';

export default function MemberEnter() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      navigation.dispatch(TabActions.jumpTo('index'));
    }, [navigation])
  );

  return <View style={{ flex: 1, backgroundColor: '#020A14' }} />;
}
