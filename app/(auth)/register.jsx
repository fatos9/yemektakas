import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { registerWithEmail } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!username.trim()) return Alert.alert("Hata", "İsim boş olamaz.");
    if (!email.includes("@")) return Alert.alert("Hata", "Geçerli bir email girin.");
    if (password.length < 6)
      return Alert.alert("Hata", "Şifre en az 6 karakter olmalı.");

    try {
      await registerWithEmail(email, password, username);
      router.replace("/(tabs)/profile");
    } catch (err) {
      console.log("Register error:", err);
      Alert.alert("Kayıt hatası", err.message || "Bir hata oluştu.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>
      <Text style={styles.subtitle}>Hemen hesabını oluştur.</Text>

      <View style={{ marginTop: 25 }}>
        <Text style={styles.label}>Ad Soyad</Text>
        <TextInput
          placeholder="Ad Soyad"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="ornek@mail.com"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Şifre</Text>
        <TextInput
          placeholder="••••••••"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleRegister}>
        <Text style={styles.btnText}>Kayıt Ol</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.loginLink}>
          Hesabın var mı? <Text style={styles.loginBold}>Giriş Yap</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 40,
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 6,
  },
  label: {
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
    marginTop: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  btn: {
    backgroundColor: "#FF5C4D",
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  loginLink: {
    textAlign: "center",
    color: "#555",
  },
  loginBold: {
    fontWeight: "700",
    color: "#FF5C4D",
  },
});
