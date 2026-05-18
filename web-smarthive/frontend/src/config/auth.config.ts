import logo from "../assets/logo.png";

export interface AuthBrandConfig {
  logoSrc: string;
  name: string;
}

export interface AuthQuoteConfig {
  text: string;
  attribution: string;
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
  labels: {
    nome: string;
    email: string;
    senha: string;
  };
  placeholders: {
    nome: string;
    email: string;
    senha: string;
  };
}

export interface AuthConfig {
  brand: AuthBrandConfig;
  quote: AuthQuoteConfig;
  footer: AuthFooterConfig;
  texts: AuthTextsConfig;
}

export const authConfig: AuthConfig = {
  brand: {
    logoSrc: logo,
    name: "SmartHive",
  },
  quote: {
    text: "Apicultura conectada, do campo aos dados.",
    attribution: "SmartHive",
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} SmartHive`,
    links: [
      { label: "Termos", href: "#" },
      { label: "Privacidade", href: "#" },
    ],
  },
  texts: {
    login: {
      title: "Entrar",
      subtitle: "Acesse sua conta para continuar.",
      submit: "Entrar",
      rememberLabel: "Manter conectado",
      forgotLabel: "Esqueci minha senha",
      noAccountPrefix: "Novo por aqui?",
      noAccountAction: "Criar conta",
    },
    cadastro: {
      title: "Criar conta",
      subtitle: "Use a mesma conta no aplicativo web e mobile.",
      submit: "Criar conta",
      hasAccountPrefix: "Ja tem conta?",
      hasAccountAction: "Entrar",
    },
    recuperar: {
      title: "Recuperar acesso",
      subtitle: "Enviaremos as instrucoes para redefinir sua senha.",
      submit: "Enviar instrucoes",
      backAction: "Voltar para o login",
    },
    novaSenha: {
      title: "Nova senha",
      subtitle: "Defina uma senha para continuar.",
      submit: "Salvar senha",
    },
    labels: {
      nome: "Nome",
      email: "E-mail",
      senha: "Senha",
    },
    placeholders: {
      nome: "Seu nome",
      email: "voce@email.com",
      senha: "Minimo 6 caracteres",
    },
  },
};
