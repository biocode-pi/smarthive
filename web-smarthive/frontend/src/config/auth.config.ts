import logo from "../assets/logo.png";

export interface AuthBrandConfig {
  logoSrc: string;
  name: string;
  tagline: string;
}

export interface AuthPromoConfig {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface AuthFooterLink {
  label: string;
  href: string;
}

export interface AuthFooterConfig {
  copyright: string;
  links: AuthFooterLink[];
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
  };
  cadastro: {
    title: string;
    subtitle: string;
    submit: string;
    hasAccountPrefix: string;
    hasAccountAction: string;
  };
  recuperar: {
    title: string;
    subtitle: string;
    submit: string;
    backAction: string;
  };
  novaSenha: {
    title: string;
    subtitle: string;
    submit: string;
  };
  placeholders: {
    nome: string;
    email: string;
    senha: string;
  };
}

export interface AuthConfig {
  brand: AuthBrandConfig;
  promo: AuthPromoConfig;
  footer: AuthFooterConfig;
  texts: AuthTextsConfig;
}

export const authConfig: AuthConfig = {
  brand: {
    logoSrc: logo,
    name: "Smart Hive",
    tagline: "Apicultura inteligente",
  },
  promo: {
    eyebrow: "Monitoramento conectado",
    title: "A melhor plataforma de gestao apicola do mercado.",
    description:
      "Acompanhe colmeias, sensores e alertas em tempo real. Use a mesma conta no aplicativo mobile e na web - tudo sincronizado pelo Supabase.",
    bullets: [
      "Sessao unica entre web e mobile",
      "Historico em tempo real no banco compartilhado",
      "Alertas automaticos e relatorios prontos",
    ],
    ctaLabel: "Conhecer o app mobile",
    ctaHref: "#",
  },
  footer: {
    copyright: `(c) ${new Date().getFullYear()} SmartHive. Todos os direitos reservados.`,
    links: [
      { label: "Termos de servico", href: "#" },
      { label: "Politica de privacidade", href: "#" },
    ],
  },
  texts: {
    login: {
      title: "Entrar",
      subtitle: "Use a mesma conta do aplicativo mobile.",
      submit: "Entrar",
      rememberLabel: "Manter conectado por 2 semanas",
      forgotLabel: "Esqueceu sua senha?",
      noAccountPrefix: "Nao tem uma conta?",
      noAccountAction: "Criar conta.",
    },
    cadastro: {
      title: "Criar conta",
      subtitle: "A conta criada aqui tambem entra no mobile.",
      submit: "Criar conta",
      hasAccountPrefix: "Ja tem uma conta?",
      hasAccountAction: "Entrar.",
    },
    recuperar: {
      title: "Recuperar senha",
      subtitle: "Enviaremos as instrucoes para o e-mail da sua conta.",
      submit: "Enviar e-mail",
      backAction: "Voltar para o login",
    },
    novaSenha: {
      title: "Criar nova senha",
      subtitle: "Defina uma senha nova para continuar usando web e mobile.",
      submit: "Atualizar senha",
    },
    placeholders: {
      nome: "Seu nome",
      email: "voce@email.com",
      senha: "Minimo 6 caracteres",
    },
  },
};
