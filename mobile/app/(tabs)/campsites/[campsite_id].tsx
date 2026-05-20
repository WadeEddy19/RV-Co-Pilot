/*
  Campsite Detail Screen
  Fetches and displays all attributes for a single campsite.
  Assisted by AI tool suggestions; code reviewed and modified by Wade Eddy
*/
import { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { apiFetch } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { getAuth0Client } from "@/lib/auth0";

// Campsite Structure
type Campsite = {
  _id: string;
  campsite_id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  campsite_type?: string | null;
  amenities?: string[] | string | null;
  notes?: string | null;
  is_private?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Trip = {
  _id: string;
  name: string;
  user_id: string;
  campsite_ids: string[];
};

type AuthUser = {
  sub?: string;
  name?: string;
  email?: string;
};


export default function CampsiteDetailScreen() {
  // Gather campsite object and handle loading
  const { campsite_id } = useLocalSearchParams<{ campsite_id: string }>();
  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing 
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editAmenities, setEditAmenities] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");

  // Auth user loaded once on mount, used to fetch this user's trips
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Add to trip
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [addingToTrip, setAddingToTrip] = useState(false);

  // Load the Auth0 user once on mount so we know who's logged in.
  // Mirrors the pattern in trips.tsx
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

  // Fetch single campsite from backend with error handling
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/campsites/${campsite_id}`);
        if (!res.ok) throw new Error(`Failed to load campsite (${res.status})`);
        const data = (await res.json()) as Campsite;
        setCampsite(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load campsite");
      } finally {
        setLoading(false);
      }
    };
    if (campsite_id) load();
  }, [campsite_id]);

const getApiAccessToken = async () => {
  const auth0 = await getAuth0Client();
  const audience = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

  if (!audience) throw new Error("Missing EXPO_PUBLIC_AUTH0_AUDIENCE.");

  return await auth0.getTokenSilently({
    authorizationParams: {
      audience,
      scope: "openid profile email offline_access",
    },
  });
};

const handleAddToFavorites = async () => {
  try {
    const token = await getApiAccessToken();

    const res = await apiFetch("/api/saved-locations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        campsite_id: campsite!.campsite_id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to add to favorites");
    }

    window.alert("Added to favorites ⭐");
  } catch (err: any) {
    console.error("Add to favorites failed:", err);
    window.alert(err?.message || "Failed to add to favorites");
  }
};

// Web Friendly delete
const handleDelete = async () => {
  if (!window.confirm("Delete this campsite? This cannot be undone.")) return;

  try {
    const res = await apiFetch(`/api/campsites/${campsite!._id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    router.back();
  } catch (e: any) {
    window.alert(e?.message ?? "Failed to delete");
  }
};

// Edit and save edits with error handling
const handleEditOpen = () => {
  setEditName(campsite!.name);
  setEditType(campsite!.campsite_type ?? "");
  setEditAmenities(Array.isArray(campsite!.amenities) ? campsite!.amenities.join(", ") : campsite!.amenities ?? "");
  setEditNotes(campsite!.notes ?? "");
  setEditing(true);
  setEditLatitude(String(campsite!.latitude));
  setEditLongitude(String(campsite!.longitude));
};

// Saves updated campsite page and converts amenities back into array for proper display
const handleSave = async () => {
  setSaving(true);
  try {
    const res = await apiFetch(`/api/campsites/${campsite!._id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: editName.trim(),
        campsite_type: editType.trim() || undefined,
        amenities: editAmenities.split(",").map((a) => a.trim()).filter(Boolean),
        notes: editNotes.trim() || undefined,
        latitude: parseFloat(editLatitude),
        longitude: parseFloat(editLongitude),
      }),
    });
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
    const updated = await res.json();
    setCampsite(updated);
    setEditing(false);
  } catch (e: any) {
    Alert.alert("Error", e?.message ?? "Failed to save");
  } finally {
    setSaving(false);
  }
};

// Opens Add to Trip modal and loads this user's trips from the backend.
const handleAddToTripOpen = async () => {
  // Fail if we don't have a logged in user
  if (!authUser?.sub) {
    window.alert("You must be signed in to add campsites to trips.");
    return;
  }

  setTripModalVisible(true);
  setLoadingTrips(true);
  try {
    const userPath = encodeURIComponent(authUser.sub);
    const res = await apiFetch(`/api/trips/user/${userPath}`);
    if (!res.ok) throw new Error(`Failed to load trips (${res.status})`);
    const data = (await res.json()) as Trip[];
    setTrips(data);
  } catch (e: any) {
    window.alert(e?.message ?? "Failed to load trips");
    setTrips([]);
  } finally {
    setLoadingTrips(false);
  }
};

// Actual adding process
const handleAddToTrip = async (trip: Trip) => {
   // Stop if this campsite is already in the trip
  if ((trip.campsite_ids ?? []).includes(campsite!.campsite_id)) {
    window.alert("Campsite already in trip");
    return;
  }
  setAddingToTrip(true);
  try {
    const updatedIds = [...(trip.campsite_ids ?? []), campsite!.campsite_id];
    const res = await apiFetch(`/api/trips/${trip._id}`, {
      method: "PATCH",
      body: JSON.stringify({ campsite_ids: updatedIds }),
    });
    if (!res.ok) throw new Error(`Failed to add to trip (${res.status})`);
    window.alert(`Added "${campsite!.name}" to "${trip.name}"`);
    setTripModalVisible(false);
  } catch (e: any) {
    window.alert(e?.message ?? "Failed to add campsite to trip");
  } finally {
    setAddingToTrip(false);
  }
};

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (error || !campsite) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Campsite not found"}</Text>
      </SafeAreaView>
    );
  }

  // Ensure separated amenities
  const amenityList: string[] =
    Array.isArray(campsite.amenities)
      ? campsite.amenities
      : typeof campsite.amenities === "string" && campsite.amenities
      ? campsite.amenities.split(",").map((a) => a.trim()).filter(Boolean)
      : [];

  // UI: Displays campsite title with edit and delete buttons and current editing state
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/*Adds delete and Edit buttons*/}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.title}>{campsite.name}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={handleEditOpen} style={[styles.actionButton, { backgroundColor: "#3b82f6" }]}>
              <Text style={styles.actionButtonText}>Edit</Text>
            </Pressable>
            <Pressable onPress={handleDelete} style={[styles.actionButton, { backgroundColor: "#ef4444" }]}>
              <Text style={styles.actionButtonText}>Delete</Text>
            </Pressable>
            <Pressable
                onPress={handleAddToTripOpen}
                disabled={!authReady || !authUser?.sub}
                style={[
                  styles.actionButton,
                  { backgroundColor: "#22c55e" },
                  (!authReady || !authUser?.sub) && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.actionButtonText}>Add to Trip</Text>
            </Pressable>
            <Pressable onPress={handleAddToFavorites}
                       style={[styles.actionButton, { backgroundColor: "#f59e0b" }]}
  >
              <Ionicons name="star-outline" size={18} color="white" />
            </Pressable>
          </View>
        </View>

        {/*Edit form grabbed setup from the create page*/}
        {editing && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Edit Campsite</Text>
            <TextInput value={editName} onChangeText={setEditName} placeholder="Name" placeholderTextColor="#888" style={styles.input} />
            <TextInput value={editType} onChangeText={setEditType} placeholder="Type" placeholderTextColor="#888" style={styles.input} />
            <TextInput value={editLatitude} onChangeText={setEditLatitude} placeholder="Latitude" keyboardType="numeric" placeholderTextColor="#888" style={styles.input} />
            <TextInput value={editLongitude} onChangeText={setEditLongitude} placeholder="Longitude" keyboardType="numeric" placeholderTextColor="#888" style={styles.input} />
            <TextInput value={editAmenities} onChangeText={setEditAmenities} placeholder="Amenities (comma separated)" placeholderTextColor="#888" style={styles.input} />
            <TextInput value={editNotes} onChangeText={setEditNotes} placeholder="Notes" placeholderTextColor="#888" multiline style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={handleSave} disabled={saving} style={[styles.actionButton, { backgroundColor: "#22c55e", flex: 1, alignItems: "center" }]}>
                <Text style={styles.actionButtonText}>{saving ? "Saving..." : "Save"}</Text>
              </Pressable>
              <Pressable onPress={() => setEditing(false)} style={[styles.actionButton, { backgroundColor: "#6b7280", flex: 1, alignItems: "center" }]}>
                <Text style={styles.actionButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

      
        <Section label="Coordinates">
          <Row label="Latitude"  value={String(campsite.latitude)} />
          <Row label="Longitude" value={String(campsite.longitude)} />
        </Section>

       
        {!!campsite.campsite_type && (
          <Section label="Type">
            <Text style={styles.value}>{campsite.campsite_type}</Text>
          </Section>
        )}

        
        {amenityList.length > 0 && (
          <Section label="Amenities">
            <View style={styles.tagRow}>
              {amenityList.map((a) => (
                <View key={a} style={styles.tag}>
                  <Text style={styles.tagText}>{a}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        
        {!!campsite.notes && (
          <Section label="Notes">
            <Text style={styles.value}>{campsite.notes}</Text>
          </Section>
        )}

        
        <Section label="Visibility">
          <Text style={styles.value}>
            {campsite.is_private ? "Private" : "Public"}
          </Text>
        </Section>

      </ScrollView>
      {/* Add to Trip modal.
          Shows a spinner while trips load, a friendly message if the user has no trips,
          and a scrollable list of trips otherwise. Each trip is pressable to add this campsite. */}
      <Modal visible={tripModalVisible} transparent animationType="fade" onRequestClose={() => setTripModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add to Trip</Text>

            {loadingTrips ? (
              <ActivityIndicator color="#3b82f6" />
            ) : trips.length === 0 ? (
              <Text style={styles.emptyText}>No trips yet. Create one first.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {trips.map((trip) => (
                  <Pressable
                    key={trip._id}
                    onPress={() => handleAddToTrip(trip)}
                    disabled={addingToTrip}
                    style={styles.tripOption}
                  >
                    <Text style={styles.tripOptionText}>{trip.name}</Text>
                    <Text style={styles.tripOptionCount}>
                      {trip.campsite_ids?.length ?? 0} campsite{(trip.campsite_ids?.length ?? 0) === 1 ? "" : "s"}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Pressable
              onPress={() => setTripModalVisible(false)}
              style={[styles.actionButton, { backgroundColor: "#6b7280", alignItems: "center", marginTop: 12 }]}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// helper components 

function Section({
  label, 
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// ui style 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#25292e" },
  centered: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, gap: 16 },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },

  section: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  sectionLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  value: { color: "#fff", fontSize: 15 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  actionButton: {
  paddingVertical: 7,
  paddingHorizontal: 14,
  borderRadius: 8,
},
actionButtonText: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 13,
},
input: {
  backgroundColor: "#374151",
  color: "#fff",
  padding: 10,
  borderRadius: 8,
  fontSize: 14,
},
  rowLabel: { color: "#9ca3af", fontSize: 14 },
  rowValue: { color: "#fff", fontSize: 14, fontWeight: "600" },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#374151",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { color: "#e5e7eb", fontSize: 13 },

  errorText: { color: "#f87171", fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    maxWidth: 420,
    backgroundColor: "#1f2937",
    borderRadius: 14,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    paddingVertical: 20,
    textAlign: "center",
  },
  tripOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#374151",
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripOptionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  tripOptionCount: {
    color: "#9ca3af",
    fontSize: 12,
  },

});
