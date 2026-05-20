// handles the redirect callback from Auth0 after login
import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { router } from "expo-router";
import { getAuth0Client } from "@/lib/auth0";

let handled = false;

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      if (handled) return;
      handled = true;

      try {
        console.log("Callback URL:", window.location.href);

        const auth0 = await getAuth0Client();

        await auth0.handleRedirectCallback();

        sessionStorage.removeItem("auth0_login_started");

        const isAuthenticated = await auth0.isAuthenticated();
        console.log("Auth after callback:", isAuthenticated);

        const user = await auth0.getUser();
        console.log("User after callback:", user);

        router.replace("/(tabs)/campsites" as any);
      } catch (err) {
        console.error("Auth callback failed:", err);
        handled = false;
        sessionStorage.removeItem("auth0_login_started");
        router.replace("/login" as any);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator />
      <Text>Finishing login...</Text>
    </View>
  );
}