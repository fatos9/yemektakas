import { getAuth } from "firebase/auth";

export async function getFreshToken() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Kullanıcı yok");
  }

  // 🔥 TOKEN'I ZORLA YENİLER
  return await user.getIdToken(true);
}
