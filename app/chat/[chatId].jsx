import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();
  const { user } = useAuth();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // 👉 Hazır mesaj şablonları
  const quickReplies = [
    "Merhaba 👋",
    "Neredesiniz?",
    "Teslim için müsait misiniz?",
    "Ben geldim :)",
    "5 dakika gecikeceğim",
  ];

  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setMessages(list);

      // Otomatik aşağı kaydır
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsub();
  }, [chatId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
        text: messageText,
        sender: currentUser.uid,
        createdAt: serverTimestamp(),
    });


    setText("");
  };

  const renderMessage = ({ item }) => {
    const isMe = item.userId === user.uid;

    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.otherBubble,
        ]}
      >
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.messagesWrapper}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 12 }}
        />
      </View>

      {/* 🔥 Hazır Mesaj Şablonları */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickReplyContainer}
      >
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

      {/* ➤ Mesaj Yazma Alanı */}
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
    </KeyboardAvoidingView>
  );
}

//
// -------------------- STYLES --------------------
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  messagesWrapper: {
    flex: 1,
  },

  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
  },

  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#FF5C4D",
    borderBottomRightRadius: 4,
  },

  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#EDEDED",
    borderBottomLeftRadius: 4,
  },

  messageText: {
    fontSize: 15,
    color: "#333",
  },

  myMessageText: {
    color: "#fff",
    fontWeight: "600",
  },

  quickReplyContainer: {
    paddingVertical: 8,
    paddingLeft: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  quickReply: {
    backgroundColor: "#FFE3DF",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
  },

  quickReplyText: {
    color: "#FF5C4D",
    fontWeight: "600",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    backgroundColor: "#fff",
    borderColor: "#eee",
  },

  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    fontSize: 14,
  },

  sendBtn: {
    backgroundColor: "#FF5C4D",
    padding: 12,
    borderRadius: 50,
    marginLeft: 10,
  },
});
