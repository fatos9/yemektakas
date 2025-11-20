import { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SwipeableNotification({ item = {}, onDelete, onAccept, onPress }) {
  const translateX = useRef(new Animated.Value(0)).current;

  const senderName = item.sender_name || "Kullanıcı";
  const senderPhoto =
    item.sender_photo ||
    item.photo_url ||
    "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  const timeAgo = item.timeAgo || "Az önce";

  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,

    onPanResponderMove: (_, g) => {
      if (g.dx < 0 && g.dx > -90) translateX.setValue(g.dx);
    },

    onPanResponderRelease: (_, g) => {
      Animated.timing(translateX, {
        toValue: g.dx < -40 ? -80 : 0,
        duration: 160,
        useNativeDriver: true,
      }).start();
    },
  });

  return (
    <View style={styles.swipeWrapper}>
      
      {/* ÇÖP BUTONU */}
      <View style={styles.trashBox}>
        <TouchableOpacity onPress={() => onDelete(item)}>
          <Ionicons name="trash-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 🔥 KART */}
      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...pan.panHandlers}
      >

        {/* TAM TIKLANABİLİR OVERLAY */}
        <TouchableOpacity
          style={styles.fullClickArea}
          onPress={() => onPress?.(item)}
          activeOpacity={1}
        />

        {/* GERÇEK KART İÇERİĞİ */}
        <View style={{ flexDirection: "row" }}>
          <Image source={{ uri: senderPhoto }} style={styles.avatar} />

          <View style={{ flex: 1 }}>
            <Text style={styles.mainText}>
              <Text style={styles.bold}>{senderName}</Text> sana bir eşleşme isteği gönderdi 🍱
            </Text>

            <Text style={styles.timeText}>{timeAgo}</Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(item)}>
                <Text style={styles.acceptText}>Kabul Et</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.rejectBtn} onPress={() => onDelete(item)}>
                <Text style={styles.rejectText}>Reddet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeWrapper: { width: "100%", marginBottom: 16 },

  trashBox: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    borderRadius: 12,
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    elevation: 2,
  },

  fullClickArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  mainText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },

  bold: { fontWeight: "700" },

  timeText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },

  actions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },

  acceptBtn: {
    backgroundColor: "#FF5C4D",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    zIndex: 2,
  },

  acceptText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  rejectBtn: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    zIndex: 2,
  },

  rejectText: { color: "#333", fontWeight: "700", fontSize: 13 },
});
