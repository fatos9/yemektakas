import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterScreen() {
  const { loginWithGoogle } = useAuth();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  const handleRegister = async () => {
    router.push("/verify"); // İstersen SMS doğrulama da ekleriz
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold" }}>Kayıt Ol</Text>

      <TextInput
        placeholder="Ad Soyad"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Telefon"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.btn} onPress={handleRegister}>
        <Text style={styles.btnText}>Devam Et</Text>
      </TouchableOpacity>

      {/* Google Login */}
      <TouchableOpacity style={styles.googleBtn} onPress={loginWithGoogle}>
        <Text style={styles.googleText}>Google ile devam et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  input: {
    marginVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  btn: {
    backgroundColor: "#FF5C4D",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700" },

  googleBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  googleText: { textAlign: "center", fontWeight: "600" },
};
