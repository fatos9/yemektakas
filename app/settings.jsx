import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile, updatePassword, getAuth } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config";
import { useRouter } from "expo-router";

export default function Settings() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setPhotoURL(result.assets[0].uri);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      let uploadedURL = photoURL;

      if (photoURL && !photoURL.startsWith("https")) {
        const imageRef = ref(storage, `profiles/${user.uid}.jpg`);
        const response = await fetch(photoURL);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        uploadedURL = await getDownloadURL(imageRef);
      }

      await updateProfile(auth.currentUser, {
        displayName,
        photoURL: uploadedURL,
      });

      Alert.alert("✅ Başarılı", "Profil bilgilerin güncellendi!");
      router.back();
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      Alert.alert("Hata", "Profil güncellenemedi!");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6)
      return Alert.alert("Uyarı", "Şifre en az 6 karakter olmalı!");
    try {
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert("🔒 Başarılı", "Şifren değiştirildi!");
      setNewPassword("");
    } catch (error) {
      Alert.alert("Hata", "Şifre güncellenemedi! Yeniden giriş yapman gerekebilir.");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/(auth)/login");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFF8F7" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 🌈 Header */}
        <LinearGradient colors={["#FF7C68", "#FF5C4D"]} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Ayarları</Text>
        </LinearGradient>

        {/* 👤 Profil Kartı */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={{
                uri:
                  photoURL ||
                  "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.changePhoto}>Fotoğrafı Değiştir</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Ad Soyad</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="İsmini gir"
          />

          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#F7F7F7", color: "#999" }]}
            value={user?.email}
            editable={false}
          />

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <LinearGradient
                colors={["#FF5C4D", "#FF8C68"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.saveText}>Değişiklikleri Kaydet</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* 🔐 Şifre Değiştir */}
        <View style={styles.passwordCard}>
          <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
          <TextInput
            placeholder="Yeni Şifre"
            secureTextEntry
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
            <LinearGradient
              colors={["#FF5C4D", "#FF8C68"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBtn}
            >
              <Text style={styles.saveText}>Şifreyi Güncelle</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 🚪 Çıkış Yap (altta sabit) */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF5C4D" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 20,
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },

  profileCard: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 22,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginBottom: 8,
  },
  changePhoto: {
    textAlign: "center",
    color: "#FF5C4D",
    fontWeight: "600",
    marginBottom: 14,
  },
  label: { fontWeight: "600", color: "#555", marginTop: 8 },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 14,
    padding: 10,
    marginTop: 6,
    fontSize: 15,
    color: "#333",
  },
  saveBtn: { marginTop: 18 },
  gradientBtn: {
    borderRadius: 25,
    alignItems: "center",
    paddingVertical: 12,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  passwordCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 22,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 80,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: "#333" },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.3,
    borderColor: "#FF5C4D",
    borderRadius: 30,
    paddingVertical: 12,
    width: "90%",
  },
  logoutText: {
    marginLeft: 8,
    color: "#FF5C4D",
    fontWeight: "700",
    fontSize: 15,
  },
});
