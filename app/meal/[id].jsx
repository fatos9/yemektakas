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
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [myMeals, setMyMeals] = useState([]); // Kullanıcının kendi öğünleri
  const [showFullImage, setShowFullImage] = useState(false); // FULLSCREEN IMAGE

  const API = "https://yummyum-backend.vercel.app/api";

  // ------------------------------
  // 🔥 Öğün detayını al
  // ------------------------------
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API}/meals/${id}`);
        const text = await res.text();
        let data = JSON.parse(text);

        if (typeof data.allergens === "string") data.allergens = JSON.parse(data.allergens);
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

  // ------------------------------
  // 🔥 Kullanıcının kendi öğünlerini çek
  // ------------------------------
  useEffect(() => {
    const fetchMyMeals = async () => {
      try {
        const res = await fetch(`${API}/meals`);
        const list = await res.json();

        const mine = list.filter((m) => m.user_id === user?.id);
        setMyMeals(mine);
      } catch (err) {
        console.log("MY MEALS ERROR:", err);
      }
    };

    if (user?.id) fetchMyMeals();
  }, [user]);

  // ------------------------------
  // 🔥 Match butonu
  // ------------------------------
  const handleMatch = async () => {
    if (myMeals.length === 0) {
      Alert.alert(
        "Öğün Eklenmedi",
        "Eşleşme isteği gönderebilmek için önce bir öğün eklemelisin."
      );
      return;
    }

    try {
      const res = await fetch(`${API}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: user.id,        // mevcut kullanıcı
          receiver_id: meal.user_id, // öğünün sahibi
          meal_id: meal.id,
        }),
      });

      const text = await res.text();
      console.log("MATCH POST RESPONSE:", text);

      let data;

      // API'nin text dönmesi ihtimali →
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.log("PARSE ERROR:", err);
        Alert.alert("Hata", "Sunucu geçersiz yanıt döndü.");
        return;
      }

      if (data.success) {
        Alert.alert("Gönderildi", "Eşleşme isteğin karşı tarafa gönderildi.");
      } else {
        Alert.alert("Hata", "İstek gönderilemedi.");
      }
    } catch (err) {
      console.log("MATCH ERROR:", err);
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    }
  };


  // 🗑️ Öğün Silme
  const handleDelete = () => {
    Alert.alert(
      "Onay",
      "Bu öğünü silmek istediğine emin misin?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API}/meals/${id}`, {
                method: "DELETE",
              });

              router.replace("/");
            } catch (err) {
              console.log("DELETE ERROR:", err);
            }
          },
        },
      ]
    );
  };

  // ✏️ Düzenle
  const handleEdit = () => {
    router.push(`/meal/edit?id=${id}`);
  };

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

  const isOwner = meal.user_id?.toString() === user?.id?.toString()

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 🔙 Geri */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 📸 Küçük Görsel + Fullscreen Açma */}
      <TouchableOpacity onPress={() => setShowFullImage(true)}>
        <Image source={{ uri: meal.image_url }} style={styles.heroImage} />
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.restaurant}>{meal.restaurant_name}</Text>

        {/* ⭐ Rating */}
        <View style={styles.row}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{(meal.user_rating || "4.8").toString()}</Text>
        </View>

        {/* 👤 Kullanıcı */}
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

        {/* 🗺️ Mini Harita */}
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
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: meal.restaurant_location.lat,
              longitude: meal.restaurant_location.lng,
            }}
          />
        </MapView>

        {/* 🍽️ Alerjenler */}
        <Text style={styles.sectionTitle}>Alerjenler</Text>
        <View style={styles.allergenList}>
          {meal.allergens.map((a, i) => (
            <View key={i} style={styles.allergenChip}>
              <Text style={styles.allergenText}>{a}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* 🔘 ALT BUTONLAR */}
      {!isOwner ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.matchBtn,
              { opacity: myMeals.length === 0 ? 0.4 : 1 },
            ]}
            disabled={myMeals.length === 0}
            onPress={handleMatch}
          >
            <Text style={styles.matchText}>Eşleşme İsteği Gönder</Text>
          </TouchableOpacity>

          {/* 🔥 Eğer hiç öğün yoksa sebebi göster */}
          {myMeals.length === 0 && (
            <Text style={styles.disabledInfo}>
              Eşleşme isteği gönderebilmek için önce bir öğün eklemelisin.
            </Text>
          )}
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

      {/* 🔥 FULLSCREEN IMAGE MODAL */}
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
    </View>
  );
}

//
// --- STYLES ---
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

  // 🔥 Küçültülmüş görsel
  heroImage: {
    width: "100%",
    height: 180,
  },

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

  // 🔥 Bottom bar
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

  disabledInfo: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 13,
    color: "#777",
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

  // 🔥 Fullscreen image styles
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

  fullscreenImage: {
    width: "100%",
    height: "100%",
  },

  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1000,
  },
});
