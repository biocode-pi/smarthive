import { useApiarios } from "@/context/ApiarioContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Ordenacao = "nome" | "recente";
type Filtro = { ordenacao: Ordenacao; apenasAlertas: boolean };

export default function ApiáriosScreen() {
  const { apiarios, carregando, deletarApiario } = useApiarios();

  const [buscaVisivel, setBuscaVisivel] = useState(false);
  const [textoBusca, setTextoBusca] = useState("");
  const [filtroVisivel, setFiltroVisivel] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>({ ordenacao: "recente", apenasAlertas: false });
  const [filtroTemp, setFiltroTemp] = useState<Filtro>({ ordenacao: "recente", apenasAlertas: false });

  const filtroAtivo = filtro.apenasAlertas || filtro.ordenacao !== "recente";

  const apiariosFiltrados = useMemo(() => {
    let lista = [...apiarios];

    if (textoBusca.trim()) {
      const termo = textoBusca.toLowerCase().trim();
      lista = lista.filter(
        (a) =>
          a.nome.toLowerCase().includes(termo) ||
          a.cidade.toLowerCase().includes(termo) ||
          a.endereco.toLowerCase().includes(termo),
      );
    }

    if (filtro.apenasAlertas) {
      lista = lista.filter((a) => a.alerta);
    }

    if (filtro.ordenacao === "nome") {
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return lista;
  }, [apiarios, textoBusca, filtro]);

  function handleDeletar(id: string, nome: string) {
    Alert.alert(
      "Excluir Apiário",
      `Deseja excluir "${nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deletarApiario(id) },
      ],
    );
  }

  function abrirFiltro() {
    setFiltroTemp({ ...filtro });
    setFiltroVisivel(true);
  }

  function aplicarFiltro() {
    setFiltro({ ...filtroTemp });
    setFiltroVisivel(false);
  }

  function limparFiltro() {
    const padrao = { ordenacao: "recente" as Ordenacao, apenasAlertas: false };
    setFiltroTemp(padrao);
    setFiltro(padrao);
    setFiltroVisivel(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5C518" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("@/assets/images/logo-bee.png")} style={styles.headerLogo} />
          <View>
            <Text style={styles.headerSubtitle}>Bem-vindo</Text>
            <Text style={styles.headerTitle}>Apiários</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, buscaVisivel && styles.headerBtnActive]}
            onPress={() => {
              setBuscaVisivel(!buscaVisivel);
              if (buscaVisivel) setTextoBusca("");
            }}
          >
            <Ionicons name={buscaVisivel ? "close" : "search-outline"} size={20} color={buscaVisivel ? "#C8920C" : "#1A1A1A"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtnBadge, filtroAtivo && styles.headerBtnActive]}
            onPress={abrirFiltro}
          >
            <Ionicons name="funnel-outline" size={20} color={filtroAtivo ? "#C8920C" : "#1A1A1A"} />
            {filtroAtivo && <View style={styles.filtroDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de busca */}
      {buscaVisivel && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#AAAAAA" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome, cidade..."
            placeholderTextColor="#AAAAAA"
            value={textoBusca}
            onChangeText={setTextoBusca}
            autoFocus
            autoCapitalize="none"
          />
          {textoBusca.length > 0 && (
            <TouchableOpacity onPress={() => setTextoBusca("")}>
              <Ionicons name="close-circle" size={18} color="#AAAAAA" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Contador */}
      {!carregando && apiarios.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {apiariosFiltrados.length} {apiariosFiltrados.length === 1 ? "apiário" : "apiários"}
            {textoBusca || filtroAtivo ? " encontrados" : " cadastrados"}
          </Text>
        </View>
      )}

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C8920C" />
        </View>
      ) : apiariosFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name={textoBusca || filtroAtivo ? "search-outline" : "layers-outline"} size={40} color="#C8920C" />
          </View>
          <Text style={styles.emptyText}>
            {textoBusca || filtroAtivo ? "Nenhum resultado encontrado" : "Nenhum apiário cadastrado"}
          </Text>
          <Text style={styles.emptySubText}>
            {textoBusca || filtroAtivo ? "Tente outros termos ou limpe o filtro" : "Toque no + para adicionar o primeiro"}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {apiariosFiltrados.map((apiario) => (
            <TouchableOpacity
              key={apiario.id}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => router.push({ pathname: "/apiario-detalhe", params: { id: apiario.id, nome: apiario.nome, cidade: apiario.cidade } })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="layers" size={22} color="#C8920C" />
                </View>
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{apiario.nome}</Text>
                  {apiario.alerta && (
                    <View style={styles.alertBadge}>
                      <Ionicons name="alert-circle" size={11} color="#E53935" />
                      <Text style={styles.alertBadgeText}>Alerta ativo</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={[styles.bellBtn, apiario.alerta && styles.bellBtnActive]}>
                  <Ionicons name={apiario.alerta ? "notifications" : "notifications-outline"} size={18} color={apiario.alerta ? "#E53935" : "#AAAAAA"} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View style={styles.addressBlock}>
                  <Ionicons name="location-outline" size={13} color="#888" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardCidade}>{apiario.cidade}</Text>
                    <Text style={styles.cardEndereco} numberOfLines={1}>{apiario.endereco}</Text>
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => router.push({ pathname: "/editar-apiario", params: { id: apiario.id } })}
                  >
                    <Ionicons name="pencil-outline" size={14} color="#555" />
                    <Text style={styles.actionBtnEditText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDeletar(apiario.id, apiario.nome)}>
                    <Ionicons name="trash-outline" size={14} color="#E53935" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => router.push("/adicionar-apiario")}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal de Filtro */}
      <Modal visible={filtroVisivel} transparent animationType="slide" onRequestClose={() => setFiltroVisivel(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFiltroVisivel(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Filtrar e Ordenar</Text>

          <Text style={styles.modalSection}>Ordenar por</Text>
          <View style={styles.opcaoRow}>
            {(["recente", "nome"] as Ordenacao[]).map((op) => (
              <TouchableOpacity
                key={op}
                style={[styles.opcaoBtn, filtroTemp.ordenacao === op && styles.opcaoBtnActive]}
                onPress={() => setFiltroTemp((f) => ({ ...f, ordenacao: op }))}
              >
                <Text style={[styles.opcaoBtnText, filtroTemp.ordenacao === op && styles.opcaoBtnTextActive]}>
                  {op === "recente" ? "Mais recente" : "Nome (A-Z)"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalSection}>Mostrar</Text>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setFiltroTemp((f) => ({ ...f, apenasAlertas: !f.apenasAlertas }))}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="notifications-outline" size={18} color="#C8920C" />
              <Text style={styles.toggleText}>Apenas com alertas ativos</Text>
            </View>
            <View style={[styles.toggle, filtroTemp.apenasAlertas && styles.toggleOn]}>
              <View style={[styles.toggleThumb, filtroTemp.apenasAlertas && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.btnLimpar} onPress={limparFiltro}>
              <Text style={styles.btnLimparText}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAplicar} onPress={aplicarFiltro}>
              <Text style={styles.btnAplicarText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5C518" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 42, height: 42, borderRadius: 10 },
  headerSubtitle: { fontSize: 12, color: "rgba(0,0,0,0.45)", fontWeight: "500", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#1A1A1A" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.07)", alignItems: "center", justifyContent: "center" },
  headerBtnBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.07)", alignItems: "center", justifyContent: "center", position: "relative" },
  headerBtnActive: { backgroundColor: "#FFF3D0" },
  filtroDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: "#E53935", borderWidth: 1.5, borderColor: "#F5C518" },

  searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 10, backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A" },

  countBar: { paddingHorizontal: 20, paddingBottom: 10 },
  countText: { fontSize: 12, color: "rgba(0,0,0,0.4)", fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 60 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "rgba(0,0,0,0.4)" },
  emptySubText: { fontSize: 13, color: "rgba(0,0,0,0.28)" },

  listContent: { paddingHorizontal: 16, paddingBottom: 110, gap: 12 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, gap: 10 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF8E7", alignItems: "center", justifyContent: "center" },
  cardTitleBlock: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A1A", letterSpacing: 0.1 },
  alertBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FEF2F2", alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  alertBadgeText: { fontSize: 10, color: "#E53935", fontWeight: "600" },
  bellBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  bellBtnActive: { backgroundColor: "#FEF2F2" },
  divider: { height: 1, backgroundColor: "#F3F3F3", marginHorizontal: 14 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 8 },
  addressBlock: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 5 },
  cardCidade: { fontSize: 12, color: "#555", fontWeight: "600", marginBottom: 1 },
  cardEndereco: { fontSize: 11, color: "#AAAAAA", lineHeight: 15 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionBtnEdit: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F5F5F5", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionBtnEditText: { fontSize: 12, color: "#555", fontWeight: "600" },
  actionBtnDelete: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", bottom: 80, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center", elevation: 6 },

  /* Modal filtro */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A1A", marginBottom: 20 },
  modalSection: { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  opcaoRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  opcaoBtn: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center", justifyContent: "center" },
  opcaoBtnActive: { borderColor: "#C8920C", backgroundColor: "#FFF8E7" },
  opcaoBtnText: { fontSize: 13, fontWeight: "600", color: "#888" },
  opcaoBtnTextActive: { color: "#C8920C" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, marginBottom: 24 },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleText: { fontSize: 14, color: "#1A1A1A", fontWeight: "500" },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: "#E0E0E0", justifyContent: "center", paddingHorizontal: 2 },
  toggleOn: { backgroundColor: "#C8920C" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF", elevation: 2 },
  toggleThumbOn: { alignSelf: "flex-end" },
  modalBtns: { flexDirection: "row", gap: 12 },
  btnLimpar: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center", justifyContent: "center" },
  btnLimparText: { fontSize: 15, fontWeight: "600", color: "#888" },
  btnAplicar: { flex: 2, height: 48, borderRadius: 12, backgroundColor: "#C8920C", alignItems: "center", justifyContent: "center" },
  btnAplicarText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
