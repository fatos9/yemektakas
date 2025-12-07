import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase/config";
import RestaurantPicker from "../components/RestaurantPicker";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const API_BASE = "https://yummy-backend-fxib.onrender.com";

export default function AddMeal() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const token = user?.token;

  const [mealName, setMealName] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [allergens, setAllergens] = useState([]);
  const [allergenOptions, setAllergenOptions] = useState([]);

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // SAYFA YÜKLENİNCE (ARTIK LOGIN YÖNLENDİRMESİ YOK!!!)
  // -------------------------------------------------------
  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
      setLoading(false);
    })();

    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data || []));

    fetch(`${API_BASE}/allergens`)
      .then((res) => res.json())
      .then((data) => setAllergenOptions(data || []));
  }, []);

  // -------------------------------------------------------
  // FOTOĞRAF SEÇME
  // -------------------------------------------------------
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  // -------------------------------------------------------
  // FIREBASE STORAGE UPLOAD
  // -------------------------------------------------------
  async function uploadToFirebase(uri) {
    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject("Upload hatası");
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      const fileRef = ref(storage, `meals/${Date.now()}.jpg`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);

      blob.close();
      return downloadURL;
    } catch (err) {
      console.log("🔥 STORAGE HATA:", err);
      throw err;
    }
  }

  // -------------------------------------------------------
  // ÖĞÜNÜ KAYDET
  // -------------------------------------------------------
  const handleSaveMeal = async () => {
    if (!mealName.trim() || !selectedCategory) {
      return Alert.alert("Eksik bilgi", "Yemek adı ve kategori zorunlu.");
    }

    try {
      setSaving(true);

      const loc = await Location.getCurrentPositionAsync({});
      const userLocation = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };

      let imageURL = "";

      if (selectedImage) {
        imageURL = await uploadToFirebase(selectedImage);
      } else {
        const cat = categories.find((c) => c.id === selectedCategory);
        imageURL = cat?.image_url || "";
      }

      const body = {
        name: mealName,
        image_url: imageURL,
        category: selectedCategory,
        allergens,
        restaurant_name: selectedRestaurant?.name || "Bilinmeyen",
        restaurant_location: selectedRestaurant?.geometry?.location || null,
        user_location: userLocation,
      };

      const response = await fetch(`${API_BASE}/meals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ API ERROR:", errorText);
        Alert.alert("Hata", "İşlem gerçekleştirilemedi.");
        return;
      }

      const meal = await response.json();

      setUser((prev) => ({
        ...prev,
        meals: [meal, ...(prev.meals || [])],
      }));

      Alert.alert("🎉 Başarılı", "Yemeğin yayınlandı!", [
        { text: "Tamam", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (err) {
      console.log("🔥 KAYDETME HATASI:", err);
      Alert.alert("Hata", "Yemek kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Yeni Öğün Ekle</Text>

          <View style={{ width: 30 }} />
        </View>

        {/* INFO */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Fotoğraf eklemezsen kategori görseli otomatik kullanılır.
          </Text>
        </View>

        {/* FOTOĞRAF */}
        <View style={styles.photoWrapper}>
          {selectedImage ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: selectedImage }} style={styles.previewImg} />
              <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                <Text style={styles.changeBtnText}>Değiştir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoCard}>
              <Ionicons name="image" size={40} color="#FF5C4D" />
              <Text style={styles.photoCardTitle}>Görsel Ekle</Text>

              <View style={styles.photoBtns}>
                <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                  <Text style={styles.photoBtnText}>Galeriden</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                  <Text style={styles.photoBtnText}>Kameradan</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* YEMEK ADI */}
        <View style={styles.card}>
          <Text style={styles.label}>Yemek Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Mantı, Pilav..."
            value={mealName}
            onChangeText={setMealName}
          />
        </View>

        {/* KATEGORİ */}
        <View style={styles.card}>
          <Text style={styles.label}>Kategori</Text>
          <FlatList
            horizontal
            data={categories}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ gap: 14 }}
            renderItem={({ item }) => {
              const isActive = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  style={[styles.catItem, isActive && styles.catItemActive]}
                  onPress={() => setSelectedCategory(item.id)}
                >
                  <Image
                    source={{ uri: item.image_url }}
                    style={[styles.catImg, isActive && styles.catImgActive]}
                  />
                  <Text
                    style={[styles.catName, isActive && styles.catNameActive]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* RESTORAN */}
        <RestaurantPicker onSelect={(r) => setSelectedRestaurant(r)} />

        {/* ALERJENLER */}
        <View style={styles.card}>
          <Text style={styles.label}>Alerjenler</Text>

          <View style={styles.allergenContainer}>
            {allergenOptions.map((a) => {
              const isActive = allergens.includes(a.name);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.allergenChip,
                    isActive && styles.allergenChipActive,
                  ]}
                  onPress={() =>
                    setAllergens((prev) =>
                      prev.includes(a.name)
                        ? prev.filter((x) => x !== a.name)
                        : [...prev, a.name]
                    )
                  }
                >
                  <Text
                    style={[
                      styles.allergenText,
                      isActive && styles.allergenTextActive,
                    ]}
                  >
                    {a.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* KAYDET — USER YOKSA KİLİTLİ */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (saving || !user) && { opacity: 0.4 },
          ]}
          onPress={() => {
            if (!user) return router.push("/(auth)/login");
            handleSaveMeal();
          }}
          disabled={saving || !user}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Kaydediliyor..." : "Yemeği Kaydet"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 🔥 LOGIN OLMAYAN KULLANICIYA ALT BANNER */}
      {!user && (
        <View style={styles.lockBannerWrapper}>
          <LinearGradient
            colors={["rgba(255,92,77,0.95)", "rgba(255,92,77,0.8)"]}
            style={styles.lockBanner}
          >
            <Ionicons name="lock-closed-outline" size={22} color="#fff" />

            <Text style={styles.lockText}>
              Öğün eklemek için giriş yapmalısın
            </Text>

            <TouchableOpacity
              style={styles.lockBtn}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.lockBtnText}>Giriş Yap</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

//
// ---------------------------------------------------------
// STYLES
// ---------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#333" },

  infoBox: {
    marginHorizontal: 20,
    backgroundColor: "#FFF4E8",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  infoText: { color: "#B05A00", fontSize: 13, fontWeight: "600" },

  photoWrapper: { paddingHorizontal: 20, marginTop: 20 },
  photoCard: {
    backgroundColor: "#FFF8F7",
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  photoCardTitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#FF5C4D",
    fontWeight: "700",
  },

  photoBtns: {
    flexDirection: "row",
    marginTop: 14,
    gap: 12,
  },
  photoBtn: {
    backgroundColor: "#FFE0DC",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  photoBtnText: {
    color: "#FF5C4D",
    fontWeight: "700",
    fontSize: 12,
  },

  photoPreviewBox: { overflow: "hidden", borderRadius: 16 },
  previewImg: { width: "100%", height: 250 },

  changeBtn: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "#FF5C4D",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  changeBtnText: { color: "#fff", fontWeight: "700", fontSize: 11 },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 18,
    elevation: 1,
  },

  label: { color: "#333", fontWeight: "700", marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 12,
    padding: 12,
    color: "#333",
  },

  catItem: { alignItems: "center", width: 80 },
  catItemActive: { transform: [{ scale: 1.06 }] },

  catImg: { width: 60, height: 60, borderRadius: 10 },
  catImgActive: { borderWidth: 2, borderColor: "#FF5C4D" },

  catName: {
    marginTop: 6,
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
    textAlign: "center",
  },
  catNameActive: { color: "#FF5C4D" },

  allergenContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  allergenChip: {
    borderWidth: 1,
    borderColor: "#CCC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  allergenChipActive: {
    backgroundColor: "#FF5C4D",
    borderColor: "#FF5C4D",
  },

  allergenText: { fontSize: 12, color: "#333" },
  allergenTextActive: { color: "#fff" },

  saveBtn: {
    backgroundColor: "#FF5C4D",
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 25,
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // LOGIN BANNER
  lockBannerWrapper: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  lockBanner: {
    width: "92%",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  lockText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
    flex: 1,
  },

  lockBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },

  lockBtnText: {
    color: "#FF5C4D",
    fontWeight: "700",
  },
});
