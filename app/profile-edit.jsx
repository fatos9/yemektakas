import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function EditProfile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [photoURL, setPhotoURL] = useState(user?.photo_url || "");

  const handleSave = async () => {
    try {
      const res = await fetch("https://yummy-backend-fxib.onrender.com/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          username,
          photo_url: photoURL,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        return Alert.alert("Hata", json.error || "Profil güncellenemedi.");
      }

      Alert.alert("Başarılı", "Profil güncellendi.");
      router.back();

    } catch (err) {
      console.log("UPDATE ERROR:", err);
      Alert.alert("Hata", "Sunucuya bağlanırken hata oluştu.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profili Düzenle</Text>

      <Text style={styles.label}>Ad Soyad</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Ad Soyad"
      />

      <Text style={styles.label}>Fotoğraf URL</Text>
      <TextInput
        style={styles.input}
        value={photoURL}
        onChangeText={setPhotoURL}
        placeholder="https://..."
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Kaydet</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 30, color: "#FF5C4D" },

  label: { marginTop: 20, marginBottom: 5, color: "#333", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },

  saveBtn: {
    backgroundColor: "#FF5C4D",
    padding: 16,
    borderRadius: 12,
    marginTop: 40,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  logoutBtn: { marginTop: 30 },
  logoutText: { color: "#FF5C4D", fontWeight: "600", textAlign: "center" },
});
