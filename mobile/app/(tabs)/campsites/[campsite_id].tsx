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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { apiFetch } from "@/lib/api";

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
});
