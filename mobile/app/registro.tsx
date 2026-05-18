import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function RegistroScreen() {
  const { registrar } = useAuth();
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
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
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
        "Verifique seu e-mail para confirmar o cadastro e depois faça login.",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5C518" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#1A1A1A" />
            <Text style={styles.backText}>Entrar</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Registro</Text>
          <Text style={styles.pageSubtitle}>Insira suas informações</Text>

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
                placeholder="Nome completo"
                placeholderTextColor="#AAAAAA"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
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
                style={styles.input}
                placeholder="Senha (mín. 6 caracteres)"
                placeholderTextColor="#AAAAAA"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                placeholderTextColor="#AAAAAA"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Telefone (opcional)"
                placeholderTextColor="#AAAAAA"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setReceberNotificacoes(!receberNotificacoes)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, receberNotificacoes && styles.checkboxChecked]}>
              {receberNotificacoes && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Desejo receber notificações em meu e-mail</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnPrimary, carregando && { opacity: 0.7 }]}
            onPress={handleRegistrar}
            activeOpacity={0.85}
            disabled={carregando}
          >
            {carregando
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.btnPrimaryText}>Registrar-se</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5C518" },
  scrollContent: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  backText: { fontSize: 15, color: "#1A1A1A", fontWeight: "500" },
  pageTitle: { fontSize: 30, fontWeight: "800", color: "#1A1A1A", marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: "#333333", marginBottom: 20 },
  formSection: { gap: 12, marginBottom: 20 },
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
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#D4860A", borderColor: "#D4860A" },
  checkboxLabel: { flex: 1, fontSize: 13, color: "#1A1A1A", fontWeight: "500" },
  btnPrimary: {
    backgroundColor: "#D4860A",
    borderRadius: 12,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  btnPrimaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});
