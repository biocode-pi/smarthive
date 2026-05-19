import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';

const NOTICIAS = [
  {
    id: 1,
    titulo: 'Pragas surgem no interior de São Paulo e preocupa Apicultores',
    resumo: 'Infestação de pragas no interior de São Paulo ameaça produção de mel e preocupa apicultores....',
    tempo: 'Há 20 Minutos',
    imagem: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    id: 2,
    titulo: 'Nova técnica de coleta de mel aumenta produtividade em 30%',
    resumo: 'Pesquisadores desenvolvem método inovador que melhora a eficiência na coleta sem prejudicar as abelhas....',
    tempo: 'Há 2 Horas',
    imagem: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&q=80',
  },
  {
    id: 3,
    titulo: 'Apicultura sustentável ganha espaço no agronegócio brasileiro',
    resumo: 'Práticas sustentáveis na criação de abelhas impulsionam o setor e atraem novos investidores....',
    tempo: 'Há 5 Horas',
    imagem: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
];

const FILTROS = ['Em alta', 'Mais Vistas', 'Recentes'];

const THUMBS = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80',
  'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=300&q=80',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=300&q=80',
];

export default function NoticiasScreen() {
  const [filtroAtivo, setFiltroAtivo] = useState('Em alta');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#D4A017" />
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notícias curtas</Text>
        </View>

        {/* Thumbnails */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbsRow}>
          {THUMBS.map((uri, i) => (
            <TouchableOpacity key={i} style={styles.thumbCard} activeOpacity={0.85}>
              <Image source={{ uri }} style={styles.thumbImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filters */}
        <View style={styles.filterRow}>
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filtroAtivo === f && styles.filterBtnActive]}
              onPress={() => setFiltroAtivo(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filtroAtivo === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* News cards */}
        <View style={styles.newsList}>
          {NOTICIAS.map((noticia) => (
            <View key={noticia.id} style={styles.noticiaCard}>
              <Image source={{ uri: noticia.imagem }} style={styles.noticiaImage} />
              <View style={styles.noticiaContent}>
                <Text style={styles.noticiaTitle}>{noticia.titulo}</Text>
                <Text style={styles.noticiaResumo}>{noticia.resumo}</Text>
                <View style={styles.noticiaFooter}>
                  <Text style={styles.noticiaTempo}>{noticia.tempo}</Text>
                  <TouchableOpacity style={styles.btnContinue} activeOpacity={0.85}>
                    <Text style={styles.btnContinueText}>Continue Lendo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D4A017' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },

  thumbsRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 16 },
  thumbCard: { width: 110, height: 82, borderRadius: 14, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.35)' },
  filterBtnActive: { backgroundColor: '#1A1A1A' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  filterTextActive: { color: '#FFFFFF' },

  newsList: { paddingHorizontal: 16, gap: 16, paddingBottom: 24 },
  noticiaCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  noticiaImage: { width: '100%', height: 180, resizeMode: 'cover' },
  noticiaContent: { padding: 16 },
  noticiaTitle: { fontSize: 16, fontWeight: '700', color: '#D4860A', marginBottom: 6, lineHeight: 22 },
  noticiaResumo: { fontSize: 13, color: '#444', lineHeight: 18, marginBottom: 12 },
  noticiaFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noticiaTempo: { fontSize: 12, color: '#888' },
  btnContinue: { backgroundColor: '#E8C45A', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  btnContinueText: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },
});
