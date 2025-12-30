import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/config";

const API = "https://yummy-backend-fxib.onrender.com";
const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // 🔥 Firebase Listener → user yükleme
  // -------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const token = await firebaseUser.getIdToken();

      const res = await fetch(`${API}/profile/${firebaseUser.uid}`);
      const profile = await res.json();

      const finalUser = {
        ...profile,
        uid: firebaseUser.uid,      // 🚀 KRİTİK SATIR (ekledik)
        token,
      };
      console.log('______________FINAL USER:',finalUser);
      await AsyncStorage.setItem("yummy_user", JSON.stringify(finalUser));
      setUser(finalUser);

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // -------------------------------------------------------
  // 🔥 REGISTER
  // -------------------------------------------------------
  const registerWithEmail = async (email, password, username) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const token = await fbUser.getIdToken();

    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: fbUser.uid,
        email,
        username,
      }),
    });

    const data = await res.json();

    const finalUser = {
      ...data.user,
      uid: fbUser.uid,        // 🚀 Buraya da ekliyoruz
      token,
    };

    setUser(finalUser);
    await AsyncStorage.setItem("yummy_user", JSON.stringify(finalUser));

    return finalUser;
  };

  // -------------------------------------------------------
  // 🔥 LOGIN
  // -------------------------------------------------------
  const loginWithEmail = async (email, password) => {
    const { user: fbUser } = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const token = await fbUser.getIdToken();

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebase_uid: fbUser.uid }),
    });

    const data = await res.json();

    const finalUser = {
      ...data.user,
      uid: fbUser.uid,        // 🚀 EKLENDİ
      token,
    };

    setUser(finalUser);
    await AsyncStorage.setItem("yummy_user", JSON.stringify(finalUser));

    return finalUser;
  };

  // -------------------------------------------------------
  // 🔥 LOGOUT
  // -------------------------------------------------------
  const logout = async () => {
    await AsyncStorage.removeItem("yummy_user");
    await signOut(auth);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!user?.uid) return;

    try {
      const res = await fetch(`${API}/profile/${user.uid}`);
      const profile = await res.json();

      const updatedUser = {
        ...user,
        ...profile,
      };

      setUser(updatedUser);
      await AsyncStorage.setItem("yummy_user", JSON.stringify(updatedUser));

      console.log("🔄 PROFİL GÜNCELLENDİ:", updatedUser);
    } catch (err) {
      console.log("PROFILE REFRESH ERROR:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
