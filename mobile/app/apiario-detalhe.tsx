import { useColmeias } from "@/context/ColmeiaContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.52;

// ─── Card de Resultados ───────────────────────────────────────────────────────
function CardResultados({ colmeias }: { colmeias: any[] }) {
  const comTemp = colmeias.filter((c) => c.temperatura && c.temperatura !== "--");
  const comUmid = colmeias.filter((c) => c.umidade && c.umidade !== "--");
  const comPeso = colmeias.filter((c) => c.peso && c.peso !== "--");

  const media = (arr: any[], campo: string) => {
    if (!arr.length) return null;
    const vals = arr.map((c) => parseFloat(c[campo])).filter((v) => !isNaN(v));
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const tempMedia = media(comTemp, "temperatura");
  const umidMedia = media(comUmid, "umidade");
  const pesoMedia = media(comPeso, "peso");

  const stats = [
    { icon: "thermometer-outline", label: "Temp. média", valor: tempMedia ? `${tempMedia}°C` : "--", cor: "#E53935" },
    { icon: "water-outline", label: "Umidade média", valor: umidMedia ? `${umidMedia}%` : "--", cor: "#5BA4CF" },
    { icon: "scale-outline", label: "Peso médio", valor: pesoMedia ? `${pesoMedia} kg` : "--", cor: "#C8920C" },
    { icon: "layers-outline", label: "Colmeias", valor: String(colmeias.length), cor: "#4CAF50" },
  ];

  const alertas = colmeias.filter((c) => c.alerta).length;

  return (
    <View>
      <View style={resStyles.grid}>
        {stats.map((s, i) => (
          <View key={i} style={resStyles.statBox}>
            <View style={[resStyles.statIcon, { backgroundColor: s.cor + "18" }]}>
              <Ionicons name={s.icon as any} size={18} color={s.cor} />
            </View>
            <Text style={resStyles.statValor}>{s.valor}</Text>
            <Text style={resStyles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      {alertas > 0 && (
        <View style={resStyles.alertaRow}>
          <Ionicons name="alert-circle" size={14} color="#E53935" />
          <Text style={resStyles.alertaText}>
            {alertas} {alertas === 1 ? "colmeia com alerta ativo" : "colmeias com alerta ativo"}
          </Text>
        </View>
      )}
      {colmeias.length === 0 && (
        <Text style={resStyles.semDados}>Adicione colmeias para ver os dados aqui</Text>
      )}
    </View>
  );
}

const resStyles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValor: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },
  statLabel: { fontSize: 11, color: "#888", fontWeight: "500", textAlign: "center" },
  alertaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, backgroundColor: "#FEF2F2", padding: 10, borderRadius: 10 },
  alertaText: { fontSize: 12, color: "#E53935", fontWeight: "600" },
  semDados: { fontSize: 13, color: "#AAAAAA", textAlign: "center", paddingVertical: 12 },
});

// ─── Card de Tempo ────────────────────────────────────────────────────────────
type Clima = {
  tempMin: string;
  tempMax: string;
  tempAtual: string;
  chuva: string;
  descricao: string;
  umidade: string;
  cidade: string;
};

function CardTempo({ cidade }: { cidade: string }) {
  const [clima, setClima] = useState<Clima | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!cidade || cidade === "Cidade não identificada") {
      setCarregando(false);
      setErro(true);
      return;
    }
    buscarClima();
  }, [cidade]);

  async function buscarClima() {
    setCarregando(true);
    setErro(false);
    try {
      const cidadeEncoded = encodeURIComponent(cidade);
      const res = await fetch(`https://wttr.in/${cidadeEncoded}?format=j1`);
      const json = await res.json();
      const atual = json.current_condition[0];
      const hoje = json.weather[0];
      setClima({
        tempAtual: atual.temp_C,
        tempMin: hoje.mintempC,
        tempMax: hoje.maxtempC,
        chuva: hoje.hourly[4]?.precipMM ?? "0",
        umidade: atual.humidity,
        descricao: atual.lang_pt?.[0]?.value ?? atual.weatherDesc[0]?.value ?? "",
        cidade: json.nearest_area[0]?.areaName[0]?.value ?? cidade,
      });
    } catch {
      setErro(true);
    }
    setCarregando(false);
  }

  if (carregando) {
    return (
      <View style={tempoStyles.center}>
        <ActivityIndicator size="small" color="#C8920C" />
        <Text style={tempoStyles.loadText}>Buscando clima...</Text>
      </View>
    );
  }

  if (erro || !clima) {
    return (
      <View style={tempoStyles.center}>
        <Ionicons name="cloud-offline-outline" size={28} color="#CCCCCC" />
        <Text style={tempoStyles.erroText}>Cidade não encontrada</Text>
        <Text style={tempoStyles.erroSub}>Verifique o nome da cidade no apiário</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={tempoStyles.topRow}>
        <View>
          <Text style={tempoStyles.cidade}>{clima.cidade}</Text>
          <Text style={tempoStyles.descricao}>{clima.descricao}</Text>
        </View>
        <Text style={tempoStyles.tempAtual}>{clima.tempAtual}°</Text>
      </View>

      <View style={tempoStyles.divider} />

      <View style={tempoStyles.row}>
        <Text style={tempoStyles.label}>Temperatura</Text>
        <View style={tempoStyles.values}>
          <Ionicons name="arrow-down" size={13} color="#5BA4CF" />
          <Text style={tempoStyles.valueBlue}> {clima.tempMin}°</Text>
          <Ionicons name="arrow-up" size={13} color="#E53935" style={{ marginLeft: 6 }} />
          <Text style={tempoStyles.valueRed}> {clima.tempMax}°</Text>
        </View>
      </View>

      <View style={tempoStyles.row}>
        <Text style={tempoStyles.label}>Umidade</Text>
        <View style={tempoStyles.values}>
          <Ionicons name="water-outline" size={13} color="#5BA4CF" />
          <Text style={tempoStyles.valueBlue}> {clima.umidade}%</Text>
        </View>
      </View>

      <View style={tempoStyles.row}>
        <Text style={tempoStyles.label}>Chuva</Text>
        <View style={tempoStyles.values}>
          <Ionicons name="rainy-outline" size={13} color="#5BA4CF" />
          <Text style={tempoStyles.valueGray}> {clima.chuva} mm</Text>
        </View>
      </View>
    </View>
  );
}

