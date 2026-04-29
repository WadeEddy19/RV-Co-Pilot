// Edits were made by Wade Eddy with AI assistance to connect campsites to trips.
import { useState } from 'react';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '@/lib/api';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView
} from 'react-native';

type Trip = {
  _id: string;
  name: string;
  user_id: string;
  campsite_ids: string[];
  created_at: string;
  updated_at: string;
};

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTripName, setEditTripName] = useState('');

  // Linking campsites to trips using a lookup table
  const [campsites, setCampsites] = useState<Record<string, string>>({});

  // Load function responsible for fetching trips and campsites
  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      // Fetch trips both trips and campsites
      // Promise.all waits for both to finish before continuing
      const [tripsRes, campsitesRes] = await Promise.all([
        apiFetch('/api/trips/user/user123'),
        apiFetch('/api/campsites'),
      ]);

      // Check both responses
      if (!tripsRes.ok) throw new Error(`GET /api/trips/user failed: ${tripsRes.status}`);
      if (!campsitesRes.ok) throw new Error(`GET /api/campsites failed: ${campsitesRes.status}`);

      // Get campsite_id and name from the campsites
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
    if (!newTripName.trim()) return;
    try {
      const res = await apiFetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'user123',
          name: newTripName,
        }),
      });
      if (!res.ok) throw new Error(`POST /api/trips failed: ${res.status}`);
      setNewTripName('');
      setModalVisible(false);
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create trip');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this trip?');
    if (!confirmed) return;
    try {
      const res = await apiFetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`DELETE /api/trips failed: ${res.status}`);
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete trip');
    }
  };

  const handleEditTrip = async () => {
    if (!editTripName.trim()) return;
    try {
      const res = await apiFetch(`/api/trips/${selectedTrip?._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editTripName,
        }),
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Trips</Text>
      
      <ScrollView style={styles.content}>
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={{ color: '#f87171' }}>{error}</Text> : null}
        {!loading && !error && trips.length === 0 && (
          <Text style={{ color: '#aaaaaa', textAlign: 'center', marginTop: '15%', fontSize: 18 }}>
            No trips yet. Create one to get started!
          </Text>
        )}
        {trips.map((trip) => (
          <View key={trip._id} style={styles.tripCard}>
            <View style={styles.tripCardHeader}>
              <Text style={styles.tripTitle}>{trip.name}</Text>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  setSelectedTrip(trip);
                  setMenuVisible(true);
                }}>
                <Text style={styles.menuDots}>⋮</Text>
              </TouchableOpacity>
            </View>

            {/*Show the trips campsites by gathering from the lookup*/}
            <View style={styles.tripContentContainer}>
              {trip.campsite_ids && trip.campsite_ids.length > 0 ? (
                trip.campsite_ids.map((id, index) => (
                  // Each bullet is now a row so the X can sit beside the campsite name.
                  // Key combines id+index because duplicates would collide on id alone.
                  <View key={`${id}-${index}`} style={styles.campsiteRow}>
                    <Text style={styles.tripContent}>
                      • {campsites[id] ?? "Unknown campsite"}
                    </Text>
                    <Pressable onPress={() => handleRemoveFromTrip(trip, index)}>
                      <Text style={styles.removeIcon}>✕</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.tripContent}>No campsites yet</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>+ CREATE A TRIP</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Trip</Text>
            <TextInput
              style={styles.input}
              placeholder="Trip name"
              placeholderTextColor="#888"
              value={newTripName}
              onChangeText={setNewTripName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateTrip}>
                <Text style={styles.confirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Trip Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Trip name"
              placeholderTextColor="#888"
              value={editTripName}
              onChangeText={setEditTripName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditTrip}>
                <Text style={styles.confirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.menuOverlay} 
          onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              setEditTripName(selectedTrip?.name ?? '');
              setEditModalVisible(true);
            }}>
              <Text style={styles.menuItemText}>✏️ Edit Name</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              if (selectedTrip) handleDeleteTrip(selectedTrip._id);
            }}>
              <Text style={styles.menuItemTextDelete}>🗑️ Delete</Text>
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
    alignItems: 'center',
    backgroundColor: '#25292e',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
    flexGrow: 1,
  },
  text: {
    color: '#fff',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 20,
    width: '100%',
    textAlign: 'left',
    marginLeft: 25,
    paddingBottom: 10
  },
  tripCard: {
    backgroundColor: '#2f3136',
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
    overflow: 'hidden',
  },
  tripCardHeader: {
    backgroundColor: '#383c43',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  tripContentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  tripContent: {
    fontSize: 15,
    color: '#aaaaaa',
    margin: 20,
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#3a3f47',
    borderRadius: 12,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  cancelText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    padding: 10,
    backgroundColor: '#ff0000',
    borderRadius: 8
  },
  confirmText: {
    backgroundColor: '#ffffff',
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
    padding: 10,
    borderRadius: 8
  },
  deleteButton: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#ff0000',
    padding: 5,
    borderRadius: 8
  },
  deleteText: {
    fontSize: 18,
    color: '#ffffff'
  },
  menuButton: {
    position: 'absolute',
    right: 12,
  },
  menuDots: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuBox: {
    position: 'absolute',
    right: 16,
    top: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    padding: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
  },
  menuItemTextDelete: {
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
  },
  campsiteRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
},
  removeIcon: {
  color: '#ef4444',
  fontSize: 18,
  fontWeight: '700',
  paddingHorizontal: 12,
  paddingVertical: 4,
},
});
