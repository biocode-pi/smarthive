import { HapticTab } from "@/components/haptic-tab";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#D4860A",
        tabBarInactiveTintColor: "#888888",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconWrapper}>
              <Ionicons name="newspaper-outline" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconWrapper}>
              <Ionicons name="grid-outline" size={24} color={color} />
              <View style={styles.badge} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="conta"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconWrapper}>
              <Ionicons name="person-outline" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="apiario-detalhe" options={{ href: null }} />
      <Tabs.Screen name="colmeia-detalhe" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53935",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
});
