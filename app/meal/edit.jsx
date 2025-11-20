import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import RestaurantPicker from "../../components/RestaurantPicker";

const API = "https://yummyum-backend.vercel.app/api";

export default function EditMeal() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ✔ Form alanları
  const [name, setName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [category, setCategory] = useState(null);
  const [allergens, setAllergens] = useState([]);
  const [restaurantLocation, setRestaurantLocation] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);

  const ALLERGEN_LIST = ["Yumurta", "Gluten", "Laktoz", "Fıstık"];

  // -----------------------------
  // 📌 Veriyi Çek
  // -----------------------------
  useEffect(() => {
    const loadMeal = async () => {
      try {
        const res = await fetch(`${API}/meals/${id}`);
        const data = await res.json();

        setName(data.name);
        setRestaurantName(data.restaurant_name);
        setImageURL(data.image_url);
        setCategory(data.category);

        setAllergens(Array.isArray(data.allergens) ? data.allergens : []);

        const parsedLoc =
          typeof data.restaurant_location === "string"
            ? JSON.parse(data.restaurant_location)
            : data.restaurant_location;

        setRestaurantLocation(parsedLoc);
      } catch (err) {
        console.log("EDIT LOAD ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMeal();
  }, [id]);

  // -----------------------------
  // 📌 Kategorileri çek
  // -----------------------------
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API}/categories`);
        const data = await res.json();
        setCategories(data);
      } catch (err) {}
    };
    loadCategories();
  }, []);

  // -----------------------------
  // 📸 Resim Yükleme
  // -----------------------------
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled) return;

    setUploading(true);

    const file = {
      uri: result.assets[0].uri,
      type: "image/jpeg",
      name: `meal_${Date.now()}.jpg`,
    };

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (uploadData.url) setImageURL(uploadData.url);
    } catch (err) {
      console.log("UPLOAD ERROR:", err);
    }

    setUploading(false);
  };

  // -----------------------------
  // 💾 Kaydet
  // -----------------------------
  const handleSave = async () => {
    if (!name || !restaurantName || !restaurantLocation) {
      Alert.alert("Uyarı", "Lütfen tüm alanları doldur.");
      return;
    }

    setSaving(true);
    console.log("SEND DATA-----:",JSON.stringify({
          name,
          restaurant_name: restaurantName,
          image_url: imageURL,
          category,
          allergens,
          restaurant_location: restaurantLocation,
        }));
    try {
      await fetch(`${API}/meals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          restaurant_name: restaurantName,
          image_url: imageURL,
          category,
          allergens,
          restaurant_location: restaurantLocation,
        }),
      });

      router.replace(`/meal/${id}`);
    } catch (err) {
      console.log("SAVE ERROR:", err);
    }

    setSaving(false);
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF5C4D" size="large" />
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      {/* GERİ TUŞU */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* FOTOĞRAF */}
      <TouchableOpacity onPress={pickImage}>
        <Image source={{ uri: imageURL }} style={styles.image} />
        <View style={styles.cameraIcon}>
          <Ionicons name="camera" size={22} color="#fff" />
        </View>
        {uploading && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.body}>
        {/* YEMEK ADI */}
        <Text style={styles.label}>Yemek Adı</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Pilav, Makarna..."
        />

        {/* RESTORAN */}
        <Text style={styles.label}>Restoran Adı</Text>
        <TextInput
          value={restaurantName}
          onChangeText={setRestaurantName}
          style={styles.input}
          placeholder="McDonalds, Simit Sarayı..."
        />

        {/* KATEGORİ SEÇİMİ */}
        <Text style={styles.label}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              style={[
                styles.catItem,
                category == cat.id && styles.catItemActive,
              ]}
            >
              <Image source={{ uri: cat.image_url }} style={styles.catImg} />
              <Text
                style={[
                  styles.catLabel,
                  category == cat.id && styles.catLabelActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ALERJENLER */}
        <Text style={styles.label}>Alerjenler</Text>
        <View style={styles.allergenWrap}>
          {ALLERGEN_LIST.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.allergenBox,
                allergens.includes(item) && styles.allergenBoxActive,
              ]}
              onPress={() => {
                if (allergens.includes(item)) {
                  setAllergens(allergens.filter((a) => a !== item));
                } else {
                  setAllergens([...allergens, item]);
                }
              }}
            >
              <Text
                style={[
                  styles.allergenText,
                  allergens.includes(item) && styles.allergenTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Restoran seçici */}
        <RestaurantPicker onSelect={(place) => setSelectedRestaurant(place)} />

        {/* KAYDET */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>{saving ? "Kaydediliyor..." : "Kaydet"}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  backBtn: {
    position: "absolute",
    top: 45,
    left: 18,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 30,
  },

  image: { width: "100%", height: 240 },

  cameraIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 20,
  },

  uploadOverlay: {
    position: "absolute",
    width: "100%",
    height: 240,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  body: { padding: 20 },

  label: { fontSize: 15, fontWeight: "700", marginTop: 16 },

  input: {
    marginTop: 8,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 12,
  },

  catItem: {
    alignItems: "center",
    marginRight: 14,
    marginTop: 8,
  },
  catItemActive: { transform: [{ scale: 1.08 }] },

  catImg: { width: 60, height: 60, borderRadius: 14 },

  catLabel: { fontSize: 12, color: "#444", marginTop: 4 },
  catLabelActive: { color: "#FF5C4D", fontWeight: "700" },

  allergenWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  allergenBox: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  allergenBoxActive: {
    backgroundColor: "#FF5C4D",
  },
  allergenText: { color: "#555" },
  allergenTextActive: { color: "#fff", fontWeight: "700" },

  map: { width: "100%", height: 180, borderRadius: 14, marginTop: 10 },

  saveBtn: {
    backgroundColor: "#FF5C4D",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
