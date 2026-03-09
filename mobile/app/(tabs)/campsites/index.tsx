/*
Shows a list of campsites and allows navigation to create screen
Assisted by AI tool suggestions; code reviewed and modified by Wade Eddy
*/
import { useCallback, useState } from "react";
import { View, Text, SafeAreaView, Pressable, ActivityIndicator } from "react-native"; // UI Stuff
import { router } from "expo-router"; // Routing Purposes
import { apiFetch } from "@/lib/api";
import { useFocusEffect } from "@react-navigation/native";

// Campsite Structure
type Campsite = {
  _id: string;
  campsite_id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  campsite_type?: string | null;
  amenities?: string[] | null;
  notes?: string | null;
};

// Main page view
export default function CampsiteScreen() {
  // Fetching data, stores error if failure
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Stores campsite objects
   const [campsites, setCampsites] = useState<Campsite[]>([]);

    // Gets campsites from the backend
    const load = async () => {
    setError(null);
    setLoading(true);
    // Actual fetching process with error handling
    try {
      const res = await apiFetch("/api/campsites");
      if (!res.ok) throw new Error(`GET /api/campsites failed: ${res.status}`);
      const data = (await res.json()) as Campsite[];
      setCampsites(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load campsites");
    } finally {
      setLoading(false);
    }
  };

  // re-loads the screen 
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    // Page Layout
    <SafeAreaView style={{ flex: 1, backgroundColor: "#25292e" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Pressable // Create Campsite Button
          onPress={() => router.push("/campsites/create")}
          style={{
            alignSelf: "flex-start",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: "#3b82f6",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>+ Add Campsite</Text>
        </Pressable>

        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
 
       {!loading &&
          !error &&
          campsites.map((c) => (
            <Pressable
              key={c._id}
              onPress={() => router.push(`/campsites/${c._id}` as any)}
              style={({ pressed }) => ({
                paddingVertical: 14,
                paddingHorizontal: 14,
                backgroundColor: pressed ? "#374151" : "#1f2937",
                borderRadius: 12,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                {c.name}
              </Text>
              <Text style={{ opacity: 0.7, color: "#ccc", marginTop: 2 }}>
                {String(c.latitude)}, {String(c.longitude)}
              </Text>
              {!!c.campsite_type && (
                <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
                  {c.campsite_type}
                </Text>
              )}
            </Pressable>
          ))}
      </View>
    </SafeAreaView>
  );
}
