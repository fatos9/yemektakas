import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * 🌈 Ortak Header bileşeni
 * Props:
 * - title: Başlık metni
 * - subtitle: Alt açıklama
 * - user: Kullanıcı bilgisi (foto ve ad)
 * - showAvatar: Profil resmi gösterilsin mi?
 * - align: 'left' | 'center' → yazı hizası
 * - height: Header yüksekliği (default: 220)
 * - marginTop: Başlık grubunun yukarıdan boşluğu (default: 40)
 */
export default function HeaderGradient({
  title,
  subtitle,
  user,
  showAvatar = true,
  align = "left",
  height = 220,
  marginTop = 40,
}) {
  return (
    <LinearGradient
      colors={["#FF5C4D", "#FF7B7B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { height }]}
    >
      <View
        style={[
          styles.content,
          { marginTop },
          align === "center" && {
            justifyContent: "center",
            textAlign: "center",
          },
        ]}
      >
        {/* 🔹 Başlık ve alt yazı */}
        <View
          style={[
            styles.textContainer,
            align === "center" && { alignItems: "center" },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

       
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 6,
    paddingHorizontal: 24,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#FFEFEF",
    opacity: 0.9,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#fff",
    marginLeft: 14,
  },
});
