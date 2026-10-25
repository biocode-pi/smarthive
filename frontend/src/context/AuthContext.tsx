import {
  confirmResetPassword,
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { Hub, sessionStorage as amplifySessionStorage, defaultStorage } from "aws-amplify/utils";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { hasCognitoConfig } from "../services/cognito";

export interface Usuario {
  id: string;
  email: string;
  nome: string | null;
}

export type AuthResult = { erro?: string; precisaConfirmar?: boolean; precisaMfa?: boolean };

const AUTH_TIMEOUT_MS = 15000;

interface AuthContextValue {
  user: Usuario | null;
  carregando: boolean;
  configurado: boolean;
  login: (email: string, senha: string, manterConectado: boolean) => Promise<AuthResult>;
  confirmarMfa: (codigo: string) => Promise<AuthResult>;
  registrar: (email: string, senha: string, nome: string) => Promise<AuthResult>;
  confirmarCadastro: (email: string, codigo: string) => Promise<AuthResult>;
  reenviarCodigo: (email: string) => Promise<AuthResult>;
  recuperarSenha: (email: string) => Promise<AuthResult>;
  redefinirSenha: (email: string, codigo: string, novaSenha: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function carregarUsuario(): Promise<Usuario | null> {
  try {
    const { userId } = await getCurrentUser();
    // Nome e e-mail ja vem no ID token salvo localmente; evita uma chamada de rede a cada carregamento.
    const { tokens } = await fetchAuthSession();
    const claims = tokens?.idToken?.payload;
    if (!claims) return null;
    return {
      id: userId,
      email: typeof claims.email === "string" ? claims.email : "",
      nome: typeof claims.name === "string" ? claims.name : null,
    };
  } catch {
    return null;
  }
}

/** Access token atual (renovado automaticamente pelo Amplify) para enviar a API. */
export async function obterAccessToken(): Promise<string | null> {
  if (!hasCognitoConfig) return null;
  try {
    const { tokens } = await fetchAuthSession();
    return tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(hasCognitoConfig);

  const atualizarUsuario = useCallback(async () => {
    setUser(await carregarUsuario());
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!hasCognitoConfig) return;
    void atualizarUsuario();

    return Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") void atualizarUsuario();
      if (payload.event === "signedOut" || payload.event === "tokenRefresh_failure") setUser(null);
    });
  }, [atualizarUsuario]);

  async function executar(acao: () => Promise<AuthResult | void>): Promise<AuthResult> {
    if (!hasCognitoConfig) return { erro: "Login nao configurado no frontend." };
    try {
      return (await withAuthTimeout(acao())) ?? {};
    } catch (error) {
      return { erro: traduzirErro(error) };
    }
  }

  const login = (email: string, senha: string, manterConectado: boolean) =>
    executar(async () => {
      // Sem "manter conectado", os tokens ficam so ate fechar o navegador.
      cognitoUserPoolsTokenProvider.setKeyValueStorage(manterConectado ? defaultStorage : amplifySessionStorage);
      const { nextStep } = await signIn({ username: email, password: senha });
      if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
        await resendSignUpCode({ username: email });
        return { precisaConfirmar: true };
      }
      if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") return { precisaMfa: true };
      if (nextStep.signInStep !== "DONE") return { erro: "Etapa de login nao suportada." };
      await atualizarUsuario();
    });

  const confirmarMfa = (codigo: string) =>
    executar(async () => {
      const { nextStep } = await confirmSignIn({ challengeResponse: codigo });
      if (nextStep.signInStep !== "DONE") return { erro: "Etapa de login nao suportada." };
      await atualizarUsuario();
    });

  const registrar = (email: string, senha: string, nome: string) =>
    executar(async () => {
      const { nextStep } = await signUp({
        username: email,
        password: senha,
        options: { userAttributes: { email, name: nome } },
      });
      return { precisaConfirmar: nextStep.signUpStep === "CONFIRM_SIGN_UP" };
    });

  const confirmarCadastro = (email: string, codigo: string) =>
    executar(async () => {
      await confirmSignUp({ username: email, confirmationCode: codigo });
    });

  const reenviarCodigo = (email: string) =>
    executar(async () => {
      await resendSignUpCode({ username: email });
    });

  const recuperarSenha = (email: string) =>
    executar(async () => {
      await resetPassword({ username: email });
    });

  const redefinirSenha = (email: string, codigo: string, novaSenha: string) =>
    executar(async () => {
      await confirmResetPassword({ username: email, confirmationCode: codigo, newPassword: novaSenha });
    });

  async function logout() {
    if (!hasCognitoConfig) return;
    await signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        carregando,
        configurado: hasCognitoConfig,
        login,
        confirmarMfa,
        registrar,
        confirmarCadastro,
        reenviarCodigo,
        recuperarSenha,
        redefinirSenha,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}

export function userDisplayName(user: Usuario | null): string {
  if (user?.nome?.trim()) return user.nome.trim();
  return user?.email || "Usuario";
}

function withAuthTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error("auth_timeout")), AUTH_TIMEOUT_MS);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

function traduzirErro(error: unknown): string {
  const nome = error instanceof Error ? error.name : "";
  const mensagem = error instanceof Error ? error.message : "";

  if (mensagem === "auth_timeout") {
    return "A autenticacao demorou demais para responder. Verifique sua conexao e tente novamente.";
  }
  switch (nome) {
    case "NotAuthorizedException":
      return "E-mail ou senha incorretos.";
    case "UsernameExistsException":
      return "Este e-mail ja esta cadastrado.";
    case "InvalidPasswordException":
      return "A senha precisa ter 8 caracteres, com letra maiuscula, minuscula e numero.";
    case "EnableSoftwareTokenMFAException":
    case "CodeMismatchException":
      return "Codigo incorreto. Confira e tente novamente.";
    case "ExpiredCodeException":
      return "Codigo expirado. Solicite um novo.";
    case "LimitExceededException":
    case "TooManyRequestsException":
    case "TooManyFailedAttemptsException":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    case "UserAlreadyAuthenticatedException":
      return "Voce ja esta conectado.";
    case "InvalidParameterException":
      return "Dados invalidos. Confira o e-mail e a senha.";
    default:
      return "Nao foi possivel concluir a autenticacao. Tente novamente.";
  }
}
