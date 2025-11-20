import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const Tab = createMaterialTopTabNavigator();

export default function MatchRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#FFF9F8", "#FFF5F3"]}
      style={[styles.container, { paddingTop: insets.top + 10 }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Eşleşme İstekleri</Text>
      </View>

      <View style={styles.tabContainer}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: "#FF5C4D",
            tabBarInactiveTintColor: "#999",
            tabBarIndicatorStyle: {
              backgroundColor: "#FF5C4D",
              height: 3,
              borderRadius: 2,
            },
            tabBarLabelStyle: {
              fontWeight: "700",
              fontSize: 13,
              textTransform: "none",
            },
            tabBarStyle: {
              backgroundColor: "#fff",
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
          }}
        >
          <Tab.Screen name="Yeni İstekler" component={PendingRequests} />
          <Tab.Screen name="Eski İstekler" component={OldRequests} />
        </Tab.Navigator>
      </View>
    </LinearGradient>
  );
}

function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "match_requests"),
      where("toUserId", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const mealSnap = await getDoc(doc(db, "meals", data.mealId));
          return {
            id: docSnap.id,
            ...data,
            mealData: mealSnap.exists() ? mealSnap.data() : {},
          };
        })
      );
      setRequests(data);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const handleAccept = async (item) => {
  try {
    // 🔥 Eşleşmeyi accepted yap
    const ref = doc(db, "match_requests", item.id);
    await updateDoc(ref, {
      status: "accepted",
      acceptedAt: serverTimestamp(),
    });

    // 💬 Chat oluştur (tekil chat kaydı)
    const chatRef = await addDoc(collection(db, "chats"), {
      userA: item.fromUserId,
      userB: item.toUserId,
      mealId: item.mealId,
      messages: [],
      matchedAt: serverTimestamp(),
    });

    // // 🔄 UI güncelle
    // setRequests((prev) => prev.filter((r) => r.id !== item.id));

    // Alert.alert("🎉 Eşleşme Onaylandı", "Mesajlaşma aktif hale getirildi!");

    // 👉 İstersen mesajlaşma ekranına git
    // navigation.navigate("ChatScreen", { chatId: chatRef.id });
    router.push(`/match/ChatScreen?chatId=${chatRef.id}`);
  } catch (err) {
    console.error("🔥 Kabul hatası:", err);
    Alert.alert("Hata", "Eşleşme kabul edilirken bir sorun oluştu.");
  }
};

const handleReject = async (item) => {
  try {
    // ❌ Eşleşmeyi reddet
    const ref = doc(db, "match_requests", item.id);
    await updateDoc(ref, { status: "rejected" });

    // 🔄 UI’dan anında kaldır
    setRequests((prev) => prev.filter((r) => r.id !== item.id));

    Alert.alert("❌ Reddedildi", "Eşleşme isteği reddedildi.");
  } catch (err) {
    console.error("🔥 Reddetme hatası:", err);
    Alert.alert("Hata", "Eşleşme reddedilirken bir sorun oluştu.");
  }
};


  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF5C4D" size="large" />
      </View>
    );

  if (requests.length === 0)
    return (
      <View style={styles.center}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/535/535234.png" }}
          style={{ width: 100, height: 100, opacity: 0.5 }}
        />
        <Text style={{ color: "#777", marginTop: 10 }}>Hiç eşleşme isteğin yok 💌</Text>
      </View>
    );

  return (
    <FlatList
      data={requests}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 18 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.mealName}>{item.mealData.mealName || "Yemek Adı"}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
              <Ionicons name="close" size={20} color="#FF5C4D" />
              <Text style={styles.rejectText}>Reddet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.acceptText}>Kabul Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

function OldRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "match_requests"),
      where("toUserId", "==", currentUser.uid),
      where("status", "in", ["accepted", "rejected"])
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const mealSnap = await getDoc(doc(db, "meals", data.mealId));
          return {
            id: docSnap.id,
            ...data,
            mealData: mealSnap.exists() ? mealSnap.data() : {},
          };
        })
      );
      setRequests(data);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF5C4D" size="large" />
      </View>
    );

  if (requests.length === 0)
    return (
      <View style={styles.center}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/535/535234.png" }}
          style={{ width: 100, height: 100, opacity: 0.5 }}
        />
        <Text style={{ color: "#777", marginTop: 10 }}>Henüz eski isteğin yok</Text>
      </View>
    );

  return (
    <FlatList
      data={requests}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 18 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.mealName}>{item.mealData.mealName || "Yemek Adı"}</Text>
          <Text
            style={{
              color: item.status === "accepted" ? "#22c55e" : "#FF5C4D",
              fontWeight: "700",
              textAlign: "center",
              marginTop: 6,
            }}
          >
            {item.status === "accepted" ? "✅ Kabul Edildi" : "❌ Reddedildi"}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2C2C2C",
    letterSpacing: 0.5,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#FF6F61",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  mealName: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 8 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE8E4",
    borderRadius: 16,
    paddingVertical: 10,
    marginRight: 8,
    gap: 6,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5C4D",
    borderRadius: 16,
    paddingVertical: 10,
    gap: 6,
  },
  rejectText: { color: "#FF5C4D", fontWeight: "700" },
  acceptText: { color: "#fff", fontWeight: "700" },
});
