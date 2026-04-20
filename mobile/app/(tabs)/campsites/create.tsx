/*
Create Campsite Screen
User types in Campsite attributes and clicks Save
Assisted by AI tool suggestions; code reviewed and modified by Wade Eddy
*/
import { useState } from "react";
import { View, Text, TextInput, Pressable, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { apiFetch } from "@/lib/api";

// Beginning of the screen itself with attributes for user input
export default function CreateCampsiteScreen() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [amenities, setAmenities] = useState("");
  const [notes, setNotes] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Is save request running, helps prevent double submits and save error messages
  const [saving, setSaving] = useState(false); 
  const [error, setError] = useState<string | null>(null);

// Save Button, API calls await and sets saving to true to help prevent double submits
const onSave = async () => { 
  setError(null);
  setSaving(true); 

  // Error handling for inputs as well as cleans inputs
  try {
    const nm = name.trim();
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!nm) throw new Error("Name is required."); 
    if (!Number.isFinite(lat)) throw new Error("Latitude must be a number.");
    if (!Number.isFinite(lng)) throw new Error("Longitude must be a number.");

    // Object that is sent to API
    const payload = {
      campsite_id: String(Date.now()),
      name: nm, 
      campsite_type: type.trim() || undefined,
      amenities: amenities 
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      latitude: lat,
      longitude: lng,
      notes: notes.trim() || undefined,
    };

    // API Request itself
    const res = await apiFetch("/api/campsites", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Server error handling
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Create failed (${res.status}): ${msg}`);
    }

    router.back();
  } catch (e: any) {
    setError(e?.message ?? "Failed to create campsite");
  } finally {
    setSaving(false);
  }
};


  return (
    // UI for features: Campsite Name, Type, Amenities, Notes, latitude, longitude
    <SafeAreaView style={{ flex: 1, backgroundColor: "#25292e" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Big Sur Ridge Spot"
          placeholderTextColor="#888"
          style={{
            backgroundColor: "#1f2937",
            color: "#fff",
            padding: 12,
            borderRadius: 10,
          }}
        />

        
        <Text style={{ color: "#fff", opacity: 0.9 }}>Latitude</Text>
        <TextInput
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numeric"
          placeholderTextColor="#888"
          style={{ backgroundColor: "#1f2937", color: "#fff", padding: 12, borderRadius: 10 }}
        />

        <Text style={{ color: "#fff", opacity: 0.9 }}>Longitude</Text>
        <TextInput
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numeric"
          placeholderTextColor="#888"
          style={{ backgroundColor: "#1f2937", color: "#fff", padding: 12, borderRadius: 10 }}
        />

        <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>Type</Text>
        <TextInput
          value={type}
          onChangeText={setType}
          placeholder="e.g. Dispersed, RV Park, Campground"
          placeholderTextColor="#888"
          style={{
            backgroundColor: "#1f2937",
            color: "#fff",
            padding: 12,
            borderRadius: 10,
          }}
        />

        <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>
          Amenities (comma separated)
        </Text>
        <TextInput
          value={amenities}
          onChangeText={setAmenities}
          placeholder="e.g. Water, Toilets, Fire ring"
          placeholderTextColor="#888"
          style={{
            backgroundColor: "#1f2937",
            color: "#fff",
            padding: 12,
            borderRadius: 10,
          }}
        />

        <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          placeholderTextColor="#888"
          multiline
          style={{
            backgroundColor: "#1f2937",
            color: "#fff",
            padding: 12,
            borderRadius: 10,
            minHeight: 90,
            textAlignVertical: "top",
          }}
        />

        {error && (
  <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
        )}

        <Pressable // Save Button
          onPress={onSave}
          disabled={saving} 
          style={{
            marginTop: 8,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: "#22c55e",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Save Campsite</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
