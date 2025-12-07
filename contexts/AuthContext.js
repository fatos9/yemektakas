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

  /* ------------------------------------------
     1) APP AÇILDIĞINDA: LOCAL USER YÜKLE
  ------------------------------------------- */
  useEffect(() => {
    const loadLocalUser = async () => {
      try {
        const saved = await AsyncStorage.getItem("yummy_user");
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch (err) {
        console.log("LOCAL USER LOAD ERROR:", err);
      }
      setLoading(false);
    };

    loadLocalUser();
  }, []);

  /* ------------------------------------------
     2) FIREBASE STATE CHANGE GERÇEK ZAMANLI TAKİP
  ------------------------------------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase state:", firebaseUser?.uid || "null");

      // Kullanıcı tamamen çıkış yaptıysa
      if (!firebaseUser) {
        setUser(null);
        await AsyncStorage.removeItem("yummy_user");
        return;
      }

      // Giriş yaptıysa → backend profilini getir
      const token = await firebaseUser.getIdToken();

      try {
        const res = await fetch(`${API}/profile/${firebaseUser.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let profile = await res.json();

        // Backend'de yoksa profil oluştur
        if (profile?.error === "bulunamadı") {
          const createRes = await fetch(`${API}/profile`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          profile = await createRes.json();
        }

        const finalUser = {
          ...profile,
          uid: firebaseUser.uid,
          token,
        };

        setUser(finalUser);
        await AsyncStorage.setItem("yummy_user", JSON.stringify(finalUser));
      } catch (err) {
        console.log("PROFILE LOAD ERROR:", err);
      }
    });

    return unsub;
  }, []);

  /* ------------------------------------------
     LOGIN
  ------------------------------------------- */
  const loginWithEmail = async (email, password) => {
    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
    const token = await fbUser.getIdToken();

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ firebase_uid: fbUser.uid }),
    });

    const data = await res.json();

    const finalUser = {
      ...data.user,
      uid: fbUser.uid,
      token,
    };

    setUser(finalUser);
    await AsyncStorage.setItem("yummy_user", JSON.stringify(finalUser));

    return finalUser;
  };

  /* ------------------------------------------
     REGISTER
  ------------------------------------------- */
  const registerWithEmail = async (email, password, username) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
    const token = await fbUser.getIdToken();

    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firebase_uid: fbUser.uid,
        email,
        username,
      }),
    });

    const data = await res.json();

    const finalUser = {
      ...data.user,
      uid: fbUser.uid,
      token,
    };

    setUser(finalUser);
    await AsyncStorage.setItem("yummy_user", JSON.stringify(finalUser));

    return finalUser;
  };

  /* ------------------------------------------
     LOGOUT
  ------------------------------------------- */
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    await AsyncStorage.removeItem("yummy_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
