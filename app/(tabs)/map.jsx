import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  ActivityIndicator
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";

const { width } = Dimensions.get("window");

export default function MapScreen() {
  const mapRef = useRef(null);
  const router = useRouter();
  const { user } = useAuth();

  const [region, setRegion] = useState(null);
  const [meals, setMeals] = useState([]);
  const [groupedMeals, setGroupedMeals] = useState([]);
  const [selectedMealGroup, setSelectedMealGroup] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 📍 Kullanıcı konumu
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.015,   // 🔥 1.5 Km yakın zoom
        longitudeDelta: 0.015,
      });
    })();
  }, []);

  // 🍽 Öğünleri API'den çek
  useEffect(() => {
    async function loadMeals() {
      try {
        const res = await fetch("https://yummyum-backend.vercel.app/api/meals");
        const data = await res.json();

        setMeals(data);

        // 📌 Aynı konumdaki yemekleri grupluyoruz
        const groups = {};
        data.forEach((meal) => {
          if (!meal.restaurant_location) return;

          const key = `${meal.restaurant_location.lat.toFixed(4)}_${meal.restaurant_location.lng.toFixed(4)}`;

          if (!groups[key]) groups[key] = [];
          groups[key].push(meal);
        });

        setGroupedMeals(Object.values(groups));

      } catch (e) {
        console.log("MEALS LOAD ERROR:", e);
      } finally {
        setLoading(false);
      }
    }

    loadMeals();
  }, []);

  // 📍 Kullanıcı konumuna geri dön
  const handleFocusUser = async () => {
    let loc = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    });
  };

  // 📌 Marker tıklanınca
  const handleMarkerPress = (group) => {
    setSelectedMealGroup(group);
    setActiveIndex(0);
  };

  const renderMealCard = ({ item }) => (
    <TouchableOpacity
      style={styles.detailCard}
      onPress={() => router.push(`/mealDetail?mealId=${item.id}`)}
    >
      <Image source={{ uri: item.image_url }} style={styles.detailImage} />

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.detailTitle}>{item.name}</Text>
        <Text style={styles.detailSubtitle}>{item.restaurant_name}</Text>

        <View style={styles.detailFooter}>
          <Image
            source={{
              uri: item.photo_url || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
            }}
            style={styles.avatar}
          />

          <Text style={styles.userName}>{item.username || "Yemeksever"}</Text>
          <Text style={styles.rating}>⭐ {item.rating ?? "4.8"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!region || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* 🧭 HARİTA */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}                
        showsUserLocation
        rotateEnabled={false}
        scrollEnabled={false}         
        pitchEnabled={false}
        zoomEnabled={false}           
        minZoomLevel={15}             
        maxZoomLevel={15}         
      >
        {groupedMeals.map((group, idx) => {
          const loc = group[0].restaurant_location;

          return (
            <Marker
              key={idx}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              pinColor="#FF5C4D"
              onPress={() => handleMarkerPress(group)}
            />
          );
        })}
      </MapView>

      {/* 📋 Detay Kartları */}
      {Array.isArray(selectedMealGroup) && (
        <View style={styles.detailWrapper}>
          <FlatList
            data={selectedMealGroup}
            horizontal
            pagingEnabled
            keyExtractor={(item) => item.id}
            renderItem={renderMealCard}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* 📍 Konum butonu */}
      <TouchableOpacity style={styles.locateButton} onPress={handleFocusUser}>
        <Ionicons name="locate-outline" size={22} color="#fff" />
      </TouchableOpacity>

      {/* ➕ Öğün Ekle */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/share")}
      >
        <LinearGradient
          colors={["#FF5C4D", "#FF8C68"]}
          style={styles.addButtonInner}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Öğün Ekle</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  map: { flex: 1 },

  detailWrapper: {
    position: "absolute",
    bottom: 100,
  },
  detailCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 10,
    marginHorizontal: 14,
    width: width * 0.9,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  detailImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  detailSubtitle: {
    fontSize: 13,
    color: "#777",
    marginVertical: 2,
  },
  detailFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  userName: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  rating: {
    fontSize: 12,
    color: "#FFB800",
    marginLeft: 8,
  },

  locateButton: {
    position: "absolute",
    bottom: 28,
    left: 20,
    backgroundColor: "#FF5C4D",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  addButton: {
    position: "absolute",
    bottom: 28,
    right: 20,
  },
  addButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 40,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 15,
  },
});
