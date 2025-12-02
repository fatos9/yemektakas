import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams();   // 🔥 artık chatId değil roomId
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef(null);
  const API = "https://yummy-backend-fxib.onrender.com";

  /* ------------------------------------------------
      1) Chat Odası Bilgisi + Diğer Kullanıcı Bilgisi
  ------------------------------------------------ */
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const res = await fetch(`${API}/chat/room/${roomId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const data = await res.json();

        if (data.error === "Bu sohbet kapanmış.") {
          setIsLocked(true);
        }

        setMessages(data || []);

        // En aşağı kaydır
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);

        // Diğer kullanıcıyı bul
        if (data.length > 0) {
          const firstMsg = data[0];
          const otherId =
            firstMsg.sender_id === user.uid
              ? firstMsg.receiver_id
              : firstMsg.sender_id;

          fetch(`${API}/users/${otherId}`)
            .then((r) => r.json())
            .then((d) => setOtherUser(d));
        }
      } catch (err) {
        console.log("CHAT LOAD ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId]);

  /* ------------------------------------------------
      2) Mesaj Gönder
  ------------------------------------------------ */
  const sendMessage = async () => {
    if (!text.trim() || isLocked) return;

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

      if (data.error === "Bu sohbet kapanmış. Mesaj gönderemezsin.") {
        setIsLocked(true);
        return;
      }

      // Anlık UI ekle
      setMessages((prev) => [...prev, data]);
      setText("");

      // Scroll
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 120);
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
          isMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={[styles.messageText, isMe && { color: "#fff" }]}>
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

  return (
    <View style={styles.container}>
      {/* 🔥 HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerName}>
            {otherUser?.username || "Kullanıcı"}
          </Text>
          <Text style={styles.headerSub}>Sohbet</Text>
        </View>
      </View>

      {/* 🔥 MESAJ LİSTESİ */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* 🔥 SOHBET KİLİTLİYSE UYARI */}
      {isLocked && (
        <View style={styles.lockBanner}>
          <Text style={styles.lockText}>Bu sohbet sona erdi.</Text>
        </View>
      )}

      {/* 🔥 MESAJ GÖNDERME ALANI */}
      {!isLocked && (
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Mesaj yaz..."
            value={text}
            onChangeText={setText}
            style={styles.input}
          />

          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------
      STYLES
------------------------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF5C4D",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
  },
  headerName: { fontSize: 18, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "#FFE6E3" },

  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginVertical: 4,
  },
  myMessage: {
    backgroundColor: "#FF5C4D",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#EDEDED",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#222",
  },

  lockBanner: {
    backgroundColor: "#FFE2DF",
    padding: 12,
    alignItems: "center",
  },
  lockText: {
    color: "#FF5C4D",
    fontWeight: "700",
  },

  inputRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: "#FF5C4D",
    padding: 12,
    borderRadius: 50,
  },
});
