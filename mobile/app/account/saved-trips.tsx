
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, ActivityIndicator, ImageBackground } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { apiFetch} from '@/lib/api';

const CAMPING_IMAGES = [
  "https://i.imgur.com/xXO2uAj.jpeg",
  "https://i.imgur.com/nkK2HCa.jpeg",
  "https://i.imgur.com/eaT7Ibi.jpeg",
];

const getRandomCampingImage = (campsiteId: string) => {
  let hash = 0;

  for (let i = 0; i < campsiteId.length; i++) {
    hash = campsiteId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return CAMPING_IMAGES[Math.abs(hash) % CAMPING_IMAGES.length];
};


export default function SavedTripsScreen() {
    const [loading, setLoading] = useState(true);
  const [savedCampsites, setSavedCampsites] = useState<any[]>([]);

  const loadSavedTrips = async () => {
    setLoading(true);

    try {
      const profileRes = await apiFetch('/api/profile');
      const profileData = await profileRes.json();

      const savedLocations = profileData.saved_locations || [];

      const campsites = await Promise.all(
        savedLocations.map(async (item: any) => {
          const res = await apiFetch(`/api/campsites/${item.campsite_id}`);
          if (!res.ok) return null;
          return await res.json();
        })
      );

      setSavedCampsites(campsites.filter(Boolean));
    } catch (err) {
      console.error('Failed to load saved trips:', err);
      setSavedCampsites([]);
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveFavorite = async (campsiteId: string) => {
  try {
    const res = await apiFetch(`/api/saved-locations/${campsiteId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to remove favorite');
    }

    setSavedCampsites((prev) =>
      prev.filter((c) => c.campsite_id !== campsiteId)
    );
  } catch (err) {
    console.error('Remove favorite failed:', err);
  }
};

  useFocusEffect(
    useCallback(() => {
      loadSavedTrips();
    }, [])
  );
  // Main screen for viewing user saved trips.
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Saved Trips</Text>
          <View style={styles.iconBtn} />
        </View>
      </View>

      <View style={styles.groups}>
        <View style={styles.group}>
          {loading ? (
  <ActivityIndicator />
) : savedCampsites.length === 0 ? (
  <View style={styles.empty}>
    <Ionicons name="map-outline" size={22} color="#6b7280" />
    <Text style={styles.emptyTitle}>No saved trips yet</Text>
    <Text style={styles.emptySub}>Tap the star on a campsite to save it here.</Text>
  </View>
) : (
  savedCampsites.map((campsite) => (
  <Pressable
    key={campsite.campsite_id}
    style={styles.tripCard}
    onPress={() => router.push(`/campsites/${campsite.campsite_id}` as any)}
  >
    <ImageBackground
      source={{ uri: getRandomCampingImage(campsite.campsite_id) }}
      style={styles.tripThumb}
      imageStyle={styles.tripThumbImage}
    />

    <View style={styles.tripInfo}>
      <Text style={styles.tripTitle} numberOfLines={1}>
        {campsite.name}
      </Text>
      <Text style={styles.tripDesc} numberOfLines={2}>
        {campsite.campsite_type || 'Favorite campsite'}
      </Text>
    </View>

    <Pressable
      onPress={() => handleRemoveFavorite(campsite.campsite_id)}
      style={styles.deleteBtn}
    >
      <Ionicons name="trash-outline" size={18} color="#ef4444" />
    </Pressable>
  </Pressable>
))
)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060cb1' },
  content: { paddingBottom: 26 },
  header: { backgroundColor: '#060cb1', paddingTop: Platform.OS === 'ios' ? 18 : 18, paddingHorizontal: 16, paddingBottom: 12 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },

  groups: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  group: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', padding: 18 },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 18 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  emptySub: { fontSize: 12, fontWeight: '600', color: '#6b7280', textAlign: 'center' },

    savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  savedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  savedSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 3,
  },
  deleteBtn: {
  padding: 6,
},
tripCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 10,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
},
tripThumb: {
  width: 74,
  height: 74,
  overflow: 'hidden',
},
tripThumbImage: {
  borderRadius: 12,
},
tripInfo: {
  flex: 1,
  marginLeft: 12,
},
tripTitle: {
  fontSize: 15,
  fontWeight: '900',
  color: '#111827',
},
tripDesc: {
  fontSize: 12,
  color: '#6b7280',
  marginTop: 4,
  lineHeight: 16,
},
});
