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

export const useAuthGuard = () => {
  const { user } = useAuth();
  return !!user; // true → logged in, false → logged out
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // 🔥 Firebase Listener → backend profili yükleme
  // -------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const token = await firebaseUser.getIdToken();

      // 🔥 Backend'den profil çek (TOKEN ZORUNLU!)
      let res = await fetch(`${API}/profile/${firebaseUser.uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let profile = await res.json();

      // Eğer bulunamadıysa profil oluştur
      if (profile?.error === "bulunamadı") {
        const createRes = await fetch(`${API}/profile`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  // -------------------------------------------------------
  // 🔥 LOGOUT
  // -------------------------------------------------------
  const logout = async () => {
    await AsyncStorage.removeItem("yummy_user");
    await signOut(auth);
    setUser(null);
  };

  // -------------------------------------------------------
  // 🔄 PROFİL YENİLE
  // -------------------------------------------------------
  const refreshProfile = async () => {
    if (!user?.uid || !user?.token) return;

    try {
      const res = await fetch(`${API}/profile/${user.uid}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const profile = await res.json();

      const updatedUser = { ...user, ...profile };
      setUser(updatedUser);
      await AsyncStorage.setItem("yummy_user", JSON.stringify(updatedUser));
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
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
