import { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { getAuth0Client } from '@/lib/auth0';
import { apiFetch } from '@/lib/api';

type ProfileResponse = {
  user: { auth0_sub: string; email?: string };
  profile: {
    display_name?: string | null;
    avatar_url?: string | null;
    home_city?: string | null;
    default_lat?: number | null;
    default_lng?: number | null;
  };
  saved_locations: string[];
  notes: { id: number; campsite_id?: string | null; note: string; created_at: string }[];
};

const PROFILE_IMAGE_URL = 'https://i.imgur.com/KATOpS6.jpg';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  const displayName = useMemo(() => {
    const name =
      profile?.profile?.display_name ||
      profile?.user?.email ||
      profile?.user?.auth0_sub ||
      '';
    return String(name);
  }, [profile]);

  const getApiAccessToken = async () => {
    const auth0 = await getAuth0Client();
    const audience = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

    if (!audience) {
      throw new Error('Missing EXPO_PUBLIC_AUTH0_AUDIENCE in Expo env.');
    }

    return await auth0.getTokenSilently({
      authorizationParams: {
        audience,
        scope: 'openid profile email offline_access',
      },
    });
  };

  const loadProfile = async () => {
    setError(null);
    setLoading(true);

    try {
      const auth0 = await getAuth0Client();
      const user = await auth0.getUser();

      const userEmail = user?.email ?? '';
      const userName =
        user?.name || user?.nickname || user?.given_name || userEmail || '';

      const token = await getApiAccessToken();

      const res = await apiFetch('/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          //used to populate neon database with user info. 
          'X-User-Email': userEmail,
          'X-User-Name': userName,
        },
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(json?.error || `API error: ${res.status}`);
      }

      setProfile(json);
    } catch (e: any) {
      console.error('Profile load failed', e);
      setError(e?.message || String(e));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const logout = async () => {
    try {
      const auth0 = await getAuth0Client();
      localStorage.setItem('just_logged_out', '1');

      await auth0.logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    } catch (e) {
      console.error('Logout failed', e);
      alert('Logout failed. Check console.');
    }
  };

  // Button actions to navigate the profile sub menues. 
  const goProfile = () => {}; 
  const goSavedLocations = () => {};
  const goNotes = () => {};
  const goSettings = () => {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {}
      <View style={styles.header}>
        <Text style={styles.welcome}>
          Welcome{displayName ? ` ${displayName}` : ''}
        </Text>

        {/* temp profile image will be able to update it to Avatar image */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: PROFILE_IMAGE_URL }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Status message */}
      {loading ? (
        <View style={styles.statusRow}>
          <ActivityIndicator />
          <Text style={styles.statusText}>Loading…</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>Error: {error}</Text> : null}

      {/* Menu buttons */}
      <View style={styles.menu}>
        <MenuButton label="Profile" onPress={goProfile} />
        <MenuButton label="Saved locations" onPress={goSavedLocations} />
        <MenuButton label="Notes" onPress={goNotes} />
        <MenuButton label="Settings" onPress={goSettings} />
        <MenuButton label="Log out" onPress={logout} danger />
      </View>

      {}
      {}
    </ScrollView>
  );
}
// Menu button component for profile sub menus
function MenuButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 },
        danger && styles.menuItemDanger,
      ]}
    >
      <Text style={[styles.menuText, danger && styles.menuTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const CONTENT_WIDTH = 280;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6f2',
  },
  content: {
    paddingBottom: 22,
  },

  header: {
  paddingTop: 18,
  paddingHorizontal: 18,
  paddingBottom: 22,
  borderBottomLeftRadius: 24,
  borderBottomRightRadius: 24,
  backgroundColor: 'transparent',
  alignItems: 'center',    
  justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  welcome: {
  marginTop: 6,
  color: 'rgb(0, 0, 0)',
  fontSize: 20,
  fontWeight: '800',
  textAlign: 'center',         
},

  heroWrap: {
  marginTop: 20,
  width: CONTENT_WIDTH + 10,   
  height: CONTENT_WIDTH + 20,
  borderRadius: 24,
  overflow: 'hidden',
},
  heroImage: {
    width: '100%',
    height: '100%',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  statusText: {
    color: '#374151',
    fontSize: 13,
  },
  error: {
    color: '#b91c1c',
    fontSize: 13,
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  menu: {
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 10,
  },

 // Menu button Styles. 
  menuItem: {
  width: CONTENT_WIDTH,   
  backgroundColor: '#dd9536',
  borderRadius: 14,
  paddingVertical: 14,
  paddingHorizontal: 16,
  alignItems: 'center',
  justifyContent: 'space-between',
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
},
  menuText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '700',
  },

  menuItemDanger: {
    backgroundColor: '#c24721',
  },
  menuTextDanger: {
    color: '#000000',
  },

  debug: {
    paddingHorizontal: 18,
    paddingTop: 16,
    color: '#6b7280',
    fontSize: 12,
  },
});
