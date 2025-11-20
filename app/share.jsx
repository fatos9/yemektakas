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
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Upload } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import RestaurantPicker from "../components/RestaurantPicker";
import HeaderGradient from "../components/HeaderGradient";

const API_BASE = "https://yummy-backend-fxib.onrender.com";

export default function AddMeal() {
  const router = useRouter();
  const { token } = useAuth();

  const [mealName, setMealName] = useState("");
  const [categories, setCategories] = useState([]);
  const [allergenOptions, setAllergenOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allergens, setAllergens] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // -------------------------------------------------------
  // 🔥 KONUM İZNİ
  // -------------------------------------------------------
  const requestLocationPermission = async () => {
    const { status, canAskAgain } =
      await Location.requestForegroundPermissionsAsync();

    if (status === "granted") return true;

    if (!canAskAgain) {
      Alert.alert(
        "Konum Engellendi",
        "Konum izni uygulama ayarlarından açılmalıdır.",
        [{ text: "Ayarları Aç", onPress: () => Linking.openSettings() }]
      );
      return false;
    }

    Alert.alert("Konum Gerekli", "Yakındaki restoranlar için konum gerekli.");
    return false;
  };

  useEffect(() => {
    (async () => {
      await requestLocationPermission();
      setLoading(false);
    })();
  }, []);

  // -------------------------------------------------------
  // 🔥 KATEGORİ & ALERJENLERİ ÇEK
  // -------------------------------------------------------
  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.log("Kategori hatası:", err));

    fetch(`${API_BASE}/allergens`)
      .then((res) => res.json())
      .then((data) => setAllergenOptions(data))
      .catch((err) => console.log("Alerjen hatası:", err));
  }, []);

  // -------------------------------------------------------
  // 📸 Fotoğraf seçme
  // -------------------------------------------------------
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Kamera izni gerekli");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  // -------------------------------------------------------
  // 📤 Fotoğrafı backend'e yükle
  // -------------------------------------------------------
  async function uploadToBackend(uri) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const filename = `meal_${Date.now()}.jpg`;

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: filename, base64 }),
    });

    const data = await res.json();
    return data.url;
  }

  // -------------------------------------------------------
  // 💾 Öğünü Kaydet
  // -------------------------------------------------------
  const handleSaveMeal = async () => {
    if (!mealName.trim() || !selectedCategory)
      return Alert.alert("Eksik bilgi", "Yemek adı ve kategori zorunludur");

    try {
      setSaving(true);

      // 📍 Kullanıcı konumu
      const loc = await Location.getCurrentPositionAsync({});
      const userLocation = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };

      // 📍 Restoran konumu
      let restaurantLocation = null;
      if (selectedRestaurant?.geometry?.location) {
        restaurantLocation = {
          lat: selectedRestaurant.geometry.location.lat,
          lng: selectedRestaurant.geometry.location.lng,
        };
      }

      // 🖼 Fotoğraf upload
      let imageURL = "";
      if (selectedImage) {
        imageURL = await uploadToBackend(selectedImage);
      }

      // 🚀 API’ye gönder
      const response = await fetch(`${API_BASE}/meals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: mealName,
          image_url: imageURL,
          category: selectedCategory,
          allergens,
          restaurant_name:
            selectedRestaurant?.name || "Bilinmeyen Restoran",
          restaurant_location: restaurantLocation,
          user_location: userLocation,
        }),
      });

      if (!response.ok) {
        console.log(await response.text());
        throw new Error("API error");
      }

      Alert.alert("🎉 Başarılı", "Yemeğin paylaşıldı!", [
        { text: "Tamam", onPress: () => router.push("/(tabs)") },
      ]);
    } catch (err) {
      console.log(err);
      Alert.alert("Hata", "Yemek eklenirken bir sorun oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <HeaderGradient
          title="Yeni Öğün Ekle"
          subtitle="Lezzetini paylaş 🍽️"
          align="center"
          showAvatar={false}
          marginTop={-50}
        />

        {/* ======================================
              FOTOĞRAF ALANI
        ====================================== */}
        <View style={styles.imageWrapper}>
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
              />
              <TouchableOpacity style={styles.replaceBtn} onPress={pickImage}>
                <Upload size={16} color="#fff" />
                <Text style={styles.replaceText}>Değiştir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageUploadCard}>
              <View style={styles.iconCircle}>
                <Camera size={22} color="#FF5C4D" />
              </View>
              <Text style={styles.uploadTitle}>Görsel Ekle</Text>

              <View style={styles.uploadButtons}>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={pickImage}
                >
                  <Upload size={16} color="#FF5C4D" />
                  <Text style={styles.uploadBtnText}>Galeriden</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={takePhoto}
                >
                  <Camera size={16} color="#FF5C4D" />
                  <Text style={styles.uploadBtnText}>Kameradan</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ======================================
              YEMEK ADI
        ====================================== */}
        <View style={styles.card}>
          <Text style={styles.label}>Yemek Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Mantı, Pilav..."
            value={mealName}
            onChangeText={setMealName}
          />
        </View>

        {/* ======================================
              KATEGORİLER
        ====================================== */}
        <View style={styles.card}>
          <Text style={styles.label}>Kategori</Text>

          <FlatList
            horizontal
            data={categories}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ gap: 14, paddingVertical: 6 }}
            renderItem={({ item }) => {
              const isActive = selectedCategory === item.id;

              return (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    isActive && styles.categoryItemActive,
                  ]}
                  onPress={() => setSelectedCategory(item.id)}
                >
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.categoryImage}
                  />
                  <Text
                    style={[
                      styles.categoryName,
                      isActive && styles.categoryNameActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* ======================================
              ALERJENLER
        ====================================== */}
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

        {/* ======================================
              RESTORAN SEÇİCİ
        ====================================== */}
        <RestaurantPicker
          onSelect={(place) => setSelectedRestaurant(place)}
        />

        {/* ======================================
              KAYDET
        ====================================== */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSaveMeal}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? "Kaydediliyor..." : "Yemeği Kaydet"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

//
//  S T Y L E S
//
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  scroll: { paddingBottom: 120 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  imageWrapper: { marginTop: -80, paddingHorizontal: 20 },
  imageUploadCard: {
    backgroundColor: "#FFF8F7",
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#FFC9C2",
    paddingVertical: 20,
    alignItems: "center",
  },
  iconCircle: {
    backgroundColor: "#FFE7E3",
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTitle: { color: "#FF5C4D", fontSize: 15, fontWeight: "700" },

  uploadButtons: { flexDirection: "row", gap: 10, marginTop: 12 },
  uploadBtn: {
    borderWidth: 1,
    borderColor: "#FFB6A9",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  uploadBtnText: { color: "#FF5C4D", fontWeight: "600", fontSize: 12 },

  imagePreviewContainer: { alignItems: "center" },
  imagePreview: { width: "100%", height: 220, borderRadius: 15 },

  replaceBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#FF6B5A",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  replaceText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginVertical: 10,
  },

  label: { fontWeight: "700", color: "#333", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 12,
    padding: 12,
  },

  categoryItem: { alignItems: "center", width: 80 },
  categoryItemActive: { transform: [{ scale: 1.05 }] },
  categoryImage: { width: 60, height: 60, borderRadius: 10, borderWidth: 2 },
  categoryName: { marginTop: 6, fontSize: 13, color: "#555" },
  categoryNameActive: { color: "#FF5C4D", fontWeight: "700" },

  allergenContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergenChip: {
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  allergenChipActive: {
    backgroundColor: "#FF5C4D",
    borderColor: "#FF5C4D",
  },
  allergenText: { color: "#444", fontSize: 13 },
  allergenTextActive: { color: "#fff", fontWeight: "700" },

  saveBtn: {
    backgroundColor: "#FF5C4D",
    borderRadius: 30,
    marginHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
