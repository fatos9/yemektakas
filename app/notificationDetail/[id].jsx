import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";

const API = "https://yummyum-backend.vercel.app/api";

function timeAgo(str) {
  if (!str) return "";
  const date = new Date(str);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;

  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export default function NotificationDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomOpen, setZoomOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`${API}/match?request_id=${id}`);
      const raw = await res.text();
      console.log("🔵 RAW:", raw);

      const data = JSON.parse(raw);

      // JSON parse fix — location alanları string geldiğinde düzelt
      let restaurantLoc = null;
      let userLoc = null;

      try {
        restaurantLoc =
          typeof data.restaurant_location === "string"
            ? JSON.parse(data.restaurant_location)
            : data.restaurant_location;

        userLoc =
          typeof data.user_location === "string"
            ? JSON.parse(data.user_location)
            : data.user_location;
      } catch {}

      setDetail({
        ...data,
        restaurant_location: restaurantLoc,
        user_location: userLoc,
      });
    } catch (err) {
      console.log("DETAIL ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async () => {
    await fetch(`${API}/match`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: detail.id,
        sender_id: detail.from_user_id,
        receiver_id: detail.to_user_id,
        meal_id: detail.meal_id,
      }),
    });

    router.back();
  };

  const rejectRequest = async () => {
    await fetch(`${API}/match?request_id=${detail.id}`, {
      method: "DELETE",
    });

    router.back();
  };

  useEffect(() => {
    fetchDetail();
  }, []);

  if (loading || !detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF5C4D" size="large" />
      </View>
    );
  }

  const mealImg =
    detail.meal_image ||
    "https://cdn-icons-png.flaticon.com/512/1046/1046857.png";

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İstek Detayı</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* USER INFO */}
        <View style={styles.userRow}>
          <Image
            source={{
              uri:
                detail.sender_photo ||
                "https://cdn-icons-png.flaticon.com/512/847/847969.png",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.userName}>{detail.sender_name}</Text>
            <Text style={styles.subText}>Bu öğünü seninle paylaşmak istiyor</Text>
            <Text style={styles.timeText}>{timeAgo(detail.createdat)}</Text>
          </View>
        </View>

        {/* MEAL PHOTO */}
        <TouchableOpacity onPress={() => setZoomOpen(true)}>
          <Image source={{ uri: mealImg }} style={styles.mealImage} />
        </TouchableOpacity>

        {/* Zoom Modal */}
        <Modal visible={zoomOpen} transparent animationType="fade">
          <Pressable
            style={styles.zoomBackdrop}
            onPress={() => setZoomOpen(false)}
          >
            <Image source={{ uri: mealImg }} style={styles.zoomImage} />
          </Pressable>
        </Modal>

        <Text style={styles.mealName}>{detail.meal_name}</Text>

        {/* RESTAURANT */}
        {detail.restaurant_name && (
          <View style={styles.infoCard}>
            <Ionicons name="restaurant" size={20} color="#FF5C4D" />
            <Text style={styles.infoText}>{detail.restaurant_name}</Text>
          </View>
        )}

        {/* ALLERGENS */}
        {detail.allergens?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alerjenler</Text>
            <View style={styles.allergenWrap}>
              {detail.allergens.map((a, i) => (
                <View key={i} style={styles.allergenChip}>
                  <Text style={styles.allergenText}>{a}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* MAP */}
        {detail.restaurant_location?.lat && (
          <>
            <Text style={styles.sectionTitle}>Konum</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: Number(detail.restaurant_location.lat),
                longitude: Number(detail.restaurant_location.lng),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: Number(detail.restaurant_location.lat),
                  longitude: Number(detail.restaurant_location.lng),
                }}
                title={detail.restaurant_name}
              />
            </MapView>
          </>
        )}

        {/* ACTION BUTTONS */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={acceptRequest}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.btnText}>Kabul Et</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rejectBtn} onPress={rejectRequest}>
            <Ionicons name="close-circle-outline" size={20} color="#333" />
            <Text style={styles.rejectText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },

  userRow: { flexDirection: "row", marginBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },

  userName: { fontSize: 18, fontWeight: "700" },
  subText: { color: "#666" },
  timeText: { color: "#999", marginTop: 4, fontSize: 12 },

  mealImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginBottom: 16,
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImage: { width: "90%", height: "70%", borderRadius: 12 },

  mealName: { fontSize: 20, fontWeight: "700", marginBottom: 16 },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FFF5F4",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  infoText: { fontSize: 16, fontWeight: "600", color: "#333" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#333",
  },

  allergenWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  allergenChip: {
    backgroundColor: "#FFEAEA",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  allergenText: { color: "#FF5C4D", fontWeight: "700" },

  map: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 20,
  },

  actions: { flexDirection: "row", gap: 12, marginTop: 10 },

  acceptBtn: {
    flex: 1,
    backgroundColor: "#FF5C4D",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  rejectBtn: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  rejectText: { fontWeight: "700", color: "#333", fontSize: 16 },
});
