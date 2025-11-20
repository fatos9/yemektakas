import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { auth } from "../firebase/config";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 👉 Google Login provider
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "GOOGLE_WEB_CLIENT_ID",
    webClientId: "GOOGLE_WEB_CLIENT_ID",
  });

  // -----------------------------------------------------------
  // 🔥 1) Google Login’den gelen cevabı yakala
  // -----------------------------------------------------------
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      googleSignIn(authentication.accessToken);
    }
  }, [response]);

  // -----------------------------------------------------------
  // 🔥 2) Google accessToken → Firebase giriş
  // -----------------------------------------------------------
  const googleSignIn = async (accessToken) => {
    try {
      const credential = GoogleAuthProvider.credential(null, accessToken);
      const result = await signInWithCredential(auth, credential);

      console.log("🔥 Google ile giriş yapıldı:", result.user.email);

      // devamı zaten onAuthStateChanged içinde çalışacak
    } catch (err) {
      console.log("Google Sign-In Error:", err);
    }
  };

  // -----------------------------------------------------------
  // 🔥 3) Firebase login state listener
  // -----------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const firebaseToken = await firebaseUser.getIdToken();

        console.log("🔥 Firebase Token:", firebaseToken);

        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };

        // storage
        await AsyncStorage.setItem("yummy_user", JSON.stringify(userData));
        await AsyncStorage.setItem("yummy_token", firebaseToken);

        setUser(userData);
        setToken(firebaseToken);
      } else {
        await AsyncStorage.removeItem("yummy_user");
        await AsyncStorage.removeItem("yummy_token");
        setUser(null);
        setToken(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // -----------------------------------------------------------
  // Çıkış
  // -----------------------------------------------------------
  const logout = async () => {
    await AsyncStorage.removeItem("yummy_user");
    await AsyncStorage.removeItem("yummy_token");
    auth.signOut();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithGoogle: () => promptAsync(),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
