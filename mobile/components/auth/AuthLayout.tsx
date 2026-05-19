import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AuthBrandConfig, AuthFooterConfig, AuthPaletteConfig } from "@/constants/authConfig";
import { AuthScene } from "./AuthScene";

interface AuthLayoutProps {
  brand: AuthBrandConfig;
  palette: AuthPaletteConfig;
  footer?: AuthFooterConfig;
  showScene?: boolean;
  topAccessory?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  bottomAccessory?: React.ReactNode;
}

export function AuthLayout({
  brand,
  palette,
  footer,
  showScene = true,
  topAccessory,
  title,
  subtitle,
  children,
  bottomAccessory,
}: AuthLayoutProps) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.sky }]} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.sky} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showScene ? (
            <View style={styles.hero}>
              <AuthScene
                style={StyleSheet.absoluteFillObject as any}
                sky={palette.sky}
                skyDeep={palette.skyDeep}
              />
              <View style={styles.heroContent}>
                <View style={styles.brandRow}>
                  <View style={styles.logoBox}>
                    <Image source={brand.logo} style={styles.logoImg} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={[styles.brandName, { color: palette.text }]}>{brand.name}</Text>
                    <Text style={[styles.brandTagline, { color: palette.text }]}>{brand.tagline}</Text>
                  </View>
                </View>
                {topAccessory ? <View style={styles.topAccessory}>{topAccessory}</View> : null}
              </View>
            </View>
          ) : null}

          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: palette.textMuted }]}>{subtitle}</Text> : null}

            <View style={styles.body}>{children}</View>

            {bottomAccessory ? <View style={styles.bottom}>{bottomAccessory}</View> : null}

            {footer ? (
              <View style={[styles.footer, { borderTopColor: palette.border }]}>
                <Text style={[styles.footerText, { color: palette.textMuted }]}>{footer.copyright}</Text>
                <View style={styles.footerLinks}>
                  <Text style={[styles.footerLink, { color: palette.textMuted }]}>{footer.termos}</Text>
                  <Text style={[styles.footerSep, { color: palette.textMuted }]}>·</Text>
                  <Text style={[styles.footerLink, { color: palette.textMuted }]}>{footer.privacidade}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  hero: {
    height: 220,
    position: "relative",
    overflow: "hidden",
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  logoImg: { width: 34, height: 34 },
  brandName: { fontSize: 18, fontWeight: "800", letterSpacing: 0.2 },
  brandTagline: { fontSize: 12, fontWeight: "500", opacity: 0.85 },
  topAccessory: { alignSelf: "flex-end", marginBottom: 12 },
  card: {
    marginTop: -28,
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
  },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.2 },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  body: { marginTop: 18 },
  bottom: { marginTop: 14 },
  footer: { marginTop: 22, paddingTop: 14, borderTopWidth: 1 },
  footerText: { fontSize: 11, textAlign: "center" },
  footerLinks: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  footerLink: { fontSize: 11, textDecorationLine: "underline" },
  footerSep: { fontSize: 11 },
});
