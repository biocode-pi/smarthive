import { useColmeias } from "@/context/ColmeiaContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import MapPicker from "@/components/MapPicker";

export default function EditarColmeiaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colmeias, editarColmeia } = useColmeias();
  const colmeia = colmeias.find((c) => c.id === id);

  const [nome, setNome] = useState(colmeia?.nome ?? "");
  const [especie, setEspecie] = useState(colmeia?.especie ?? "");
  const [longitude, setLongitude] = useState(colmeia?.longitude ?? "");
  const [latitude, setLatitude] = useState(colmeia?.latitude ?? "");
  const [salvando, setSalvando] = useState(false);
  const [mapVisivel, setMapVisivel] = useState(false);

  function handleLocalizacaoSelecionada(dados: {
    latitude: string; longitude: string; endereco: string; cidade: string;
  }) {
    setLatitude(dados.latitude);
    setLongitude(dados.longitude);
    setMapVisivel(false);
  }

  async function handleConfirmar() {
    if (!nome.trim()) { Alert.alert("Atenção", "Insira um nome para a Colmeia."); return; }
    setSalvando(true);
    try {
      await editarColmeia(id!, {
        nome: nome.trim(),
        especie: especie.trim(),
        longitude: longitude.trim(),
        latitude: latitude.trim(),
      });
      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5C518" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#1A1A1A" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Editar Colmeia</Text>

          <Text style={styles.sectionLabel}>Nome da colmeia</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Ionicons name="grid" size={18} color="#C8920C" /></View>
            <TextInput style={styles.input} placeholder="Nome" placeholderTextColor="#AAAAAA" value={nome} onChangeText={setNome} />
          </View>

          <Text style={styles.sectionLabel}>Espécie de abelha</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Ionicons name="bug" size={18} color="#C8920C" /></View>
            <TextInput style={styles.input} placeholder="Espécie" placeholderTextColor="#AAAAAA" value={especie} onChangeText={setEspecie} />
          </View>

          <Text style={styles.sectionLabel}>Localização da Colmeia</Text>

          <TouchableOpacity style={styles.mapBtn} onPress={() => setMapVisivel(true)} activeOpacity={0.8}>
            <View style={styles.mapBtnIcon}><Ionicons name="map" size={20} color="#C8920C" /></View>
            <Text style={styles.mapBtnText}>
              {latitude && longitude ? `${latitude}, ${longitude}` : 'Selecionar no mapa'}
            </Text>
            <Ionicons name={latitude ? 'checkmark-circle' : 'chevron-forward'} size={18} color={latitude ? '#4CAF50' : '#C8920C'} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Ionicons name="globe-outline" size={18} color="#C8920C" /></View>
            <TextInput style={styles.input} placeholder="Longitude" placeholderTextColor="#AAAAAA" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Ionicons name="locate-outline" size={18} color="#C8920C" /></View>
            <TextInput style={styles.input} placeholder="Latitude" placeholderTextColor="#AAAAAA" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" />
          </View>

          <TouchableOpacity style={[styles.btnConfirmar, salvando && { opacity: 0.7 }]} onPress={handleConfirmar} activeOpacity={0.85} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnConfirmarText}>CONFIRMAR</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <MapPicker visivel={mapVisivel} onFechar={() => setMapVisivel(false)} onConfirmar={handleLocalizacaoSelecionada} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5C518" },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  backText: { fontSize: 15, color: "#1A1A1A", fontWeight: "500" },
  pageTitle: { fontSize: 26, fontWeight: "800", color: "#1A1A1A", marginBottom: 24 },
  sectionLabel: { fontSize: 13, color: "#333", fontWeight: "500", marginBottom: 8, marginTop: 4 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 10, paddingHorizontal: 12, height: 52, elevation: 1, gap: 10 },
  mapBtnIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFF3D0', alignItems: 'center', justifyContent: 'center' },
  mapBtnText: { flex: 1, fontSize: 14, color: '#C8920C', fontWeight: '600' },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 10, paddingHorizontal: 12, height: 52, elevation: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#FFF3D0", alignItems: "center", justifyContent: "center", marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#1A1A1A" },
  btnConfirmar: { backgroundColor: "#C8920C", borderRadius: 12, height: 54, alignItems: "center", justifyContent: "center", elevation: 4 },
  btnConfirmarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1 },
});
