/*
Navigation hub for campsites
Assisted by AI tool suggestions; code reviewed and modified by Wade Eddy
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
