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
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [error, setError] = useState(null);

  const API = "https://yummy-backend-fxib.onrender.com";

  const quickReplies = [
    "Merhaba 👋",
    "Neredesiniz?",
    "Teslim için müsait misiniz?",
    "Ben geldim :)",
    "5 dakika gecikeceğim",
  ];

  const loadRoom = async () => {
    setError(null);
    console.log(`${API}/chat/room/${roomId}`);
    try {
      const res = await fetch(`${API}/room/${roomId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const data = await res.json();
      console.log("ROOM DATA:", data);

      if (!data.room) {
        setError("Sohbet yüklenemedi.");
        return;
      }

      setLocked(data.locked);
      setMessages(data.messages || []);

      // DİĞER KULLANICI ID
      const otherId =
        data.room.user1_id === user.uid
          ? data.room.user2_id
          : data.room.user1_id;

      const U = await fetch(`${API}/auth/user/${otherId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const userData = await U.json();
      setOtherUser(userData);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 80);
    } catch (err) {
      console.log("CHAT LOAD ERROR:", err);
      setError("Sunucuya bağlanırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const sendMessage = async () => {
    if (!text.trim() || locked) return;

    try {
      const res = await fetch(`${API}/chat/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: roomId,
          message: text,
        }),
      });

      const data = await res.json();
      if (!data.id) return;

      setMessages((prev) => [...prev, data]);
      setText("");

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    } catch (err) {
      console.log("SEND MESSAGE ERROR:", err);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user.uid;

    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.otherBubble,
        ]}
      >
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>
          {item.message}
        </Text>
      </View>
    );
  };

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
        <Text style={{ color: "#FF5C4D", fontSize: 16 }}>{error}</Text>
        <TouchableOpacity style={styles.tryBtn} onPress={loadRoom}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerUser}>
          <Image
            source={{
              uri:
                otherUser?.photo_url ||
                "https://cdn-icons-png.flaticon.com/512/847/847969.png",
            }}
            style={styles.headerAvatar}
          />
          <Text style={styles.headerName}>
            {otherUser?.username || "Kullanıcı"}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
      />

      {!locked && (
        <View style={styles.quickReplyContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickReplies.map((msg, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReply}
                onPress={() => setText(msg)}
              >
                <Text style={styles.quickReplyText}>{msg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {!locked && (
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Mesaj yaz..."
            value={text}
            onChangeText={setText}
            style={styles.input}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tryBtn: {
    marginTop: 12,
    backgroundColor: "#FF5C4D",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },

  header: {
    backgroundColor: "#FF5C4D",
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerUser: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 34, height: 34, borderRadius: 17 },
  headerName: { color: "#fff", fontSize: 17, fontWeight: "700" },

  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
  },
  myBubble: {
    backgroundColor: "#FF5C4D",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#F0F0F0",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, color: "#333" },
  myMessageText: { color: "#fff", fontWeight: "600" },

  quickReplyContainer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    paddingVertical: 4,
    paddingLeft: 6,
    height: 42,
    justifyContent: "center",
  },
  quickReply: {
    backgroundColor: "#FFE5E2",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginRight: 10,
  },
  quickReplyText: { color: "#FF5C4D", fontWeight: "600" },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F3F3",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: "#FF5C4D",
    padding: 12,
    borderRadius: 26,
    marginLeft: 10,
  },
});
