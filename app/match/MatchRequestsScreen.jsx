// app/match/MatchRequestsScreen.jsx

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import SwipeableNotification from "../../components/SwipeableNotification";

const API = "https://yummyum-backend.vercel.app/api";

// ⏱ Instagram stil timeAgo
function timeAgo(dateString) {
  const d = new Date(dateString);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa`;

  const days = Math.floor(hours / 24);
  return `${days} gün`;
}

export default function MatchRequestsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Talepleri getir
  const fetchRequests = async () => {
    try {
      console.log(`https://yummyum-backend.vercel.app/apimatch?user_id=${user.id}`);
      const res = await fetch(`${API}/match?user_id=${user.id}`);
      const data = await res.json();
      console.log("BİLDİRİM SAYFASI DATAaa------------------:",data);
      // --- VERİ NORMALİZASYONU ---
      const normalized = data.map((i) => ({
        id: i.id,
        from_user_id: i.from_user_id,
        to_user_id: i.to_user_id,
        meal_id: i.meal_id,

        sender_name: i.sender_name || "Kullanıcı",
        sender_photo:
          i.sender_photo ||
          i.photo_url ||
          "https://cdn-icons-png.flaticon.com/512/847/847969.png",

        createdat: i.createdat,
        timeAgo: timeAgo(i.createdat),

        meal_name: i.meal_name,
        meal_image: i.meal_image,
      }));

      setRequests(normalized);
    } catch (err) {
      console.log("Request fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Kabul et
  const acceptRequest = async (item) => {
    try {
      await fetch(`${API}/match`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: item.id,
          from_user_id: item.from_user_id,
          to_user_id: item.to_user_id,
          meal_id: item.meal_id,
        }),
      });

      setRequests((prev) => prev.filter((x) => x.id !== item.id));
    } catch (err) {
      console.log("ACCEPT ERROR:", err);
    }
  };

  // 🔥 Sil / Reddet
  const deleteRequest = async (item) => {
    try {
      await fetch(`${API}/match?request_id=${item.id}`, { method: "DELETE" });

      setRequests((prev) => prev.filter((x) => x.id !== item.id));
    } catch (err) {
      console.log("DELETE ERROR:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // LOADING
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );
  }

  // EMPTY
  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bildirimler</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyWrapper}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/711/711284.png",
            }}
            style={styles.emptyImg}
          />
          <Text style={styles.emptyTitle}>Henüz bildirimin yok</Text>
          <Text style={styles.emptySub}>
            Öğün ekleyerek eşleşme isteği alabilirsin.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableNotification
            item={item}
            onDelete={deleteRequest}
            onAccept={acceptRequest}
            onPress={() => router.push(`/meal/${item.meal_id}`)}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
      />
    </SafeAreaView>
  );
}

/* ========= STYLES ========= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111" },

  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  emptyImg: { width: 130, height: 130, marginBottom: 20, opacity: 0.8 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#333" },
  emptySub: { color: "#777", marginTop: 4 },
});
