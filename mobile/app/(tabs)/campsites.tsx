import { View, Text, SafeAreaView } from "react-native";
import { mockCampsites } from "@/src/api/mockCampsites";

export default function CampsiteScreen() {
  return (
    // Creates safe area so the campsites aren't displayed in the status bar
    <SafeAreaView style={{ flex: 1, backgroundColor: "#25292e"}}>
      
      <View style={{ padding: 16, flexDirection: "column", gap: 12 }}>
            {mockCampsites.map((c) => (
              <View key={c.id} style={{ paddingVertical: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>{c.name}</Text>
                <Text style={{ opacity: 0.8, color: "#ccc" }}>
                  {c.type} • {c.amenities.join(", ")}
                </Text>
                {c.notes ? <Text style={{ opacity: 0.7, color: "#aaa" }}>{c.notes}</Text> : null}
              </View>
            ))}
          </View>
      </SafeAreaView>
  );
}

