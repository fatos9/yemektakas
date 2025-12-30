// firebase/config.js

import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD0Hl5os66_FRth1BWQkDUEE57oJ3F25v4",
  authDomain: "yummyum-e6f8f.firebaseapp.com",
  projectId: "yummyum-e6f8f",
  storageBucket: "yummyum-e6f8f.appspot.com",
  messagingSenderId: "888477688304",
  appId: "1:888477688304:web:324b11b2449cd5f93efd35",
};

// ❗ Eğer zaten init edilmişse tekrar init ETME
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// AUTH — tekrar initialize edilmesin diye kontrol
let auth;
if (!app._auth) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  app._auth = auth;
} else {
  auth = app._auth;
}

// DB + STORAGE
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
