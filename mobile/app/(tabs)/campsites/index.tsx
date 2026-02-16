/*
Shows a list of campsites and allows navigation to create screen
Made with influence from AI
*/
import { useCallback, useState } from "react";
import { View, Text, SafeAreaView, Pressable, ActivityIndicator } from "react-native"; // UI Stuff
import { router } from "expo-router"; // Routing Purposes
import { mockCampsites } from "@/src/api/mockCampsites";// Static Data for demonstration...for now
import { apiFetch } from "@/lib/api";
import { useFocusEffect } from "@react-navigation/native";


type Campsite = {
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
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [campsites, setCampsites] = useState<Campsite[]>([]);

    const load = async () => {
    setError(null); // added: clear previous error before loading
    setLoading(true); // added: start spinner
    try {
      const res = await apiFetch("/api/campsites"); // added: GET request to Flask backend
      if (!res.ok) throw new Error(`GET /api/campsites failed: ${res.status}`); // added: guard against bad response
      const data = (await res.json()) as Campsite[]; // added: parse response body
      setCampsites(data); // added: store results in state
    } catch (e: any) {
      setError(e?.message ?? "Failed to load campsites"); // added: show readable error
    } finally {
      setLoading(false); // added: stop spinner
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    
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
          campsites.map((c) => ( // changed: map over API data instead of mockCampsites
            <View key={c.campsite_id} style={{ paddingVertical: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                {c.name}
              </Text>
              <Text style={{ opacity: 0.8, color: "#ccc" }}>
                {String(c.latitude)}, {String(c.longitude)}
              </Text>
            </View>
          ))}
      </View>
    </SafeAreaView>
  );
}
