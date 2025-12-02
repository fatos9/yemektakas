import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import MealCard from "../../components/MealCard";
import { LinearGradient } from "expo-linear-gradient";

import { api } from "../../config/api";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [premiumVisible, setPremiumVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ---------------------------------------------------
  // KATEGORİLERİ ÇEK
  // ---------------------------------------------------
  const fetchCategories = async () => {
    try {
      const res = await fetch(api.categories);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Kategori hatası:", err);
    }
  };

  // ---------------------------------------------------
  // ÖĞÜNLERİ ÇEK — kendi öğünlerini filtrele
  // ---------------------------------------------------
  const fetchMeals = async () => {
    try {
      const res = await fetch(api.meals);
      const data = await res.json();
      console.log('__________________________Ana Sayfa Tüm Öğünler:',data);
      if (!Array.isArray(data)) return;

      const myUid = user?.uid;

      const others = data.filter(meal => meal.user_id !== myUid);

      setMeals(others);
      setFilteredMeals(others);

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.log("Meal alma hatası:", err);
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // OKUNMAMIŞ BİLDİRİMLER
  // ---------------------------------------------------
  const fetchUnread = async () => {
    if (!user?.uid) return;

    try {
      const res = await fetch(api.notifications, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const data = await res.json();
      const unread = data.filter((n) => !n.is_read).length;

      setHasUnread(unread > 0);
    } catch (err) {
      console.log("UNREAD hatası:", err);
    }
  };

  // ---------------------------------------------------
  // USE EFFECT — ilk açılış
  // ---------------------------------------------------
  useEffect(() => {
    fetchCategories();
    fetchMeals();
    fetchUnread();
  }, [user]);

  const handleCategorySelect = (id) => {
    if (selectedCategory === id) {
      setSelectedCategory(null);
      setFilteredMeals(meals);
    } else {
      setSelectedCategory(id);
      setFilteredMeals(meals.filter((m) => m.category === id));
    }
  };

  const handleAddMealPress = () => {
    router.push("/share");
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeals();
    fetchCategories();
    fetchUnread();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  // ---------------------------------------------------
  // HEADER
  // ---------------------------------------------------
  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>
            Selam, {user?.username || "Yemeksever"} 👋
          </Text>
          <Text style={styles.subtitle}>Bugün ne yiyelim?</Text>
        </View>

        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => {
            setHasUnread(false);
            router.push("/match/MatchRequestsScreen");
          }}
        >
          <Ionicons name="notifications-outline" size={26} color="#333" />
          {hasUnread && <View style={styles.dot} />}
        </TouchableOpacity>
      </View>

      {/* ARAMA */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          placeholder="Yemek veya restoran ara..."
          placeholderTextColor="#aaa"
          style={styles.searchInput}
        />
      </View>

      {/* BANNER */}
      <TouchableOpacity activeOpacity={0.9} onPress={() => setPremiumVisible(true)}>
        <LinearGradient
          colors={["#FF5C4D", "#FF8C68"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Hızlı Paylaş, Hızlı Eşleş!</Text>
            <Text style={styles.bannerSubtitle}>
              Bugün senin için lezzetli eşleşmeler hazır 🍱
            </Text>
          </View>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
            }}
            style={styles.bannerImage}
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* KATEGORİLER */}
      <View style={styles.categoryWrapper}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCategorySelect(item.id)}
              style={[
                styles.categoryItem,
                selectedCategory === item.id && styles.categoryItemActive,
              ]}
            >
              <Image
                source={{ uri: item.image_url }}
                style={[
                  styles.categoryImage,
                  selectedCategory === item.id && styles.categoryImageActive,
                ]}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === item.id && styles.categoryLabelActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* MEAL LIST */}
      <FlatList
        data={filteredMeals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16 }}>
            <MealCard meal={item} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF5C4D"]}
          />
        }
      />

      {/* ADD MEAL BUTTON */}
      <Animated.View
        style={[styles.addButtonContainer, { transform: [{ scale: scaleAnim }] }]}
      >
        <TouchableOpacity
          onPress={() => {
            animateButton();
            handleAddMealPress();
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#FF5C4D", "#FF8C68"]}
            style={styles.addButton}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addButtonText}>Öğün Paylaş</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* PREMIUM MODAL */}
      <Modal visible={premiumVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPremiumVisible(false)}
        />

        <Animated.View
          style={[styles.modalSheet, { transform: [{ translateY }] }]}
        >
          <Text style={styles.premiumTitle}>Premium’a Geç</Text>
          <Text style={styles.premiumDesc}>
            Daha hızlı eşleş, özel filtreler aç ve yakınındaki en iyi öğünlere
            ulaş!
          </Text>

          <TouchableOpacity style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>
              Hemen Premium’a Geç →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPremiumVisible(false)}>
            <Text style={styles.closeText}>Kapat</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  hello: { fontSize: 20, fontWeight: "700", color: "#333" },
  subtitle: { color: "#777", marginTop: 4, fontSize: 14 },

  bellButton: { position: "relative", padding: 6 },
  dot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    backgroundColor: "#FF5C4D",
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#333", marginLeft: 8 },

  banner: {
    margin: 20,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  bannerContent: { flex: 1, gap: 6 },
  bannerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  bannerSubtitle: { color: "#fff", fontSize: 13, opacity: 0.9 },
  bannerImage: { width: 80, height: 80, resizeMode: "contain", marginLeft: 10 },

  categoryWrapper: {
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  categoryItem: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  categoryItemActive: { transform: [{ scale: 1.06 }] },
  categoryImage: { width: 70, height: 70, borderRadius: 12 },
  categoryImageActive: { borderWidth: 2, borderColor: "#FF5C4D" },
  categoryLabel: {
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
    marginTop: 6,
  },
  categoryLabelActive: { color: "#FF5C4D" },

  addButtonContainer: {
    position: "absolute",
    bottom: 28,
    right: 20,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 40,
    shadowColor: "#FF5C4D",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 15,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },

  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  premiumTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    color: "#333",
  },
  premiumDesc: { fontSize: 15, color: "#555", marginBottom: 18 },

  premiumButton: {
    backgroundColor: "#FF5C4D",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  premiumButtonText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  closeText: {
    textAlign: "center",
    color: "#555",
    fontSize: 14,
    marginTop: 6,
  },
});
