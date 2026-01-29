// global login screen that redirects to Auth0 for authentication
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getAuth0Client } from '@/lib/auth0';

let redirecting = false;

export default function LoginScreen() {
  useEffect(() => {
    (async () => {
      if (redirecting) return;
      redirecting = true;

      const auth0 = await getAuth0Client();

      const isAuth = await auth0.isAuthenticated();
      if (!isAuth) {
        await auth0.loginWithRedirect();
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
