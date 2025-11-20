import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState(null);

  const flatListRef = useRef(null);

  // 🎯 Karşı kullanıcıyı al
  useEffect(() => {
    const fetchOtherUser = async () => {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) return;

      const data = chatSnap.data();
      const otherUserId = data.userA === user.uid ? data.userB : data.userA;

      const otherUserRef = doc(db, "users", otherUserId);
      const otherSnap = await getDoc(otherUserRef);

      if (otherSnap.exists()) setOtherUser(otherSnap.data());
    };

    fetchOtherUser();
  }, [chatId]);

  // 🎯 Mesajları dinle
  useEffect(() => {
    const msgRef = collection(db, "chats", chatId, "messages");
    const q = query(msgRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setMessages(list);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 🎯 Mesajı okundu yapma (chat açıldığında)
  useEffect(() => {
    const markAsRead = async () => {
      const msgRef = collection(db, "chats", chatId, "messages");
      const q = query(msgRef, where("isRead", "==", false));

      onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach((d) => {
          const data = d.data();

          // sadece karşı tarafın mesajını okundu yap
          if (data.sender !== user.uid) {
            updateDoc(doc(db, "chats", chatId, "messages", d.id), {
              isRead: true,
            });
          }
        });
      });
    };

    markAsRead();
  }, [chatId]);

  // 🎯 Mesaj Gönder
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp(),
      isRead: false, // unread mesaj!
    });

    setText("");

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  // Hazır mesajlar
  const templates = [
    "Merhaba 😊",
    "Nerede buluşalım?",
    "Kaçta uygun olur?",
    "Teslim için hazır mısın?",
  ];

  const renderMessage = ({ item }) => {
    const isMe = item.sender === user.uid;

    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={[styles.messageText, isMe && { color: "#fff" }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🔥 TOP BAR */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerName}>
            {otherUser?.username || "Kullanıcı"}
          </Text>
          <Text style={styles.headerSub}>
            {otherUser?.rating || 0} ⭐ puan
          </Text>
        </View>
      </View>

      {/* 🔥 Mesaj Listesi */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* 🔥 Hazır Mesaj Şablonları */}
      <View style={styles.templates}>
        {templates.map((t, index) => (
          <TouchableOpacity
            key={index}
            style={styles.templateBtn}
            onPress={() => setText(t)}
          >
            <Text style={styles.templateText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🔥 Mesaj Yazma Alanı */}
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
    </View>
  );
}

//
// ---------------------- STYLES ----------------------
//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },

  // HEADER
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

  // MESAJ
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

  // TEMPLATES
  templates: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    gap: 8,
    backgroundColor: "#fff",
  },
  templateBtn: {
    backgroundColor: "#FFF0ED",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  templateText: {
    color: "#FF5C4D",
    fontWeight: "600",
  },

  // INPUT
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
