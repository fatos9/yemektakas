import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function MealCard({ meal }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/meal/${meal.id}`)}
    >
      {/* 📸 Arka Plan Görseli */}
      <Image
        source={{
          uri:
            meal.image_url ||
            "https://cdn-icons-png.flaticon.com/512/1046/1046873.png",
        }}
        style={styles.image}
      />

      {/* 🔹 ALT BİLGİ KUTUSU */}
      <View style={styles.bottomInfo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mealName} numberOfLines={1}>
            {meal.name || "Yemek Adı"}
          </Text>

          {/* 📍 Restoran */}
          <View style={styles.row}>
            <Ionicons name="location-outline" size={13} color="#fff" />
            <Text style={styles.location} numberOfLines={1}>
              {meal.restaurant_name || "Restoran"}
            </Text>
          </View>

          {/* ⭐ Rating */}
          <View style={styles.row}>
            <Ionicons name="star" size={13} color="#FFD700" />
            <Text style={styles.ratingText}>
              {meal.rating ?? "4.8"}
            </Text>
          </View>
        </View>

        {/* 🔍 Detay butonu */}
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => router.push(`/meal/${meal.id}`)}
        >
          <Ionicons name="search" size={18} color="#333" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 18,
  },
  image: {
    width: "100%",
    height: 200,
  },
  bottomInfo: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  location: {
    color: "#ddd",
    fontSize: 12,
    maxWidth: 200,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 12,
  },
  detailButton: {
    backgroundColor: "#fff",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});
