import { useState } from 'react';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '@/lib/api';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Collapsible } from '@/components/ui/collapsible';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { red } from 'react-native-reanimated/lib/typescript/Colors';

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

  const load = async () => {
  setError(null);
  setLoading(true);
  try {
    const res = await apiFetch('/api/trips/user/user123');
    if (!res.ok) throw new Error(`GET /api/trips/user failed: ${res.status}`);
    const data = await res.json() as Trip[];
    setTrips(data);
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Trips</Text>
      
      <View style={styles.content}>
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={{ color: '#f87171' }}>{error}</Text> : null}
        {trips.map((trip) => (
          <View key={trip._id} style={styles.tripCard}>
            <View style={styles.tripCardHeader}>
              <Text style={styles.tripTitle}>{trip.name}</Text>
            </View>
          </View>
        ))}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#25292e',
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  text: {
    color: '#fff',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 20,
  },
  tripCard: {
    backgroundColor: '#3949ab',
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
    overflow: 'hidden',
  },
  tripCardHeader: {
    backgroundColor: 'white',
    padding: 16,
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  tripContentContainer: {
    flexDirection: 'column',
    alignItems: 'center'
  },
  tripContent: {
    fontSize: 15,
    color: 'white',
    margin: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20
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
  }
});
