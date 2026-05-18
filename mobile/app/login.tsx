import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setErro("");
    setCarregando(true);
    const result = await login(email.trim(), password);
    setCarregando(false);
    if (result.erro) {
      setErro(result.erro);
    } else {
      router.replace("/(tabs)/explore");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5C518" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo-bee.png")}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.brandName}>Smart Hive</Text>
          <Text style={styles.brandSub}>P R O J E C T</Text>
        </View>

        <View style={styles.formSection}>
          {erro ? (
            <View style={styles.erroBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#E53935" />
              <Text style={styles.erroText}>{erro}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputPassword]}
              placeholder="••••"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, carregando && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={carregando}
          >
            {carregando
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.btnPrimaryText}>Entrar</Text>
            }
          </TouchableOpacity>

          <Text style={styles.dividerText}>ou</Text>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push("/registro")}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>Registrar-se</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5C518" },
  keyboardView: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
  headerSection: { alignItems: "center", marginBottom: 44 },
  logoContainer: { marginBottom: 16, alignItems: "center", justifyContent: "center" },
  logoImage: { width: 90, height: 90, borderRadius: 20 },
  brandName: { fontSize: 28, fontWeight: "800", color: "#1A1A1A", letterSpacing: 0.5 },
  brandSub: { fontSize: 12, fontWeight: "600", color: "#1A1A1A", letterSpacing: 5, marginTop: 2 },
  formSection: { width: "100%", gap: 14 },
  erroBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
  },
  erroText: { flex: 1, fontSize: 13, color: "#E53935", fontWeight: "500" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
    elevation: 2,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#1A1A1A" },
  inputPassword: { letterSpacing: 2 },
  eyeIcon: { padding: 4 },
  btnPrimary: {
    backgroundColor: "#D4860A",
    borderRadius: 12,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    elevation: 4,
  },
  btnPrimaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  dividerText: { textAlign: "center", color: "#1A1A1A", fontSize: 14, fontWeight: "500" },
  btnSecondary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  btnSecondaryText: { color: "#1A1A1A", fontSize: 16, fontWeight: "600" },
});
