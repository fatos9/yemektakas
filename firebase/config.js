import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0Hl5os66_FRth1BWQkDUEE57oJ3F25v4",
  authDomain: "yummyum-e6f8f.firebaseapp.com",
  projectId: "yummyum-e6f8f",
  storageBucket: "yummyum-e6f8f.appspot.com",
  messagingSenderId: "888477688304",
  appId: "1:888477688304:web:324b11b2449cd5f93efd35",
  measurementId: "G-XXXXXXX", // varsa ekle, yoksa sil
};

// 🔥 App başlat
const app = initializeApp(firebaseConfig);

// 🔐 Auth (AsyncStorage ile)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// 📦 Firestore ve Storage
const db = getFirestore(app,"yummyum");
const storage = getStorage(app);
async function testFirebaseConnection() {
  try {
    console.log("🔄 Firebase bağlantısı test ediliyor...");

    // Proje bilgilerini yazdır
    console.log("🌐 Bağlı proje:", app.options.projectId);
    console.log("🗄️ Firestore veritabanı adı:", db._databaseId.database || "default");

    // Örnek koleksiyon
    const testColRef = collection(db, "meals");
    const snapshot = await getDocs(testColRef);

    if (snapshot.empty) {
      console.log("⚠️ Firestore bağlantısı başarılı ama 'meals' koleksiyonu boş.");
    } else {
      console.log("✅ Firestore bağlantısı başarılı! Veriler:");
      snapshot.forEach((doc) => console.log(doc.id, "=>", doc.data()));
    }

    console.log("🔥 Auth ve Storage da başarıyla yüklendi.");
  } catch (err) {
    console.error("❌ Firebase bağlantı hatası:", err);
  }
}
// test çağrısı (isteğe bağlı)
testFirebaseConnection();

export { auth, db, storage };
