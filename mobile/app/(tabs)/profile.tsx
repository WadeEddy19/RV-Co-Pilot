import { useMemo, useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native'; 
import { Ionicons } from '@expo/vector-icons'; 
import { getAuth0Client } from '@/lib/auth0'; 
import { apiFetch } from '@/lib/api'; 
import { router, useFocusEffect } from 'expo-router'; 
import * as ImagePicker from 'expo-image-picker';



// navigation when user selects a button on the profile screen. 
const onEditProfile = () => router.push('/account/edit-profile'); 
const onSavedTrips  = () => router.push('/account/saved-trips');  
const onNotes       = () => router.push('/account/notes');        
const onSettings    = () => router.push('/account/settings');     



type ProfileResponse = {
  user: {
    auth0_sub: string;
    email?: string;
    name?: string;
    avatar_url?: string | null;
  };
  saved_locations?: any;
  notes?: any;
};

const FALLBACK_AVATAR = 'https://i.imgur.com/KATOpS6.jpg'; // Default avatar image

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true); // Tracks if profile data is currently loading.
  const [error, setError] = useState<string | null>(null); // Stores any error message from loading/logout.
  const [profile, setProfile] = useState<ProfileResponse | null>(null); // Stores the loaded profile response.

const fullName = useMemo(() => {
  return (
    profile?.user?.name ||
    (profile?.user?.email ? profile.user.email.split('@')[0] : '') ||
    'Account'
  );
}, [profile]);

  const email = useMemo(() => profile?.user?.email || '', [profile]); // Extracts the user's email for display.

  const avatarUrl = useMemo(() => {
    const url = profile?.user?.avatar_url;

    if (!url || url.trim() === '') {
      return FALLBACK_AVATAR;
    }

    return url;
  }, [profile]);

  const getApiAccessToken = async () => {
    // Gets an Auth0 access token.
    const auth0 = await getAuth0Client();
    const audience = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

    if (!audience) throw new Error('Missing EXPO_PUBLIC_AUTH0_AUDIENCE.'); 

    return await auth0.getTokenSilently({
      authorizationParams: {
        audience,
        scope: 'openid profile email offline_access',
      },
    });
  };

  const loadProfile = async () => {
    // Loads the user and profile data from Auth0 and backend API.
    setError(null);
    setLoading(true);

    try {
      const auth0 = await getAuth0Client(); // Auth0 client for user/token calls.
      const user = await auth0.getUser(); // Reads basic user info from Auth0.

      const userEmail = user?.email ?? '';
      const userName = user?.name || user?.nickname || user?.given_name || userEmail || ''; 

      const token = await getApiAccessToken(); 

      const res = await apiFetch('/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }); // Calls backend profile endpoint with the bearer token.

      const text = await res.text(); 
      const json = text ? JSON.parse(text) : null; 

      if (!res.ok) throw new Error(json?.error || `API error: ${res.status}`); 

      setProfile(json); 
    } catch (e: any) {
      console.error('Profile load failed', e); 
      setError(e?.message || String(e));
      setProfile(null); 
    } finally {
      setLoading(false);
    }
  };

useFocusEffect(
  useCallback(() => {
    loadProfile();
  }, [])
);

  const logout = async () => {
    // Logs the user out via Auth0
    try {
      const auth0 = await getAuth0Client();
      if (typeof localStorage !== 'undefined') localStorage.setItem('just_logged_out', '1'); 

      await auth0.logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      }); // Executes the Auth0 logout.
    } catch (e) {
      console.error('Logout failed', e); 
      alert('Logout failed.'); 
    }
  };


 const onChangeAvatar = async () => {
  try {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Please allow photo library access to choose an avatar.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const fileUri = asset.uri;
    const mimeType = asset.mimeType || 'image/jpeg';
    const fileSize = asset.fileSize || 0;

    setLoading(true);
    setError(null);

    const presignRes = await apiFetch('/api/r2/avatar-upload-url', {
      method: 'POST',
      body: JSON.stringify({
        content_type: mimeType,
        file_size_bytes: fileSize,
      }),
    });

    const presignData = await presignRes.json();

    if (!presignRes.ok) {
      throw new Error(presignData.error || 'Failed to get upload URL');
    }

    const { upload_url, public_url } = presignData;

    const fileResponse = await fetch(fileUri);
    const fileBlob = await fileResponse.blob();

    const uploadRes = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
      body: fileBlob,
    });

    if (!uploadRes.ok) {
      throw new Error('Upload to Cloudflare R2 failed');
    }

    const saveRes = await apiFetch('/api/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({
        avatar_url: public_url,
      }),
    });

    const saveData = await saveRes.json();

    if (!saveRes.ok) {
      throw new Error(saveData.error || 'Failed to save avatar');
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            user: {
              ...prev.user,
              avatar_url: public_url,
            },
          }
        : prev
    );
  } catch (e: any) {
    console.error('Avatar upload failed', e);
    setError(e?.message || 'Avatar upload failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => {}} style={styles.iconBtn} accessibilityRole="button">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          <Text style={styles.headerTitle}>Account</Text>

          <Pressable onPress={() => {}} style={styles.iconBtn} accessibilityRole="button">
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.profileBlock}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} /> {}

            {/* Camera badge */}
            <Pressable onPress={onChangeAvatar} style={styles.cameraBadge} accessibilityRole="button">
              <Ionicons name="camera" size={14} color="#111827" />
            </Pressable>
          </View>

          <Text style={styles.nameText} numberOfLines={1}>
            {fullName} {}
          </Text>

          {!!email && (
            <Text style={styles.emailText} numberOfLines={1}>
              {email} {}
            </Text>
          )}

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : null} {}

          {error ? <Text style={styles.errorText}>Error: {error}</Text> : null} {}
        </View>
      </View>

      {}
      <View style={styles.cardsWrap}>
        <Card>
          <Row icon="create-outline" label="Edit Profile" onPress={onEditProfile} /> {}
          <Row icon="create-outline" label="Saved Trips" onPress={onSavedTrips} />   {}
          <Row icon="text-outline" label="Notes" onPress={onNotes} />              {}
          <Row icon="settings-outline" label="Settings" onPress={onSettings} />    {}
        </Card>

        {}
        <Pressable onPress={logout} style={styles.logoutRow} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable> {}
      </View>
    </ScrollView>
  );
}


function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>; 
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={18} color="#6b7280" />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // layout colors and spacing for the screen.
  container: {
    flex: 1,
    backgroundColor: '#030535',
  },
  content: {
    paddingBottom: 26,
  },

  // specific spacing.
  header: {
    backgroundColor: '#030535',
    paddingTop: Platform.OS === 'ios' ? 18 : 18,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },

  // Top row that holds back button, title, and settings button.
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Centered profile section that shows avatar, name, email, and status text.
  profileBlock: {
    alignItems: 'center',
    paddingTop: 18,
  },

  // Avatar and camera badge positioning.
  avatarWrap: {
    position: 'relative',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0b0b0f',
  },

  nameText: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  emailText: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Loading and error message.
  loadingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 10,
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 14,
  },

  cardsWrap: {
    backgroundColor: '#eef2ff00',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef2f7',
  },
  rowPressed: {
    backgroundColor: '#f6f7fb',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },

  // Logout button styling and layout.
  logoutRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
});