import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function MealDetail() {
  const { id, requestId } = useLocalSearchParams();
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);

  const [alreadySent, setAlreadySent] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  const isFromNotification = !!requestId;
  const API = "https://yummy-backend-fxib.onrender.com";

  const myMeals = user?.meals || [];

  /* ---------------------------------------------
    1) ÖĞÜN DETAYI
  --------------------------------------------- */
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API}/meals/${id}`);
        const text = await res.text();
        let data = JSON.parse(text);

        if (typeof data.allergens === "string")
          data.allergens = JSON.parse(data.allergens);

        if (typeof data.restaurant_location === "string")
          data.restaurant_location = JSON.parse(data.restaurant_location);

        setMeal(data);
      } catch (err) {
        console.log("MEAL DETAIL ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  /* ---------------------------------------------
    2) MATCH GÖNDERİLMİŞ Mİ KONTROL
  --------------------------------------------- */
  useEffect(() => {
    if (!meal || !user || isFromNotification) return;

    const checkAlready = async () => {
      try {
        const res = await fetch(`${API}/match/sent`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const list = await res.json();

        const exists = list.some(
          (item) =>
            item.to_user_id === meal.user_id &&
            Number(item.meal_id) === Number(meal.id)
        );

        setAlreadySent(exists);
      } catch {
        setAlreadySent(false);
      }
    };

    checkAlready();
  }, [meal, user, isFromNotification]);

  /* ---------------------------------------------
    3) MATCH GÖNDER
  --------------------------------------------- */
  const handleMatch = async () => {
    if (myMeals.length === 0) {
      Alert.alert("Öğün Eklenmedi", "Önce bir öğün eklemen gerekiyor.");
      return;
    }

    setLoadingMatch(true);
    setGlobalLoading(true);

    try {
      const res = await fetch(`${API}/match/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          to_user_id: meal.user_id,
          meal_id: meal.id,
        }),
      });

      const data = await res.json();

      if (data.message === "Zaten istek gönderilmiş") {
        Alert.alert("Bilgi", "Zaten istek göndermişsin.");
        setAlreadySent(true);
      } else if (data.id) {
        Alert.alert("Başarılı", "Eşleşme isteği gönderildi.");
        setAlreadySent(true);
      }
    } catch (err) {
      Alert.alert("Hata", "Sunucuya ulaşılamadı.");
    }

    setLoadingMatch(false);
    setGlobalLoading(false);
  };

  /* ---------------------------------------------
    4) İSTEĞİ KABUL ET
    ACCEPT → match + chat_room döner
  --------------------------------------------- */
  const handleAccept = async () => {
    try {
      setGlobalLoading(true);

      const res = await fetch(`${API}/match/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request_id: requestId }),
      });

      const data = await res.json();
      console.log('Accept Sonrası:',data);
     if (data.room?.id) {
        Alert.alert("Eşleşme Açıldı", "Artık sohbet edebilirsiniz!", [
          {
            text: "Sohbete Git",
            onPress: () => router.push(`/chat/${data.room.id}`),
          },
        ]);
      } else {
        Alert.alert("Hata", "Chat odası oluşturulamadı.");
      }
    } catch (err) {
      Alert.alert("Hata", "İstek kabul edilemedi.");
    } finally {
      setGlobalLoading(false);
    }
  };

  /* ---------------------------------------------
    5) İSTEĞİ REDDET
  --------------------------------------------- */
  const handleReject = async () => {
    try {
      setGlobalLoading(true);

      await fetch(`${API}/match/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request_id: requestId }),
      });

      Alert.alert("İstek Reddedildi", "", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    } finally {
      setGlobalLoading(false);
    }
  };

  /* ---------------------------------------------
    6) ÖĞÜN SİL / DÜZENLE
  --------------------------------------------- */
  const handleDelete = () => {
    Alert.alert("Onay", "Bu öğünü silmek istiyor musun?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            setGlobalLoading(true);
            await fetch(`${API}/meals/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${user.token}` },
            });

            await refreshProfile();
            router.replace("/(tabs)/profile");
          } finally {
            setGlobalLoading(false);
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push(`/meal/edit?id=${id}`);
  };

  /* LOADING */
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF5C4D" size="large" />
      </View>
    );

  if (!meal)
    return (
      <View style={styles.center}>
        <Text>Öğün bulunamadı.</Text>
      </View>
    );

  const isOwner = meal.user_id === user.uid;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setShowFullImage(true)}>
        <Image source={{ uri: meal.image_url }} style={styles.heroImage} />
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.restaurant}>{meal.restaurant_name}</Text>

        <View style={styles.userBox}>
          <Image
            source={{
              uri:
                meal.user_photo ||
                "https://cdn-icons-png.flaticon.com/512/847/847969.png",
            }}
            style={styles.userAvatar}
          />
          <View>
            <Text style={styles.userName}>{meal.user_name}</Text>
            <Text style={styles.userSub}>Bu öğünü paylaştı</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Konum</Text>

        <MapView
          style={styles.map}
          initialRegion={{
            latitude: meal.restaurant_location.lat,
            longitude: meal.restaurant_location.lng,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: meal.restaurant_location.lat,
              longitude: meal.restaurant_location.lng,
            }}
          />
        </MapView>

        <Text style={styles.sectionTitle}>Alerjenler</Text>
        <View style={styles.allergenList}>
          {meal.allergens?.map((a, i) => (
            <View key={i} style={styles.allergenChip}>
              <Text style={styles.allergenText}>{a}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ALT BUTONLAR */}
      {isFromNotification ? (
        <View style={styles.bottomBarOwner}>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
            <Ionicons name="checkmark-outline" size={20} color="#fff" />
            <Text style={styles.acceptText}>Kabul Et</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
            <Ionicons name="close-outline" size={20} color="#fff" />
            <Text style={styles.rejectText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      ) : !isOwner ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.matchBtn,
              {
                opacity: alreadySent || loadingMatch ? 0.5 : 1
              },
            ]}
            disabled={alreadySent || loadingMatch}
            onPress={handleMatch}
          >
            {loadingMatch ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.matchText}>
                {alreadySent ? "İstek Gönderildi" : "Eşleşme İsteği Gönder"}
              </Text>
            )}
          </TouchableOpacity>

        </View>
      ) : (
        <View style={styles.bottomBarOwner}>
          <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editText}>Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteText}>Sil</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FULLSCREEN IMAGE */}
      {showFullImage && (
        <View style={styles.fullscreenWrapper}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowFullImage(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{ uri: meal.image_url }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* GLOBAL OVERLAY */}
      {globalLoading && (
        <View style={styles.globalOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>İşleniyor...</Text>
        </View>
      )}
    </View>
  );
}

/* ------------------------------ */
/*          STYLES                */
/* ------------------------------ */

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  backButton: {
    position: "absolute",
    zIndex: 20,
    top: 45,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 30,
  },

  heroImage: { width: "100%", height: 180 },
  content: { padding: 20 },

  mealName: { fontSize: 24, fontWeight: "700", color: "#333" },
  restaurant: { fontSize: 16, color: "#777", marginTop: 4 },

  row: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  rating: { fontSize: 15, color: "#444", fontWeight: "600" },

  userBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 12,
    backgroundColor: "#FFF4F3",
    padding: 12,
    borderRadius: 12,
  },

  userAvatar: { width: 45, height: 45, borderRadius: 22.5 },
  userName: { fontSize: 16, fontWeight: "700", color: "#333" },
  userSub: { fontSize: 13, color: "#777" },

  sectionTitle: {
    marginTop: 26,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  map: { width: "100%", height: 140, borderRadius: 12 },

  allergenList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },

  allergenChip: {
    backgroundColor: "#FFE2DF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  allergenText: { color: "#FF5C4D", fontWeight: "600", fontSize: 13 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  bottomBarOwner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  matchBtn: {
    backgroundColor: "#FF5C4D",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  matchText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  acceptBtn: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  acceptText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
  },

  rejectText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
  },

  editBtn: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  editText: { color: "#fff", marginLeft: 8, fontSize: 15, fontWeight: "700" },
  deleteText: { color: "#fff", marginLeft: 8, fontSize: 15, fontWeight: "700" },

  fullscreenWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  fullscreenImage: { width: "100%", height: "100%" },

  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1000,
  },

  globalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  overlayText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
