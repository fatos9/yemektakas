import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
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
  storageBucket: "yummyum-e6f8f.appspot.com",
  messagingSenderId: "888477688304",
  appId: "1:888477688304:web:324b11b2449cd5f93efd35",
};

// -----------------------------------------------------------
// 🔥 App başlat — idempotent (bir kere çalışır)
// -----------------------------------------------------------
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// -----------------------------------------------------------
// 🔐 AUTH — tekrar initialize edilmesin diye koruma bloğu
// -----------------------------------------------------------
let auth;
try {
  auth = getAuth(app); // Eğer Auth zaten varsa bunu kullan
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

// -----------------------------------------------------------
// 📦 STORAGE
// -----------------------------------------------------------
const storage = getStorage(app);

export { app, auth, storage };
