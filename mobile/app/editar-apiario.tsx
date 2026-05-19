import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApiarios } from '@/context/ApiarioContext';
import MapPicker from '@/components/MapPicker';

export default function EditarApiarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiarios, editarApiario } = useApiarios();
  const apiario = apiarios.find((a) => a.id === id);

  const [nome, setNome] = useState(apiario?.nome ?? '');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState(apiario?.cidade ?? '');
  const [estado, setEstado] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mapVisivel, setMapVisivel] = useState(false);

  function handleLocalizacaoSelecionada(dados: {
    latitude: string; longitude: string; endereco: string; cidade: string;
  }) {
    const partes = dados.endereco.replace('Rua: ', '').split(', ');
    if (partes[0]) setRua(partes[0]);
    if (partes[1]) setNumero(partes[1].replace('Nº', ''));
    if (partes[2]) setBairro(partes[2]);
    setCidade(dados.cidade);
    setMapVisivel(false);
  }

  async function handleConfirmar() {
    if (!nome.trim()) { Alert.alert('Atenção', 'Insira um nome para o Apiário.'); return; }
    if (!cidade.trim()) { Alert.alert('Atenção', 'Insira a cidade do Apiário.'); return; }

    setSalvando(true);
    try {
      const endereco = [rua && `Rua: ${rua}`, numero && `Nº${numero}`, bairro]
        .filter(Boolean).join(', ') || apiario?.endereco || 'Endereço não informado';

      await editarApiario(id!, {
        nome: nome.trim().toUpperCase(),
        cidade: cidade.trim(),
        endereco,
      });
      router.replace('/(tabs)/explore');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5C518" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#1A1A1A" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Editar Apiário</Text>

          <Text style={styles.sectionLabel}>Nome do Apiário</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Ionicons name="grid" size={18} color="#C8920C" /></View>
            <TextInput style={styles.input} placeholder="Nome" placeholderTextColor="#AAAAAA" value={nome} onChangeText={setNome} autoCapitalize="characters" />
          </View>

          <Text style={styles.sectionLabel}>Localização do Apiário</Text>

          <TouchableOpacity style={styles.mapBtn} onPress={() => setMapVisivel(true)} activeOpacity={0.8}>
            <View style={styles.mapBtnIcon}><Ionicons name="map" size={20} color="#C8920C" /></View>
            <Text style={styles.mapBtnText}>Selecionar no mapa</Text>
            <Ionicons name="chevron-forward" size={18} color="#C8920C" />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Ionicons name="navigate" size={18} color="#C8920C" /></View>
            <TextInput style={styles.input} placeholder="Rua" placeholderTextColor="#AAAAAA" value={rua} onChangeText={setRua} />
          </View>
          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Text style={styles.numeroLabel}>Nº</Text></View>
            <TextInput style={styles.input} placeholder="Número" placeholderTextColor="#AAAAAA" value={numero} onChangeText={setNumero} keyboardType="numeric" />
          </View>
          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Ionicons name="home" size={18} color="#C8920C" /></View>
            <TextInput style={styles.input} placeholder="Bairro" placeholderTextColor="#AAAAAA" value={bairro} onChangeText={setBairro} />
          </View>
          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Ionicons name="business" size={18} color="#C8920C" /></View>
            <TextInput style={styles.input} placeholder="Cidade" placeholderTextColor="#AAAAAA" value={cidade} onChangeText={setCidade} />
          </View>
          <View style={styles.inputWrapper}>
            <View style={styles.iconBox}><Ionicons name="location" size={18} color="#C8920C" /></View>
            <TextInput style={styles.input} placeholder="Estado" placeholderTextColor="#AAAAAA" value={estado} onChangeText={setEstado} autoCapitalize="characters" maxLength={2} />
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
  container: { flex: 1, backgroundColor: '#F5C518' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', marginBottom: 24 },
  sectionLabel: { fontSize: 13, color: '#333', fontWeight: '500', marginBottom: 8, marginTop: 4 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 10, paddingHorizontal: 12, height: 52, elevation: 1, gap: 10 },
  mapBtnIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFF3D0', alignItems: 'center', justifyContent: 'center' },
  mapBtnText: { flex: 1, fontSize: 15, color: '#C8920C', fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 10, paddingHorizontal: 12, height: 52, elevation: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFF3D0', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  numeroLabel: { fontSize: 13, fontWeight: '800', color: '#C8920C' },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  btnConfirmar: { backgroundColor: '#C8920C', borderRadius: 12, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 4 },
  btnConfirmarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
