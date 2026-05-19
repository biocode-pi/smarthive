import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authConfig } from "@/constants/authConfig";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const { brand, palette, footer, texts } = authConfig;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [manterConectado, setManterConectado] = useState(true);
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

  const topAccessory = (
    <View style={styles.topRow}>
      <Text style={[styles.topRowText, { color: palette.text }]}>{texts.login.noAccountPrefix}</Text>
      <TouchableOpacity onPress={() => router.push("/registro")} activeOpacity={0.7}>
        <Text style={[styles.topRowAction, { color: palette.link }]}>{texts.login.noAccountAction}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthLayout
      brand={brand}
      palette={palette}
      footer={footer}
      topAccessory={topAccessory}
      title={texts.login.title}
      subtitle={texts.login.subtitle}
      bottomAccessory={
        <TouchableOpacity onPress={() => {}} activeOpacity={0.6} style={styles.forgotWrap}>
          <Text style={[styles.forgotText, { color: palette.textMuted }]}>{texts.login.forgotLabel}</Text>
        </TouchableOpacity>
      }
    >
      {erro ? (
        <View style={styles.erroBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#E53935" />
          <Text style={styles.erroText}>{erro}</Text>
        </View>
      ) : null}

      <Text style={[styles.fieldLabel, { color: palette.text }]}>E-mail</Text>
      <View style={[styles.inputWrapper, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
        <Ionicons name="mail-outline" size={18} color={palette.textMuted} />
        <TextInput
          style={[styles.input, { color: palette.text }]}
          placeholder={texts.placeholders.email}
          placeholderTextColor={palette.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </View>

      <Text style={[styles.fieldLabel, { color: palette.text, marginTop: 14 }]}>Senha</Text>
      <View style={[styles.inputWrapper, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
        <Ionicons name="lock-closed-outline" size={18} color={palette.textMuted} />
        <TextInput
          style={[styles.input, { color: palette.text }]}
          placeholder={texts.placeholders.senha}
          placeholderTextColor={palette.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="current-password"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={18}
            color={palette.textMuted}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setManterConectado((v) => !v)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: palette.border },
            manterConectado && { backgroundColor: palette.primary, borderColor: palette.primary },
          ]}
        >
          {manterConectado ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
        </View>
        <Text style={[styles.checkboxLabel, { color: palette.textMuted }]}>{texts.login.rememberLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnPrimary, { backgroundColor: palette.primary }, carregando && { opacity: 0.7 }]}
        onPress={handleLogin}
        activeOpacity={0.85}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color={palette.primaryText} />
        ) : (
          <Text style={[styles.btnPrimaryText, { color: palette.primaryText }]}>{texts.login.submit}</Text>
        )}
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  topRowText: { fontSize: 12, opacity: 0.85 },
  topRowAction: { fontSize: 12, fontWeight: "700" },
  erroBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  erroText: { flex: 1, fontSize: 13, color: "#E53935", fontWeight: "500" },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 50,
  },
  input: { flex: 1, fontSize: 14 },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: { fontSize: 13, flex: 1 },
  btnPrimary: {
    marginTop: 18,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  forgotWrap: { alignItems: "center" },
  forgotText: { fontSize: 13, textDecorationLine: "underline" },
});
