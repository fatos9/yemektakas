import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../firebase/config";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { user, loginWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ---------------------------------------------------
  // GOOGLE LOGIN
  // ---------------------------------------------------
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "888477688304-dai2mdq8eql0rs84f5b88d0n2e73eij8.apps.googleusercontent.com",
    iosClientId:
      "888477688304-nsu68e9271vpgeq9s2sib3blkkhmeb5g.apps.googleusercontent.com",
    androidClientId:
      "888477688304-ddq7sg6i0fmp640j5j1tq75uv65j8978.apps.googleusercontent.com",
  });

  useEffect(() => {
    const processGoogleLogin = async () => {
      if (response?.type === "success") {
        try {
          const { id_token } = response.params;

          const credential = GoogleAuthProvider.credential(id_token);
          const firebaseUser = await signInWithCredential(auth, credential);

          console.log("Google login successful:", firebaseUser.user.email);

          // onAuthStateChanged backend → profile işlemini yapacak
        } catch (err) {
          console.log("Google login error:", err);
          Alert.alert("Hata", "Google girişi başarısız.");
        }
      }
    };

    processGoogleLogin();
  }, [response]);

  // ---------------------------------------------------
  // EMAIL LOGIN
  // ---------------------------------------------------
  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert("Eksik Bilgi", "Email ve şifre girilmelidir.");
    }

    try {
      await loginWithEmail(email, password);
      // onAuthStateChanged otomatik tabs'a yönlendirecek
    } catch (err) {
      console.log("Email login error:", err);
      Alert.alert("Hata", "Email veya şifre yanlış.");
    }
  };

  // ---------------------------------------------------
  // Oturum açıksa yönlendir
  // ---------------------------------------------------
  useEffect(() => {
    if (user) router.replace("/(tabs)");
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yummy Yum</Text>
      <Text style={styles.subtitle}>Lezzeti paylaşmaya başla 🍽️</Text>

      {/* Email input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password input */}
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Email login button */}
      <TouchableOpacity style={styles.loginBtn} onPress={handleEmailLogin}>
        <Text style={styles.loginText}>Giriş Yap</Text>
      </TouchableOpacity>

      {/* Google login */}
      <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()}>
        <Text style={styles.googleText}>Google ile Giriş Yap</Text>
      </TouchableOpacity>

      {/* Register */}
      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.registerText}>Hesabın yok mu? Kayıt Ol</Text>
      </TouchableOpacity>
    </View>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    color: "#FF5C4D",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#777",
    marginBottom: 40,
    fontSize: 16,
  },
  input: {
    backgroundColor: "#F5F5F5",
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    fontSize: 15,
  },
  loginBtn: {
    backgroundColor: "#FF5C4D",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  googleBtn: {
    backgroundColor: "#FFF4F2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  googleText: { color: "#FF5C4D", fontSize: 16, fontWeight: "700" },

  registerText: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
    fontWeight: "600",
  },
});
