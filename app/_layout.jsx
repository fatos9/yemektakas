import { useEffect, useState, createContext, useContext } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";

import * as Notifications from "expo-notifications";
import { useFrameworkReady } from "../hooks/useFrameworkReady";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

import { db } from "../firebase/config";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { GestureHandlerRootView } from "react-native-gesture-handler";


/* -----------------------------------------------
    PUSH NOTIFICATION GLOBAL HANDLER
----------------------------------------------- */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();


/* -----------------------------------------------
   🔥 UNREAD MESSAGE CONTEXT (global state)
----------------------------------------------- */
const UnreadMessageContext = createContext();

export function useUnreadMessages() {
  return useContext(UnreadMessageContext);
}

function UnreadMessageProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.id)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let total = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!data.messages) return;

        const hasUnread = data.messages.some(
          (msg) =>
            msg.sender !== user.id &&
            (!msg.readBy || !msg.readBy.includes(user.id))
        );

        if (hasUnread) total++;
      });

      setUnreadCount(total);
    });

    return () => unsub();
  }, [user]);

  return (
    <UnreadMessageContext.Provider value={unreadCount}>
      {children}
    </UnreadMessageContext.Provider>
  );
}


/* -----------------------------------------------
    🔥 Root Navigation Logic
----------------------------------------------- */
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (user && inAuthGroup) {
      router.replace("/(tabs)");
      return;
    }
  }, [user, loading, segments]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="match/ChatScreen" options={{ headerShown: false }} />
      <Stack.Screen name="meal/[id]" />
    </Stack>
  );
}


/* -----------------------------------------------
    🔥 MAIN ROOT COMPONENT
----------------------------------------------- */
export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    "Inter-Regular": Inter_400Regular,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    async function registerForPush() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      console.log("📌 PUSH TOKEN:", tokenData.data);
    }

    registerForPush();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <UnreadMessageProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </UnreadMessageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
