import type { ImageSourcePropType } from "react-native";

export interface AuthBrandConfig {
  logo: ImageSourcePropType;
  name: string;
  tagline: string;
}

export interface AuthPromoConfig {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
}

export interface AuthPaletteConfig {
  primary: string;
  primaryText: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  link: string;
  accent: string;
  sky: string;
  skyDeep: string;
}

export interface AuthTextsConfig {
  login: {
    title: string;
    subtitle: string;
    submit: string;
    rememberLabel: string;
    forgotLabel: string;
    noAccountPrefix: string;
    noAccountAction: string;
    dividerText: string;
    secondaryAction: string;
  };
  registro: {
    title: string;
    subtitle: string;
    submit: string;
    backAction: string;
    receberNotificacoes: string;
  };
  placeholders: {
    nome: string;
    email: string;
    senha: string;
    confirmarSenha: string;
    telefone: string;
  };
}

export interface AuthFooterConfig {
  copyright: string;
  termos: string;
  privacidade: string;
}

export interface AuthConfig {
  brand: AuthBrandConfig;
  promo: AuthPromoConfig;
  palette: AuthPaletteConfig;
  texts: AuthTextsConfig;
  footer: AuthFooterConfig;
}

export const authConfig: AuthConfig = {
  brand: {
    logo: require("../assets/images/logo-bee.png"),
    name: "Smart Hive",
    tagline: "Apicultura inteligente",
  },
  promo: {
    eyebrow: "Monitoramento conectado",
    title: "A melhor plataforma de gestao apicola.",
    description:
      "Use a mesma conta no app e na web. Sensores, alertas e historico ficam sincronizados pelo Supabase.",
    bullets: [
      "Sessao unica entre web e mobile",
      "Historico em tempo real",
      "Alertas automaticos no campo",
    ],
    ctaLabel: "Saiba mais",
  },
  palette: {
    primary: "#2563eb",
    primaryText: "#ffffff",
    surface: "#ffffff",
    surfaceMuted: "#f5f7fa",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    link: "#2563eb",
    accent: "#d99a14",
    sky: "#bfe2f6",
    skyDeep: "#7fc1e6",
  },
  texts: {
    login: {
      title: "Entrar",
      subtitle: "Use a mesma conta do aplicativo web.",
      submit: "Entrar",
      rememberLabel: "Manter conectado por 2 semanas",
      forgotLabel: "Esqueceu sua senha?",
      noAccountPrefix: "Nao tem uma conta?",
      noAccountAction: "Criar conta.",
      dividerText: "ou",
      secondaryAction: "Registrar-se",
    },
    registro: {
      title: "Registro",
      subtitle: "Insira suas informacoes",
      submit: "Registrar-se",
      backAction: "Entrar",
      receberNotificacoes: "Desejo receber notificacoes em meu e-mail",
    },
    placeholders: {
      nome: "Nome completo",
      email: "E-mail",
      senha: "Senha (min. 6 caracteres)",
      confirmarSenha: "Confirmar senha",
      telefone: "Telefone (opcional)",
    },
  },
  footer: {
    copyright: `(c) ${new Date().getFullYear()} SmartHive`,
    termos: "Termos de servico",
    privacidade: "Politica de privacidade",
  },
};
