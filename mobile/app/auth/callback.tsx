// handles the redirect callback from Auth0 after login
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getAuth0Client } from '@/lib/auth0';

let handled = false;

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      if (handled) return;
      handled = true;

      const auth0 = await getAuth0Client();
      await auth0.handleRedirectCallback();

      router.replace('/(tabs)/campsites' as any);
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
