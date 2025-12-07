import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import AuthRequired from "../../components/AuthRequired";

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const API = "https://yummy-backend-fxib.onrender.com";

  if (!user) return <AuthRequired />;
  // --------------------------------------
  // ROOMS LOAD
  // --------------------------------------
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const res = await fetch(`${API}/chat/rooms`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const data = await res.json();
      console.log("Room List:",data);
      setRooms(data);
      setFilteredRooms(data);
    } catch (err) {
      console.log("ROOM LIST ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------
  // SEARCH
  // --------------------------------------
  useEffect(() => {
    if (!search.trim()) {
      setFilteredRooms(rooms);
    } else {
      const s = search.toLowerCase();
      setFilteredRooms(
        rooms.filter((r) =>
          r.other_username?.toLowerCase()?.includes(s)
        )
      );
    }
  }, [search, rooms]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );

  return (
    <LinearGradient colors={["#FFF8F7", "#FFF4F2"]} style={styles.container}>
      <View style={[styles.safeTop, { paddingTop: insets.top + 10 }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mesajlar</Text>
          <Ionicons name="chatbubbles" size={24} color="#FF5C4D" />
        </View>

        {/* SEARCH */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Kullanıcı ara..."
            placeholderTextColor="#aaa"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {filteredRooms.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={60} color="#FFB3A8" />
          <Text style={styles.emptyTitle}>Hiç mesaj yok 💬</Text>
          <Text style={styles.emptySub}>Yeni eşleşmelerini kontrol et!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => <ChatRoomCard item={item} router={router} />}
        />
      )}
    </LinearGradient>
  );
}

function ChatRoomCard({ item, router }) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  const lastMsg =
    item.last_message?.length > 40
      ? item.last_message.slice(0, 40) + "..."
      : item.last_message || "Henüz mesaj yok";

  const time = item.last_message_time
    ? new Date(item.last_message_time).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() =>
          router.push(`/chat/${item.id}`)
        }
      >
        <Image
          source={{
            uri:
              item.other_photo ||
              "https://cdn-icons-png.flaticon.com/512/847/847969.png",
          }}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <View style={styles.chatHeader}>
            <Text style={styles.name}>{item.other_username}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={styles.message}>{lastMsg}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// --------------------------------------
// STYLES – IG DM vibe
// --------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeTop: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#2C2C2C" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 3,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },

  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 3,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: { fontSize: 16, fontWeight: "700", color: "#333" },
  message: { fontSize: 13, color: "#777", marginTop: 4 },
  time: { fontSize: 11, color: "#999" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 10,
  },
  emptySub: { color: "#777", marginTop: 4, fontSize: 13, textAlign: "center" },
});
