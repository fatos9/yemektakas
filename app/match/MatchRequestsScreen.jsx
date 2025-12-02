import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";

const API = "https://yummy-backend-fxib.onrender.com";

/* -----------------------------
   ⏱ Time Ago
------------------------------ */
function formatTime(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  const diff = (now - d) / 60000;

  if (diff < 1) return "Az önce";
  if (diff < 60) return `${Math.floor(diff)} dakika önce`;
  if (diff < 1440) return `${Math.floor(diff / 60)} saat önce`;

  const days = Math.floor(diff / 1440);
  if (days === 1) return "Dün";

  return `${days} gün önce`;
}

/* -----------------------------
   📌 Gruba ayır (BUGÜN / DÜN / DAHA ÖNCE)
------------------------------ */
function groupByDate(list) {
  const today = [];
  const yesterday = [];
  const earlier = [];

  const now = new Date();
  const t = now.getDate();
  const y = t - 1;

  list.forEach((item) => {
    const d = new Date(item.createdat).getDate();

    if (d === t) today.push(item);
    else if (d === y) yesterday.push(item);
    else earlier.push(item);
  });

  return { today, yesterday, earlier };
}

/* -----------------------------
   🔥 Swipeable Delete
------------------------------ */
const RightDelete = ({ dragX, onDelete }) => {
  const scale = dragX.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <TouchableOpacity style={styles.deleteBox} onPress={onDelete}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name="trash" size={28} color="#fff" />
      </Animated.View>
    </TouchableOpacity>
  );
};

/* -----------------------------
   🔥 Notification Item
------------------------------ */
const NotificationItem = ({ item, onPress, onDelete }) => {
  return (
    <Swipeable
      renderRightActions={(progress, dragX) => (
        <RightDelete dragX={dragX} onDelete={onDelete} />
      )}
    >
      <TouchableOpacity style={styles.item} onPress={onPress}>
        <Image
          source={{
            uri:
              item.sender_photo ||
              "https://cdn-icons-png.flaticon.com/512/847/847969.png",
          }}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.senderName}>{item.sender_name}</Text>
          <Text style={styles.message}>sana bir öğün eşleşme isteği gönderdi 🍽️</Text>
          <Text style={styles.time}>{formatTime(item.createdat)}</Text>
        </View>

        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </Swipeable>
  );
};

/* -----------------------------
   🧨 SCREEN
------------------------------ */
export default function MatchRequestsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [list, setList] = useState([]);
  console.log("_____________________________Bildirim Full List:",list);
  const [loading, setLoading] = useState(true);

  /* -----------------------------
      🔥 Bildirimleri Çek
  ------------------------------ */
  const load = async () => {
    try {
      const res = await fetch(`${API}/match/received`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const data = await res.json();

      setList(data);
    } catch (err) {
      console.log("NOTIF ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
      🗑 Sil
  ------------------------------ */
  const deleteItem = async (id) => {
    try {
      await fetch(`${API}/match/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request_id: id }),
      });

      setList((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );

  /* -----------------------------
      ✨ Grup Ayır
  ------------------------------ */
  const { today, yesterday, earlier } = groupByDate(list);

  const groups = [
    { title: "BUGÜN", data: today },
    { title: "DÜN", data: yesterday },
    { title: "DAHA ÖNCE", data: earlier },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={groups}
        keyExtractor={(g) => g.title}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) =>
          item.data.length > 0 && (
            <View style={styles.groupBox}>
              <Text style={styles.groupTitle}>{item.title}</Text>

              {item.data.map((n) => (
                console.log("__________N",n),
                <NotificationItem
                  key={n.id}
                  item={n}
                  onPress={() =>
                    router.push({
                      pathname: `/meal/${n.sender_meal_id}`,
                      params: { requestId: n.id }
                    })
                  }
                  onDelete={() => deleteItem(n.id)}
                />
              ))}
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

/* -----------------------------
   🎨 STYLES
------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },

  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111" },

  /* Groups */
  groupBox: { paddingHorizontal: 16, paddingVertical: 12 },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#777",
    marginBottom: 10,
  },

  /* Item */
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },

  senderName: { fontSize: 15, fontWeight: "700", color: "#111" },
  message: { fontSize: 13, color: "#555" },
  time: { fontSize: 11, color: "#999", marginTop: 4 },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF4E4E",
    marginLeft: 10,
  },

  deleteBox: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    marginVertical: 4,
    borderRadius: 8,
  },
});
