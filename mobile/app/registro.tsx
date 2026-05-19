import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authConfig } from "@/constants/authConfig";
import { useAuth } from "@/context/AuthContext";

export default function RegistroScreen() {
  const { registrar } = useAuth();
  const { brand, palette, footer, texts } = authConfig;
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [receberNotificacoes, setReceberNotificacoes] = useState(true);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleRegistrar() {
    if (!nome || !email || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos obrigatorios.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas nao coincidem.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setErro("");
    setCarregando(true);
    const result = await registrar(email.trim(), senha, nome.trim());
    setCarregando(false);

    if (result.erro) {
      setErro(result.erro);
    } else {
      Alert.alert(
        "Conta criada!",
        "Verifique seu e-mail para confirmar o cadastro e depois faca login.",
        [{ text: "OK", onPress: () => router.replace("/login") }],
      );
    }
  }

  const topAccessory = (
    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
      <Ionicons name="arrow-back" size={16} color={palette.text} />
      <Text style={[styles.backText, { color: palette.text }]}>{texts.registro.backAction}</Text>
    </TouchableOpacity>
  );

  return (
    <AuthLayout
      brand={brand}
      palette={palette}
      footer={footer}
      topAccessory={topAccessory}
      title={texts.registro.title}
      subtitle={texts.registro.subtitle}
    >
      {erro ? (
        <View style={styles.erroBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#E53935" />
          <Text style={styles.erroText}>{erro}</Text>
        </View>
      ) : null}

      <Field
        label="Nome"
        icon="person-outline"
        placeholder={texts.placeholders.nome}
        value={nome}
        onChangeText={setNome}
        autoCapitalize="words"
        palette={palette}
      />
      <Field
        label="E-mail"
        icon="mail-outline"
        placeholder={texts.placeholders.email}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        palette={palette}
        marginTop={12}
      />
      <Field
        label="Senha"
        icon="lock-closed-outline"
        placeholder={texts.placeholders.senha}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        palette={palette}
        marginTop={12}
      />
      <Field
        label="Confirmar senha"
        icon="lock-closed-outline"
        placeholder={texts.placeholders.confirmarSenha}
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        secureTextEntry
        palette={palette}
        marginTop={12}
      />
      <Field
        label="Telefone"
        icon="call-outline"
        placeholder={texts.placeholders.telefone}
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
        palette={palette}
        marginTop={12}
      />

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setReceberNotificacoes((v) => !v)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: palette.border },
            receberNotificacoes && { backgroundColor: palette.primary, borderColor: palette.primary },
          ]}
        >
          {receberNotificacoes ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
        </View>
        <Text style={[styles.checkboxLabel, { color: palette.textMuted }]}>{texts.registro.receberNotificacoes}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnPrimary, { backgroundColor: palette.primary }, carregando && { opacity: 0.7 }]}
        onPress={handleRegistrar}
        activeOpacity={0.85}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color={palette.primaryText} />
        ) : (
          <Text style={[styles.btnPrimaryText, { color: palette.primaryText }]}>{texts.registro.submit}</Text>
        )}
      </TouchableOpacity>
    </AuthLayout>
  );
}

interface FieldProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  palette: typeof authConfig.palette;
  marginTop?: number;
}

function Field({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "sentences",
  palette,
  marginTop = 0,
}: FieldProps) {
  return (
    <View style={{ marginTop }}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
        <Ionicons name={icon} size={18} color={palette.textMuted} />
        <TextInput
          style={[styles.input, { color: palette.text }]}
          placeholder={placeholder}
          placeholderTextColor={palette.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 13, fontWeight: "600" },
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
    marginTop: 18,
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
});
