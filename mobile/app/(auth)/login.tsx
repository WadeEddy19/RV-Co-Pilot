// global login screen that redirects to Auth0 for authentication
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getAuth0Client } from '@/lib/auth0';

export default function LoginScreen() {
  useEffect(() => {
    const startLogin = async () => {
      try {
        const auth0 = await getAuth0Client();

        const isAuth = await auth0.isAuthenticated();

        if (isAuth) {
          router.replace('/(tabs)/campsites' as any);
          return;
        }

        const alreadyStarted = sessionStorage.getItem('auth0_login_started');

        if (alreadyStarted === 'true') {
          console.log('Login already started, not redirecting again.');
          return;
        }

        sessionStorage.setItem('auth0_login_started', 'true');

        await auth0.loginWithRedirect();
      } catch (err) {
        console.error('Login failed:', err);
        sessionStorage.removeItem('auth0_login_started');
      }
    };

    startLogin();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}