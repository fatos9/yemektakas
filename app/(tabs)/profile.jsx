import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import * as Location from "expo-location";
import MealCard from "../../components/MealCard";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("meals");

  const loadProfile = async () => {
    try {
      const res = await fetch(
        `https://yummyum-backend.vercel.app/api/users?id=${user.id}`
      );
      const json = await res.json();
      setProfile(json);
    } catch (e) {
      console.log("PROFILE ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadProfile();
  }, [user]);

  const handleLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("İzin Gerekli", "Konum izni vermelisin.");
    }
    Alert.alert("Konum Aktif", "Artık konum tabanlı öneriler alabilirsin.");
  };

  // ------------------------ UI --------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>Profil yüklenemedi.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ==========================
          INSTAGRAM TARZI HEADER
      =========================== */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={26} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{profile.user.username}</Text>

        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={26} color="#111" />
        </TouchableOpacity>
      </View>

      {/* PROFILE TOP AREA */}
      <View style={styles.profileTop}>

        <Image
          source={{
            uri:
              profile.user.photo_url ||
              "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
          }}
          style={styles.avatar}
        />

        <View style={styles.profileStatsWrapper}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.meals.length}</Text>
            <Text style={styles.statLabel}>Paylaşılan</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.matchCount}</Text>
            <Text style={styles.statLabel}>Eşleşme</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.points}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>
      </View>

      {/* NAME + RATING */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.nameText}>{profile.user.username}</Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{profile.user.rating}</Text>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => Alert.alert("Yakında", "Profil düzenleme geliyor.")}
        >
          <Text style={styles.editBtnText}>Profili Düzenle</Text>
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabsRow}>
        {["meals", "matches"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "meals" ? "Öğünler" : "Eşleşmeler"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }}>

        {/* === ÖĞÜNLER === */}
        {activeTab === "meals" && (
          <>
            {profile.meals.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="fast-food-outline" size={64} color="#FFB8B0" />
                <Text style={styles.emptyText}>Henüz öğün paylaşmadın</Text>
              </View>
            ) : (
              <View style={styles.mealGrid}>
                {profile.meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </View>
            )}
          </>
        )}

        {/* === EŞLEŞME GEÇMİŞİ === */}
        {activeTab === "matches" && (
          <View style={styles.empty}>
            <Ionicons name="people-circle-outline" size={64} color="#FFB8B0" />
            <Text style={styles.emptyText}>Eşleşme geçmişi yakında</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

/* ====================== STYLES ====================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  profileTop: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    alignItems: "center",
    gap: 24,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  profileStatsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },

  statItem: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "700", color: "#FF5C4D" },
  statLabel: { fontSize: 12, color: "#777" },

  nameText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginTop: 4,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  ratingText: { color: "#777", marginLeft: 5, fontWeight: "600" },

  editBtn: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    width: 140,
  },
  editBtnText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 14,
  },

  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
    marginTop: 10,
  },

  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 18,
  },

  tabButtonActive: {
    backgroundColor: "#FFEEE9",
  },

  tabText: { fontWeight: "600", color: "#777" },
  tabTextActive: { color: "#FF5C4D" },

  mealGrid: {
    padding: 16,
    gap: 14,
  },

  empty: { alignItems: "center", marginTop: 50 },
  emptyText: { marginTop: 10, color: "#777" },
});

