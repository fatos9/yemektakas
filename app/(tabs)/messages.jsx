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
import { db } from "../../firebase/config";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const qA = query(collection(db, "chats"), where("userA", "==", user.uid));
    const qB = query(collection(db, "chats"), where("userB", "==", user.uid));

    const unsubA = onSnapshot(qA, (snap) => handleSnapshot(snap));
    const unsubB = onSnapshot(qB, (snap) => handleSnapshot(snap));

    async function handleSnapshot(snapshot) {
      const list = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const otherId = data.userA === user.uid ? data.userB : data.userA;
          const userSnap = await getDoc(doc(db, "users", otherId));
          const other = userSnap.exists() ? userSnap.data() : null;
          return {
            id: docSnap.id,
            ...data,
            otherUser: other,
            otherId,
          };
        })
      );

      const merged = [...list];
      const sorted = merged.sort(
        (a, b) =>
          (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0)
      );
      setChats(sorted);
      setFilteredChats(sorted);
      setLoading(false);
    }

    return () => {
      unsubA();
      unsubB();
    };
  }, [user]);

  // 🔍 Arama işlevi
  useEffect(() => {
    if (!search.trim()) {
      setFilteredChats(chats);
    } else {
      const lower = search.toLowerCase();
      const filtered = chats.filter((c) =>
        c.otherUser?.name?.toLowerCase().includes(lower)
      );
      setFilteredChats(filtered);
    }
  }, [search, chats]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );

  return (
    <LinearGradient colors={["#FFF8F7", "#FFF4F2"]} style={styles.container}>
      <View style={[styles.safeTop, { paddingTop: insets.top + 10 }]}>
        {/* 🔝 Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mesajlar</Text>
          <Ionicons name="chatbubbles" size={24} color="#FF5C4D" />
        </View>

        {/* 🔍 Search Bar */}
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

      {filteredChats.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={60} color="#FFB3A8" />
          <Text style={styles.emptyTitle}>Hiç mesaj yok 💬</Text>
          <Text style={styles.emptySub}>Yeni eşleşmelerini kontrol et!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <ChatCard item={item} router={router} />
          )}
        />
      )}
    </LinearGradient>
  );
}

function ChatCard({ item, router }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const lastMsg =
    item.lastMessage?.text?.length > 40
      ? item.lastMessage.text.slice(0, 40) + "..."
      : item.lastMessage?.text || "Henüz mesaj yok";

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const time = item.lastMessageAt?.seconds
    ? new Date(item.lastMessageAt.seconds * 1000)
        .toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() =>
          router.push({
            pathname: "/match/ChatScreen",
            params: { chatId: item.id, otherUserId: item.otherId },
          })
        }
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                item.otherUser?.photo ||
                "https://cdn-icons-png.flaticon.com/512/847/847969.png",
            }}
            style={styles.avatar}
          />
          {item.otherUser?.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.chatHeader}>
            <Text style={styles.name}>{item.otherUser?.name || "Kullanıcı"}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={styles.message}>{lastMsg}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeTop: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#2C2C2C" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#FF6F61",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: { position: "relative" },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    backgroundColor: "#FFE9E4",
  },
  onlineDot: {
    width: 12,
    height: 12,
    backgroundColor: "#4CD964",
    borderRadius: 6,
    position: "absolute",
    right: 10,
    bottom: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
