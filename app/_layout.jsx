import { Stack, useSegments, useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";

export default function RootLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const first = segments[0];

    // --- 1) KULLANICI YOK ---
    // Hiçbir yönlendirme yapma → login serbest
    if (!user) return;

    // --- 2) KULLANICI VAR ---
    // Kullanıcı login sayfasına gidiyorsa engelle
    if (first === "(auth)") {
      router.replace("/(tabs)");
    }

  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="share" />
      <Stack.Screen name="meal/[id]" />
      <Stack.Screen name="match/ChatScreen" />
    </Stack>
  );
}
