import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");
const GOOGLE_API_KEY = "AIzaSyAKPjLtlOaV_UOIZpBajP-LmUY8zBQEPL8";

export default function RestaurantPicker({ onSelect }) { // 🔹 callback prop
  const [region, setRegion] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Konum izni verilmedi 😕");
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(coords);
      await fetchNearbyRestaurants(coords.latitude, coords.longitude);
      setLoading(false);
    })();
  }, []);

  const fetchNearbyRestaurants = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=restaurant&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK") {
        setRestaurants(data.results);
      } else {
        console.warn("Google API response:", data.status);
        setRestaurants([]);
      }
    } catch (err) {
      console.error("🍔 Restoran hatası:", err);
    }
  };

  const handleSelect = (place) => {
    setSelectedRestaurant(place);
    if (onSelect) onSelect(place); // ✅ seçilen restoranı üst bileşene gönder
    mapRef.current?.animateToRegion({
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    const index = restaurants.findIndex((r) => r.place_id === place.place_id);
    if (index !== -1)
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  if (loading || !region)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5C4D" />
        <Text style={{ color: "#FF5C4D", marginTop: 10 }}>Restoranlar yükleniyor...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Yakındaki Restoranlar</Text>

      <FlatList
        ref={listRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={restaurants}
        keyExtractor={(item) => item.place_id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
        renderItem={({ item }) => {
          const isActive = selectedRestaurant?.place_id === item.place_id;
          const photo =
            item.photos?.[0]?.photo_reference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
              : "https://cdn-icons-png.flaticon.com/512/1046/1046784.png";

          return (
            <TouchableOpacity
              style={[styles.card, isActive && styles.activeCard]}
              onPress={() => handleSelect(item)}
            >
              <Image source={{ uri: photo }} style={styles.image} />
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.address} numberOfLines={1}>
                {item.vicinity}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <MapView ref={mapRef} style={styles.map} region={region} provider="google">
        {restaurants.map((r) => (
          <Marker
            key={r.place_id}
            coordinate={{
              latitude: r.geometry.location.lat,
              longitude: r.geometry.location.lng,
            }}
            pinColor={selectedRestaurant?.place_id === r.place_id ? "#FF4D4D" : "#FFB84D"}
            onPress={() => handleSelect(r)}
          />
        ))}
      </MapView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginLeft: 16,
    marginTop: 6,
    marginBottom: 10,
  },
  map: {
    height: 280,
    width: width,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    width: 180,
    overflow: "hidden",
  },
  activeCard: {
    borderWidth: 2,
    borderColor: "#FF4D4D",
    transform: [{ scale: 1.03 }],
  },
  image: { width: "100%", height: 100 },
  name: {
    fontWeight: "700",
    fontSize: 14,
    color: "#333",
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  address: {
    fontSize: 12,
    color: "#666",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
