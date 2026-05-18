import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
    Alert,
      ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const GRAVACOES_EXEMPLO = [
  { id: "1", data: "2024-02-13", hora: "14:34", alerta: true },
];

export default function GravacoesScreen() {
  const params = useLocalSearchParams();
  const colmeiaNome = (params.nome as string) ?? "Colmeia";
  const [gravacoes, setGravacoes] = useState(GRAVACOES_EXEMPLO);

  function handleDeletar(id: string) {
    Alert.alert(
      "Excluir Gravação",
      "Deseja excluir esta gravação? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () =>
            setGravacoes((prev) => prev.filter((g) => g.id !== id)),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDD96A" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#1A1A1A" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>{colmeiaNome}</Text>
          <View style={styles.statusDot} />
        </View>

        {gravacoes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="videocam-outline"
              size={56}
              color="rgba(0,0,0,0.2)"
            />
            <Text style={styles.emptyText}>Nenhuma gravação</Text>
          </View>
        ) : (
          gravacoes.map((gravacao) => (
            <View key={gravacao.id} style={styles.card}>
              <View style={styles.thumbnail}>
                <TouchableOpacity style={styles.playBtn} activeOpacity={0.8}>
                  <Ionicons
                    name="play"
                    size={32}
                    color="rgba(255,255,255,0.9)"
                  />
                </TouchableOpacity>
                {gravacao.alerta && (
                  <View style={styles.alertaBadge}>
                    <Text style={styles.alertaBadgeText}>!</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeletar(gravacao.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="calendar-outline" size={14} color="#555" />
                  <Text style={styles.footerText}>{gravacao.data}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="time-outline" size={14} color="#555" />
                  <Text style={styles.footerText}>{gravacao.hora}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDD96A" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  backText: { fontSize: 15, color: "#1A1A1A", fontWeight: "500" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#1A1A1A" },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 16, color: "rgba(0,0,0,0.3)", fontWeight: "600" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 3,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: "#B0BEC5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertaBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
  },
  alertaBadgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  deleteBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(229,57,53,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 13, color: "#555", fontWeight: "500" },
});
