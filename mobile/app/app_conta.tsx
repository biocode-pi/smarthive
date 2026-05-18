import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const MENU_ITEMS = [
  { id: 1, label: 'Alterar Perfil' },
  { id: 2, label: 'Suporte' },
  { id: 3, label: 'Políticas de privacidade' },
  { id: 4, label: 'Termos de uso' },
];

export default function ContaScreen() {
  const { logout, user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5C518" />

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.pageTitle}>Conta</Text>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color="#888" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Seja bem-vindo(a),</Text>
            <Text style={styles.userName}>Bruno Davies</Text>
          </View>
        </View>

        {/* Menu card */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={styles.menuDivider} />

          {/* Sair + Dark mode toggle */}
          <View style={styles.menuBottomRow}>
            <TouchableOpacity
              onPress={async () => { await logout(); router.replace("/login"); }}
              activeOpacity={0.7}
            >
              <Text style={styles.sairText}>Sair</Text>
            </TouchableOpacity>

            {/* Dark mode toggle */}
            <View style={styles.toggleWrapper}>
              <View style={[styles.toggleTrack, darkMode && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, darkMode && styles.toggleThumbRight]}>
                  <View style={styles.thumbIconBg}>
                    <Ionicons
                      name="layers"
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5C518' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },

  // User card
  userCard: {
    backgroundColor: '#C8920C',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userInfo: {},
  welcomeText: { fontSize: 13, color: '#FFFFFF', opacity: 0.85 },
  userName: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },

  // Menu card
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: { fontSize: 15, color: '#1A1A1A', fontWeight: '400' },

  menuDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 2 },

  menuBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  sairText: { fontSize: 15, color: '#E53935', fontWeight: '600' },

  // Custom toggle
  toggleWrapper: {},
  toggleTrack: {
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackActive: { backgroundColor: '#D4860A' },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  toggleThumbRight: { alignSelf: 'flex-end' },
  thumbIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#5D3A00',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
