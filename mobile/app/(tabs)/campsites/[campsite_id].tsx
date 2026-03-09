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
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { apiFetch } from "@/lib/api";

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
  const { campsite_id } = useLocalSearchParams<{ campsite_id: string }>();
  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        
        <Text style={styles.title}>{campsite.name}</Text>

      
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

// ui design 

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
