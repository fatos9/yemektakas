import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import MealCard from "../../components/MealCard";
import AuthRequired from "../../components/AuthRequired";

export default function ProfileScreen() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  // DEBUG
  useEffect(() => {
    console.log("🔵 CURRENT USER:", user);
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );
  }

  if (!user) return <AuthRequired />;


  // USER → AuthContext içindeki JSON
  const meals = user?.meals || [];
  console.log("________________PROFİLE MEALS:",meals);

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/profile-edit")}>
          <Ionicons name="settings-outline" size={26} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {user.username || "Kullanıcı"}
        </Text>

        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={26} color="#111" />
        </TouchableOpacity>
      </View>

      {/* TOP AREA */}
      <View style={styles.profileTop}>
        <Image
          source={{
            uri:
              user.photo_url ||
              "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
          }}
          style={styles.avatar}
        />

        <View style={styles.profileStatsWrapper}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{meals.length}</Text>
            <Text style={styles.statLabel}>Paylaşılan</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.matchCount || 0}</Text>
            <Text style={styles.statLabel}>Eşleşme</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.points || 0}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>
      </View>

      {/* NAME + EDIT BTN */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.nameText}>{user.username}</Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{user.rating || "0.0"}</Text>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push("/profile-edit")}
        >
          <Text style={styles.editBtnText}>Profili Düzenle</Text>
        </TouchableOpacity>
      </View>

      {/* MEALS */}
      <ScrollView style={{ flex: 1 }}>
        {meals.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="fast-food-outline" size={64} color="#FFB8B0" />
            <Text style={styles.emptyText}>Henüz öğün paylaşmadın</Text>

            <TouchableOpacity
              style={styles.addMealBtn}
              onPress={() => router.push("/share")}
            >
              <Text style={styles.addMealText}>Öğün Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mealGrid}>
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 10, // SAFE AREA zaten üst boşluğu veriyor
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  editBtnText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 15,
  },

  empty: { alignItems: "center", marginTop: 50 },
  emptyText: { marginTop: 10, color: "#777" },

  addMealBtn: {
    marginTop: 16,
    backgroundColor: "#FF5C4D",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  addMealText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  mealGrid: {
    padding: 16,
    gap: 14,
  },
});
