import { useColmeias } from "@/context/ColmeiaContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import {
    Dimensions,
      ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

function HistoricoChart() {
  const chartWidth = width - 96;
  const chartHeight = 70;
  const pontos = [
    14.8, 14.5, 14.6, 14.3, 14.1, 14.4, 14.2, 14.5, 14.0, 14.3, 14.6, 14.4,
    14.7, 14.5, 14.8,
  ];
  const labels = ["28. Abr", "4. Mai", "8. Mai", "12. Mai", "16. Mai"];
  const minVal = 13.8,
    maxVal = 15.2,
    range = maxVal - minVal;

  const pts = pontos.map((v, i) => ({
    x: (i / (pontos.length - 1)) * chartWidth,
    y: chartHeight - ((v - minVal) / range) * chartHeight,
  }));

  const segments = pts.slice(0, -1).map((p, i) => {
    const next = pts[i + 1];
    const dx = next.x - p.x,
      dy = next.y - p.y;
    return {
      x: p.x,
      y: p.y,
      length: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    };
  });

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            width: 20,
            height: chartHeight,
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingRight: 4,
          }}
        >
          <Text style={chartStyles.yLabel}>15</Text>
          <Text style={chartStyles.yLabel}>14</Text>
          <Text style={chartStyles.yLabel}>11</Text>
        </View>
        <View
          style={{
            width: chartWidth,
            height: chartHeight,
            position: "relative",
          }}
        >
          {segments.map((seg, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: seg.x,
                top: seg.y - 1,
                width: seg.length,
                height: 2,
                backgroundColor: "#5BA4CF",
                transformOrigin: "left center",
                transform: [{ rotate: `${seg.angle}deg` }],
              }}
            />
          ))}
          {pts
            .filter((_, i) => i % 3 === 0)
            .map((p, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  left: p.x - 3,
                  top: p.y - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#5BA4CF",
                }}
              />
            ))}
        </View>
      </View>
      <View style={[chartStyles.xLabels, { marginLeft: 24 }]}>
        {labels.map((l, i) => (
          <Text key={i} style={chartStyles.xLabel}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  xLabel: { fontSize: 9, color: "#999" },
  yLabel: { fontSize: 9, color: "#999" },
});

export default function ColmeiaDetalheScreen() {
  const params = useLocalSearchParams();
  const { colmeias } = useColmeias();
  const colmeia = colmeias.find((c) => c.id === params.id);

  if (!colmeia) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 20 }}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#1A1A1A" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={{ color: "#555", marginTop: 40 }}>
            Colmeia não encontrada.
          </Text>
        </View>
      </SafeAreaView>
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
          <Text style={styles.pageTitle}>{colmeia.nome}</Text>
          <View style={styles.statusDot} />
        </View>

        <View style={styles.card}>
          {/* Status */}
          <Text style={styles.cardSectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Ionicons name="thermometer-outline" size={18} color="#555" />
              <Text style={styles.statusText}>{colmeia.temperatura}</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="water-outline" size={18} color="#555" />
              <Text style={styles.statusText}>{colmeia.umidade}</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="bug-outline" size={18} color="#555" />
              <Text style={styles.statusText}>2000 abelhas</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="scale-outline" size={18} color="#555" />
              <Text style={styles.statusText}>{colmeia.peso}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Espécie */}
          {colmeia.especie ? (
            <>
              <Text style={styles.cardSectionTitle}>Espécie</Text>
              <Text style={styles.infoText}>{colmeia.especie}</Text>
              <View style={styles.divider} />
            </>
          ) : null}

          {/* Localização */}
          <Text style={styles.cardSectionTitle}>Localização</Text>
          <Text style={styles.infoText}>São Paulo, SP, Brasil</Text>
          {colmeia.latitude ? (
            <Text style={styles.infoText}>Latitude: {colmeia.latitude}</Text>
          ) : null}
          {colmeia.longitude ? (
            <Text style={styles.infoText}>Longitude: {colmeia.longitude}</Text>
          ) : null}

          <View style={styles.divider} />

          {/* Histórico */}
          <Text style={styles.cardSectionTitle}>Histórico</Text>
          <View style={styles.chartWrapper}>
            <HistoricoChart />
          </View>
        </View>

        {/* Gravações */}
        <TouchableOpacity
          style={styles.gravacaoBtn}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/gravacoes",
              params: { colmeiaId: colmeia.id, nome: colmeia.nome },
            })
          }
        >
          <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
          <Text style={styles.gravacaoBtnText}>GRAVAÇÕES</Text>
          <View style={styles.gravacaoBadge}>
            <Text style={styles.gravacaoBadgeText}>!</Text>
          </View>
        </TouchableOpacity>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    elevation: 3,
    marginBottom: 24,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 4,
  },
  statusItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusText: { fontSize: 13, color: "#333", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 16 },
  infoText: { fontSize: 14, color: "#444", marginBottom: 4, lineHeight: 22 },
  chartWrapper: { paddingRight: 24, marginTop: 4 },
  gravacaoBtn: {
    backgroundColor: "#C8920C",
    borderRadius: 14,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 4,
  },
  gravacaoBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  gravacaoBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
  },
  gravacaoBadgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
});
