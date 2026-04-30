// Edits were made by Wade Eddy with AI assistance to connect campsites to trips.
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '@/lib/api';
import { getAuth0Client } from '@/lib/auth0';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';

type Trip = {
  _id: string;
  name: string;
  user_id: string;
  campsite_ids: string[];
  created_at: string;
  updated_at: string;
};

type AuthUser = {
  sub?: string;
  name?: string;
  email?: string;
};

export default function TripsScreen() {
  // auth user — wait until this loads before fetching trips
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [creating, setCreating] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTripName, setEditTripName] = useState('');

  // custom delete confirm so it works on native too (window.confirm is web-only)
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Linking campsites to trips using a lookup table
  const [campsites, setCampsites] = useState<Record<string, string>>({});

  // load the auth0 user once on mount so we know who we're fetching for
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const auth0 = await getAuth0Client();
        const u = await auth0.getUser();
        if (!cancelled) setAuthUser(u ?? null);
      } catch {
        if (!cancelled) setAuthUser(null);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load function responsible for fetching trips and campsites
  const load = async () => {
    if (!authUser?.sub) {
      // no user yet — bail so we don't show a stuck spinner
      setTrips([]);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const userPath = encodeURIComponent(authUser.sub);
      // grab trips + campsites at the same time
      const [tripsRes, campsitesRes] = await Promise.all([
        apiFetch(`/api/trips/user/${userPath}`),
        apiFetch('/api/campsites'),
      ]);

      if (!tripsRes.ok) throw new Error(`GET /api/trips/user failed: ${tripsRes.status}`);
      if (!campsitesRes.ok) throw new Error(`GET /api/campsites failed: ${campsitesRes.status}`);

      const tripsData = await tripsRes.json() as Trip[];
      const campsitesData = await campsitesRes.json() as { campsite_id: string; name: string }[];

      // Build the lookup table that allows to search for campsites without separate API calls
      const lookup: Record<string, string> = {};
      for (const c of campsitesData) {
        lookup[c.campsite_id] = c.name;
      }

      setTrips(tripsData);
      setCampsites(lookup);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!newTripName.trim() || !authUser?.sub || creating) return;
    setCreating(true);
    try {
      const res = await apiFetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          user_id: authUser.sub,
          name: newTripName.trim(),
        }),
      });
      if (!res.ok) throw new Error(`POST /api/trips failed: ${res.status}`);
      setNewTripName('');
      setModalVisible(false);
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create trip');
    } finally {
      setCreating(false);
    }
  };

  const requestDelete = (tripId: string) => {
    setPendingDeleteId(tripId);
    setConfirmVisible(true);
  };

  const performDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setConfirmVisible(false);
    setPendingDeleteId(null);
    try {
      const res = await apiFetch(`/api/trips/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`DELETE /api/trips failed: ${res.status}`);
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete trip');
    }
  };

  const handleEditTrip = async () => {
    if (!editTripName.trim() || !selectedTrip) return;
    try {
      const res = await apiFetch(`/api/trips/${selectedTrip._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editTripName.trim() }),
      });
      if (!res.ok) throw new Error(`PATCH /api/trips failed: ${res.status}`);
      setEditModalVisible(false);
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to edit trip');
    }
  };

  // Removes a campsite from a trip via its position in the trip's array.
  const handleRemoveFromTrip = async (trip: Trip, indexToRemove: number) => {
    try {
      // Build a new array without the campsite at indexToRemove
      const updatedIds = trip.campsite_ids.filter((_, i) => i !== indexToRemove);
      const res = await apiFetch(`/api/trips/${trip._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ campsite_ids: updatedIds }),
      });
      if (!res.ok) throw new Error(`PATCH /api/trips failed: ${res.status}`);
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to remove campsite from trip');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // reload when auth is ready or the tab gets focus again
  useFocusEffect(
    useCallback(() => {
      if (authReady) load();
    }, [authReady, authUser?.sub])
  );

  // not signed in — show a locked state instead of an empty list
  if (authReady && !authUser?.sub) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Trips</Text>
        </View>
        <View style={styles.signInState}>
          <Text style={styles.signInIcon}>🔒</Text>
          <Text style={styles.signInTitle}>Sign in to view your trips</Text>
          <Text style={styles.signInSubtitle}>
            Your trips are private to your account.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
        {trips.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#22c55e" />
            <Text style={styles.loadingText}>Loading your trips…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.errorRetry}>
              <Text style={styles.errorRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error && trips.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first trip to start planning where to camp next.
            </Text>
          </View>
        )}

        {trips.map((trip) => (
          <View key={trip._id} style={styles.tripCard}>
            <View style={styles.tripCardHeader}>
              <View style={styles.tripTitleWrap}>
                <Text style={styles.tripTitle} numberOfLines={1}>{trip.name}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {trip.campsite_ids?.length ?? 0}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.menuButton}
                hitSlop={10}
                onPress={() => {
                  setSelectedTrip(trip);
                  setMenuVisible(true);
                }}>
                <Text style={styles.menuDots}>⋮</Text>
              </TouchableOpacity>
            </View>

            {/* Show the trip's campsites by gathering from the lookup */}
            <View style={styles.tripContentContainer}>
              {trip.campsite_ids && trip.campsite_ids.length > 0 ? (
                trip.campsite_ids.map((id, index) => (
                  // Each row gives the X icon a clear hit area beside the name.
                  // Key combines id+index because duplicates would collide on id alone.
                  <View key={`${id}-${index}`} style={styles.campsiteRow}>
                    <Text style={styles.tripContent} numberOfLines={1}>
                      {campsites[id] ?? 'Unknown campsite'}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveFromTrip(trip, index)}
                      hitSlop={10}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeIcon}>✕</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.tripEmpty}>
                  No campsites yet — add some from a campsite page.
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, !authUser?.sub && styles.buttonDisabled]}
        disabled={!authUser?.sub}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>+ CREATE A TRIP</Text>
      </TouchableOpacity>

      {/* Create trip modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Trip</Text>
            <TextInput
              style={styles.input}
              placeholder="Trip name"
              placeholderTextColor="#888"
              value={newTripName}
              onChangeText={setNewTripName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateTrip}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => { setNewTripName(''); setModalVisible(false); }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateTrip}
                style={[styles.confirmBtn, (!newTripName.trim() || creating) && styles.btnDisabled]}
                disabled={!newTripName.trim() || creating}
              >
                <Text style={styles.confirmText}>{creating ? 'Creating…' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit trip modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Trip Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Trip name"
              placeholderTextColor="#888"
              value={editTripName}
              onChangeText={setEditTripName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleEditTrip}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditTrip}
                style={[styles.confirmBtn, !editTripName.trim() && styles.btnDisabled]}
                disabled={!editTripName.trim()}
              >
                <Text style={styles.confirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* delete confirm modal (replaces window.confirm) */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete trip?</Text>
            <Text style={styles.modalBody}>
              This will permanently remove this trip from your account.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => { setConfirmVisible(false); setPendingDeleteId(null); }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={performDelete} style={styles.deleteBtn}>
                <Text style={styles.confirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Trip action menu */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              setEditTripName(selectedTrip?.name ?? '');
              setEditModalVisible(true);
            }}>
              <Text style={styles.menuItemText}>✏️  Edit name</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              if (selectedTrip) requestDelete(selectedTrip._id);
            }}>
              <Text style={styles.menuItemTextDelete}>🗑️  Delete trip</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#25292e',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    width: '100%',
    paddingHorizontal: 9,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  content: {
    width: '100%',
    flexGrow: 1,
  },
  contentInner: {
    paddingBottom: 12,
  },

  // States
  loadingState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: '#3a1f24',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  errorBannerText: {
    color: '#fecaca',
    fontSize: 14,
    flex: 1,
  },
  errorRetry: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  errorRetryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  signInIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  signInTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  signInSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },

  // Trip cards
  tripCard: {
    backgroundColor: '#2f3136',
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  tripCardHeader: {
    backgroundColor: '#383c43',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2226',
  },
  tripTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flexShrink: 1,
  },
  countBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#0b3a1c',
    fontSize: 12,
    fontWeight: '800',
  },
  tripContentContainer: {
    flexDirection: 'column',
    paddingVertical: 8,
  },
  campsiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tripContent: {
    fontSize: 15,
    color: '#e5e7eb',
    flex: 1,
  },
  tripEmpty: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeIcon: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },

  // Primary CTA
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: '#374151',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Menu trigger
  menuButton: {
    paddingHorizontal: 8,
  },
  menuDots: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#2f3136',
    borderRadius: 14,
    padding: 22,
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  modalBody: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: '#1f2226',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    backgroundColor: '#4b5563',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Action menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuBox: {
    position: 'absolute',
    right: 16,
    top: 100,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemText: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  menuItemTextDelete: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
});
