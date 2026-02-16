/*
Navigation hub for campsites
Made with influence from AI
*/

import { Stack } from "expo-router";

export default function CampsitesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#25292e" },
        headerTintColor: "#fff",
        contentStyle: { backgroundColor: "#25292e" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Campsites" }} />
      <Stack.Screen name="create" options={{ title: "Create Campsite" }} />
    </Stack>
  );
}
