import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function ChatList() {
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = "https://yummy-backend-fxib.onrender.com";

  useEffect(() => {
    if (!user?.token) return;

    const loadRooms = async () => {
      try {
        const res = await fetch(`${API}/chat/rooms`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log("CHAT LIST ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [user?.token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );
  }

  if (rooms.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Henüz bir sohbetin yok.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rooms}
      keyExtractor={(item) => String(item.room_id)}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.room}
          onPress={() => router.push(`/chat/${item.room_id}`)}
        >
          <Image
            source={{
              uri:
                item.photo_url ||
                "https://cdn-icons-png.flaticon.com/512/847/847969.png",
            }}
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message || "Henüz mesaj yok"}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  room: {
    flexDirection: "row",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  username: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  lastMessage: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
});
