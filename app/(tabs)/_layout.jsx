import { Tabs } from "expo-router";
import { View } from "react-native";
import { Home, Map, User } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useUnreadMessages } from "../../hooks/useUnreadMessages";

export default function TabsLayout() {
  const { user } = useAuth();

  // ❗ Firebase UID yok artık → user.id var
  const unreadCount = useUnreadMessages(user?.id);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FF5C4D",
        tabBarInactiveTintColor: "#B5B5B5",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={focused ? size + 2 : size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Map size={focused ? size + 2 : size} color={color} />
          ),
        }}
      />

      {/* Messages */}
      <Tabs.Screen
        name="messages"
        options={{
          title: "Mesajlar",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="chatbubble-outline" size={size} color={color} />

              {/* 🔥 UNREAD BADGE */}
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    backgroundColor: "red",
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                  }}
                />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <User size={focused ? size + 2 : size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
