import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export type LatLng = { latitude: number; longitude: number };

type Props = {
  visivel: boolean;
  onFechar: () => void;
  onConfirmar: (dados: { latitude: string; longitude: string; endereco: string; cidade: string }) => void;
};

export default function MapPicker({ visivel, onFechar, onConfirmar }: Props) {
  const mapRef = useRef<MapView>(null);
  const [marcador, setMarcador] = useState<LatLng | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  const [regiaoInicial, setRegiaoInicial] = useState<Region>({
    latitude: -14.235,
    longitude: -51.9253,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });

  useEffect(() => {
    if (visivel) {
      irParaLocalizacaoAtual();
    }
  }, [visivel]);

  async function irParaLocalizacaoAtual() {
    setCarregando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Ative a localização nas configurações do celular.');
        setCarregando(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const regiao: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegiaoInicial(regiao);
      setMarcador({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      mapRef.current?.animateToRegion(regiao, 800);
    } catch {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    }
    setCarregando(false);
  }

  function handleMapPress(e: MapPressEvent) {
    setMarcador(e.nativeEvent.coordinate);
  }

  async function handleConfirmar() {
    if (!marcador) {
      Alert.alert('Atenção', 'Toque no mapa para selecionar uma localização.');
      return;
    }
    setBuscandoEndereco(true);
    try {
      const resultados = await Location.reverseGeocodeAsync(marcador);
      const r = resultados[0];
      const partes = [
        r.street && `Rua: ${r.street}`,
        r.streetNumber && `Nº${r.streetNumber}`,
        r.district,
      ].filter(Boolean);
      const endereco = partes.join(', ') || 'Endereço não informado';
      const cidade = r.city || r.subregion || 'Cidade não identificada';

      onConfirmar({
        latitude: marcador.latitude.toFixed(6),
        longitude: marcador.longitude.toFixed(6),
        endereco,
        cidade,
      });
    } catch {
      // Se geocoding falhar, usa só as coordenadas
      onConfirmar({
        latitude: marcador.latitude.toFixed(6),
        longitude: marcador.longitude.toFixed(6),
        endereco: 'Endereço não informado',
        cidade: 'Cidade não identificada',
      });
    }
    setBuscandoEndereco(false);
  }

  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={onFechar}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onFechar}>
            <Ionicons name="close" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Selecionar localização</Text>
          <View style={{ width: 36 }} />
        </View>

        <Text style={styles.hint}>Toque no mapa para posicionar o pin</Text>

        {/* Mapa */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={regiaoInicial}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {marcador && (
              <Marker
                coordinate={marcador}
                draggable
                onDragEnd={e => setMarcador(e.nativeEvent.coordinate)}
                pinColor="#C8920C"
              />
            )}
          </MapView>

          {/* Botão GPS flutuante */}
          <TouchableOpacity
            style={styles.gpsFloat}
            onPress={irParaLocalizacaoAtual}
            disabled={carregando}
          >
            {carregando
              ? <ActivityIndicator size="small" color="#C8920C" />
              : <Ionicons name="locate" size={22} color="#C8920C" />
            }
          </TouchableOpacity>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          {marcador && (
            <Text style={styles.coordText}>
              {marcador.latitude.toFixed(5)}, {marcador.longitude.toFixed(5)}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.btnConfirmar, (!marcador || buscandoEndereco) && { opacity: 0.6 }]}
            onPress={handleConfirmar}
            disabled={!marcador || buscandoEndereco}
          >
            {buscandoEndereco
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.btnConfirmarText}>Confirmar localização</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#F5C518',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  gpsFloat: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  coordText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  btnConfirmar: {
    backgroundColor: '#C8920C',
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  btnConfirmarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
