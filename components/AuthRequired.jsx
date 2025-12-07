import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AuthRequired() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed-outline" size={80} color="#FF5C4D" />

      <Text style={styles.title}>Bu alan için giriş yapmalısın</Text>

      <Text style={styles.subtitle}>
        Sohbet etmek, profiline erişmek ve eşleşmeleri görmek için giriş yap.
      </Text>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.loginText}>Giriş Yap</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerBtn}
        onPress={() => router.push("/(auth)/register")}
      >
        <Text style={styles.registerText}>Kayıt Ol</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    color: "#111",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  loginBtn: {
    backgroundColor: "#FF5C4D",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 24,
  },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  registerBtn: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 12,
  },
  registerText: { color: "#111", fontWeight: "600", fontSize: 15 },
});