const tempoStyles = StyleSheet.create({
  center: { alignItems: "center", paddingVertical: 16, gap: 6 },
  loadText: { fontSize: 12, color: "#AAAAAA" },
  erroText: { fontSize: 14, fontWeight: "600", color: "#AAAAAA" },
  erroSub: { fontSize: 11, color: "#CCCCCC", textAlign: "center" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cidade: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  descricao: { fontSize: 12, color: "#888", marginTop: 2 },
  tempAtual: { fontSize: 36, fontWeight: "800", color: "#1A1A1A" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  label: { fontSize: 14, color: "#333", fontWeight: "500" },
  values: { flexDirection: "row", alignItems: "center" },
  valueBlue: { fontSize: 13, color: "#5BA4CF", fontWeight: "600" },
  valueRed: { fontSize: 13, color: "#E53935", fontWeight: "600" },
  valueGray: { fontSize: 13, color: "#666" },
});

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function ApiarioDetalheScreen() {
  const params = useLocalSearchParams();
  const apiarioId = (params.id as string) ?? "";
  const nome = (params.nome as string) ?? "Apiário";
  const cidade = (params.cidade as string) ?? "";

  const { colmeiasPorApiario, deletarColmeia } = useColmeias();
  const colmeias = colmeiasPorApiario(apiarioId);

  function handleDeletar(id: string, nomeColmeia: string) {
    Alert.alert(
      "Excluir Colmeia",
      `Deseja excluir "${nomeColmeia}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deletarColmeia(id) },
      ],
    );
  }

  const renderColmeia = ({ item }: { item: ReturnType<typeof colmeiasPorApiario>[0] }) => (
    <TouchableOpacity
      style={styles.colmeiaCard}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/colmeia-detalhe", params: { id: item.id } })}
    >
      <View style={styles.hexWatermark}>
        <Ionicons name="grid-outline" size={60} color="rgba(255,255,255,0.15)" />
      </View>
      <View style={styles.colmeiaTopRow}>
        <Text style={styles.colmeiaNome} numberOfLines={1}>{item.nome}</Text>
        <View style={styles.colmeiaActions}>
          <TouchableOpacity>
            <Ionicons name={item.alerta ? "notifications" : "notifications-outline"} size={20} color={item.alerta ? "#FF5252" : "rgba(255,255,255,0.8)"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeletar(item.id, item.nome)}>
            <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: "/editar-colmeia", params: { id: item.id } })}>
            <Ionicons name="pencil-outline" size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.colmeiaStats}>
        <View style={styles.statRow}>
          <Ionicons name="thermometer-outline" size={14} color="#FFFFFF" />
          <Text style={styles.statText}>{item.temperatura}</Text>
        </View>
        <View style={styles.statRow}>
          <Ionicons name="water-outline" size={14} color="#FFFFFF" />
          <Text style={styles.statText}>{item.umidade}</Text>
        </View>
        <View style={styles.statRow}>
          <Ionicons name="scale-outline" size={14} color="#FFFFFF" />
          <Text style={styles.statText}>{item.peso}</Text>
        </View>
        {item.especie ? (
          <View style={styles.statRow}>
            <Ionicons name="bug-outline" size={14} color="#FFFFFF" />
            <Text style={styles.statText}>{item.especie}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.colmeiaBottomRow}>
        <Text style={styles.dotsText}>•••</Text>
      </View>
    </TouchableOpacity>
  );

  const AddCard = () => (
    <TouchableOpacity
      style={styles.addColmeiaCard}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: "/adicionar-colmeia", params: { apiarioId } })}
    >
      <Ionicons name="add" size={36} color="#1A1A1A" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5C518" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerBrand}>
          <Image source={require("@/assets/images/logo-bee.png")} style={styles.logoSmall} />
          <Text style={styles.headerTitle}>Smart Hive</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <FlatList
          data={colmeias}
          keyExtractor={(item) => item.id}
          renderItem={renderColmeia}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colmeiasRow}
          style={styles.colmeiasList}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          ListEmptyComponent={<AddCard />}
          ListFooterComponent={
            colmeias.length > 0 ? (
              <View style={{ marginLeft: 12 }}><AddCard /></View>
            ) : null
          }
        />

        {/* Card Resultados */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resultados</Text>
            <Text style={styles.sectionSub}>{colmeias.length} colmeia{colmeias.length !== 1 ? "s" : ""}</Text>
          </View>
          <CardResultados colmeias={colmeias} />
        </View>

        {/* Card Tempo */}
        <View style={[styles.sectionCard, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tempo</Text>
            <Ionicons name="partly-sunny-outline" size={18} color="#C8920C" />
          </View>
          <CardTempo cidade={cidade} />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: "/adicionar-colmeia", params: { apiarioId } })}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5C518" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 2 },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoSmall: { width: 32, height: 32, borderRadius: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A1A" },
  colmeiasList: { marginBottom: 16 },
  colmeiasRow: { paddingLeft: 20, paddingRight: 20 },
  colmeiaCard: { width: CARD_WIDTH, backgroundColor: "#C8920C", borderRadius: 16, padding: 14, overflow: "hidden", position: "relative", minHeight: 180, justifyContent: "space-between" },
  hexWatermark: { position: "absolute", bottom: 10, right: 10, opacity: 0.4 },
  colmeiaTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  colmeiaNome: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", flex: 1, marginRight: 8 },
  colmeiaActions: { flexDirection: "column", alignItems: "center", gap: 8 },
  colmeiaStats: { gap: 5, flex: 1 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 13, color: "#FFFFFF", fontWeight: "500" },
  colmeiaBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  dotsText: { color: "rgba(255,255,255,0.7)", fontSize: 16, letterSpacing: 2 },
  addColmeiaCard: { width: CARD_WIDTH, minHeight: 180, backgroundColor: "#D4A017", borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sectionCard: { backgroundColor: "#FFFFFF", borderRadius: 16, marginHorizontal: 16, marginBottom: 14, padding: 16, elevation: 2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  sectionSub: { fontSize: 12, color: "#AAAAAA", fontWeight: "500" },
  fab: { position: "absolute", bottom: 20, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: "#C8920C", alignItems: "center", justifyContent: "center", elevation: 6 },
});
