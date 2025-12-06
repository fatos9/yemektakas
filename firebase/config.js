import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";

// -----------------------------------------------------------
// 🔥 Firebase Config
// -----------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyD0Hl5os66_FRth1BWQkDUEE57oJ3F25v4",
  authDomain: "yummyum-e6f8f.firebaseapp.com",
  projectId: "yummyum-e6f8f",
  storageBucket: "yummyum-e6f8f.firebasestorage.app",
  messagingSenderId: "888477688304",
  appId: "1:888477688304:web:324b11b2449cd5f93efd35",
};

// -----------------------------------------------------------
// 🔥 App Başlat
// -----------------------------------------------------------
const app = initializeApp(firebaseConfig);

// -----------------------------------------------------------
// 🔐 Auth Kurulumu (AsyncStorage ile)
// -----------------------------------------------------------
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// -----------------------------------------------------------
// 📦 Storage (Firebase Image Upload İçin)
// -----------------------------------------------------------
export const storage = getStorage(app);

// -----------------------------------------------------------
// Rapor
// -----------------------------------------------------------
console.log("🔥 Firebase bağlandı:", app.options.projectId);
