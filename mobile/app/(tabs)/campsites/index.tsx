/*
Shows a list of campsites and allows navigation to create screen
Assisted by AI tool suggestions; code reviewed and modified by Wade Eddy
Map points code added and maintained by Adam jennings
*/
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native"; // UI Stuff
import { router } from "expo-router"; // Routing Purposes
import { mockCampsites } from "@/src/api/mockCampsites";
import { apiFetch } from "@/lib/api";
import { useFocusEffect } from "@react-navigation/native";
import CampsiteMap, { CampsiteMapPoint } from "../../../components/campsites/CampsiteMap";


// Campsite Structure
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
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  // Fetching data, stores error if failure
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Stores campsite objects
   const [campsites, setCampsites] = useState<Campsite[]>([]);
   const [selectedCampsiteId, setSelectedCampsiteId] = useState<string | null>(null);
   const [focusRequestId, setFocusRequestId] = useState(0);

   const mapPoints: CampsiteMapPoint[] = campsites.flatMap((c) => {
    const latitude = typeof c.latitude === "number" ? c.latitude : Number(c.latitude);
    const longitude = typeof c.longitude === "number" ? c.longitude : Number(c.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    // Campsite structure
    return [
      {
        id: c.campsite_id,
        name: c.name,
        latitude,
        longitude,
        campsiteType: c.campsite_type ?? null,
        amenities: c.amenities ?? null,
        notes: c.notes ?? null,
      },
    ];
   });

  useEffect(() => {
    if (!mapPoints.length) {
      setSelectedCampsiteId(null);
      return;
    }

    const hasSelected = mapPoints.some((point) => point.id === selectedCampsiteId);
    if (!hasSelected) setSelectedCampsiteId(mapPoints[0].id);
  }, [mapPoints, selectedCampsiteId]);

  const focusCampsite = (campsiteId: string) => {
    setSelectedCampsiteId(campsiteId);
    setFocusRequestId((id) => id + 1);
  };

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
      <View style={styles.content}>
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

        <View style={[styles.main, isWide ? styles.mainWide : styles.mainStack]}>
          <View style={[styles.listPane, isWide ? styles.listPaneWide : null]}>
            {loading ? <ActivityIndicator /> : null}
            {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}

            
            {!loading && !error ? ( // Loading with spinner and error display
              <ScrollView contentContainerStyle={styles.listContent}>
                {campsites.map((c) => ( // Campsite List Display
                  <Pressable
                    key={c.campsite_id}
                    onPress={() => focusCampsite(c.campsite_id)} // Focus on campsite on the map
                    style={[
                      styles.campsiteRow,
                      selectedCampsiteId === c.campsite_id ? styles.campsiteRowActive : null,
                    ]}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                          {c.name}
                        </Text>
                        <Text style={{ opacity: 0.8, color: "#ccc" }}>
                          {String(c.latitude)}, {String(c.longitude)}
                        </Text>
                      </View>
                      <Pressable // View button to navigate to campsite screen
                        onPress={() => router.push(`/campsites/${c.campsite_id}` as any)}
                                                style={styles.detailButton}
                                        >
                                        <Text style={styles.detailButtonText}>Full Details</Text>
                                                              </Pressable>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View style={[styles.mapPane, isWide ? styles.mapPaneWide : styles.mapPaneStack]}>
            {!loading && !error ? (
              <CampsiteMap
                points={mapPoints}
                fill={isWide}
                selectedPointId={selectedCampsiteId}
                onSelectPoint={setSelectedCampsiteId}
                focusRequestId={focusRequestId}
              />
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  main: {
    flex: 1,
    minHeight: 0,
    gap: 12,
  },
  mainWide: {
    flexDirection: "row",
  },
  mainStack: {
    flexDirection: "column",
  },
  listPane: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    padding: 12,
    minHeight: 0,
  },
  listPaneWide: {
    width: 340,
    maxWidth: "40%",
  },
  listContent: {
    paddingBottom: 6,
  },
  campsiteRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    borderRadius: 8,
  },
  campsiteRowActive: {
    backgroundColor: "#334155",
  },
  mapPane: {
    flex: 1,
    minHeight: 280,
  },
  mapPaneWide: {
    minWidth: 0,
  },
  mapPaneStack: {
    height: 320,
  },
  detailButton: {
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
  },
  detailButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
