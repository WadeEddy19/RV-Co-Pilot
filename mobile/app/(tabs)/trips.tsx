// Edits were made by Wade Eddy with AI assistance to connect campsites to trips.
import { useState } from 'react';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch} from '@/lib/api';
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
}
