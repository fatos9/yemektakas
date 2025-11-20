import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../firebase/config";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { user } = useAuth();

  // Google OAuth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "888477688304-dai2mdq8eql0rs84f5b88d0n2e73eij8.apps.googleusercontent.com",
    iosClientId: "1:888477688304:ios:5554a6a0343046bc3efd35",
    androidClientId: "1:888477688304:android:65b5caf555ee76bb3efd35",
  });

  // 🎯 Google Login Response
  useEffect(() => {
    const signInWithGoogle = async () => {
      if (response?.type === "success") {
        try {
          const { id_token } = response.params;

          const credential = GoogleAuthProvider.credential(id_token);
          await signInWithCredential(auth, credential);

          console.log("✅ Google ile giriş başarılı");
        } catch (err) {
          console.log("Google login error:", err);
          Alert.alert("Hata", "Google ile giriş yapılamadı.");
        }
      }
    };

    signInWithGoogle();
  }, [response]);

  // Giriş yapılmışsa yönlendir
  useEffect(() => {
    if (user) router.replace("/(tabs)");
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Yummy Yum</Text>
      <Text style={styles.subtitle}>Lezzeti paylaşmaya başla 🍽️</Text>

      <TouchableOpacity
        style={styles.googleBtn}
        onPress={() => promptAsync()}
      >
        <Text style={styles.googleText}>Google ile Giriş Yap</Text>
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
    alignItems: "center",
    padding: 30,
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 10,
    color: "#FF5C4D",
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 40,
  },
  googleBtn: {
    backgroundColor: "#FF5C4D",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 28,
  },
  googleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
