import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { getFreshToken } from "../../utils/getFreshToken";

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams();
  const numericRoomId = Number(roomId);

  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef(null);

  // ✅ STATE'LER (EKSİKSİZ)
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [error, setError] = useState(null);

  const API = "https://yummy-backend-fxib.onrender.com";

  // --------------------------------------------------
  // 📥 CHAT ROOM YÜKLE
  // --------------------------------------------------
  const loadRoom = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getFreshToken();

      const res = await fetch(`${API}/chat/room/${numericRoomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!data.room) {
        setError("Sohbet bulunamadı.");
        return;
      }

      setMessages(data.messages || []);
      setLocked(Boolean(data.locked));

      // 👤 KARŞI TARAF
      const otherId =
        data.room.user1_id === user.uid
          ? data.room.user2_id
          : data.room.user1_id;

      const uRes = await fetch(`${API}/auth/user/${otherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const uData = await uRes.json();
      setOtherUser(uData);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (err) {
      console.log("CHAT LOAD ERROR:", err);
      setError("Sohbet yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!numericRoomId || !user?.uid) return;
    loadRoom();
  }, [numericRoomId]);

  // --------------------------------------------------
  // ✉️ MESAJ GÖNDER
  // --------------------------------------------------
  const sendMessage = async () => {
    if (!text.trim() || locked) return;

    try {
      const token = await getFreshToken();

      const res = await fetch(`${API}/chat/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: numericRoomId,
          message: text.trim(),
        }),
      });

      const data = await res.json();
      if (!data?.id) return;

      setMessages((prev) => [...prev, data]);
      setText("");

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    } catch (err) {
      console.log("SEND MESSAGE ERROR:", err);
    }
  };

  // --------------------------------------------------
  // ⏳ LOADING / ERROR
  // --------------------------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#FF5C4D" }}>{error}</Text>
      </View>
    );
  }

  // --------------------------------------------------
  // 🟢 UI
  // --------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerName}>
          {otherUser?.username || "Kullanıcı"}
        </Text>
      </View>

      {/* 🍱 ÖĞÜN KARTLARI */}
      <View style={styles.mealRow}>
        <View style={styles.mealCard}>
          <Text style={styles.mealTitle}>🍱 Senin Öğünün</Text>
          <Text style={styles.mealText}>—</Text>
        </View>
        <View style={styles.mealCard}>
          <Text style={styles.mealTitle}>🍲 Karşı Taraf</Text>
          <Text style={styles.mealText}>—</Text>
        </View>
      </View>

      {/* 💬 MESAJLAR */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{
          padding: 16,
          flexGrow: messages.length === 0 ? 1 : undefined,
          justifyContent: messages.length === 0 ? "center" : "flex-start",
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#999" }}>
            Henüz mesaj yok. Sohbeti başlat 👋
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender_id === user.uid
                ? styles.myBubble
                : styles.otherBubble,
            ]}
          >
            <Text
              style={{
                color: item.sender_id === user.uid ? "#fff" : "#333",
              }}
            >
              {item.message}
            </Text>
          </View>
        )}
      />

      {/* ✍️ INPUT – KLAVYE ÜSTÜNDE */}
      {!locked && (
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Mesaj yaz..."
            style={styles.input}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// --------------------------------------------------
// 🎨 STYLES
// --------------------------------------------------
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#FF5C4D",
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerName: { color: "#fff", fontSize: 17, fontWeight: "700" },

  mealRow: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    backgroundColor: "#FFF5F3",
  },
  mealCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
  },
  mealTitle: { fontSize: 12, color: "#FF5C4D", fontWeight: "700" },
  mealText: { fontSize: 13, marginTop: 4 },

  bubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 14,
    marginVertical: 4,
  },
  myBubble: {
    backgroundColor: "#FF5C4D",
    alignSelf: "flex-end",
  },
  otherBubble: {
    backgroundColor: "#EDEDED",
    alignSelf: "flex-start",
  },

  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  sendBtn: {
    backgroundColor: "#FF5C4D",
    marginLeft: 8,
    padding: 12,
    borderRadius: 24,
  },
});
