import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { hasSupabaseConfig, supabase } from "../services/supabase";

type AuthResult = { erro?: string; sessaoCriada?: boolean };

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  carregando: boolean;
  configurado: boolean;
  recuperandoSenha: boolean;
  login: (email: string, senha: string) => Promise<AuthResult>;
  registrar: (email: string, senha: string, nome: string) => Promise<AuthResult>;
  recuperarSenha: (email: string) => Promise<AuthResult>;
  atualizarSenha: (senha: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setCarregando(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setCarregando(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setRecuperandoSenha(true);
      if (event === "SIGNED_OUT" || event === "USER_UPDATED") setRecuperandoSenha(false);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setCarregando(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, senha: string): Promise<AuthResult> {
    if (!hasSupabaseConfig) return { erro: "Supabase nao configurado no frontend." };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return { erro: traduzirErro(error.message) };
    setSession(data.session);
    setUser(data.user);
    return {};
  }

  async function registrar(email: string, senha: string, nome: string): Promise<AuthResult> {
    if (!hasSupabaseConfig) return { erro: "Supabase nao configurado no frontend." };
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });
    if (error) return { erro: traduzirErro(error.message) };
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }
    return { sessaoCriada: Boolean(data.session) };
  }

  async function recuperarSenha(email: string): Promise<AuthResult> {
    if (!hasSupabaseConfig) return { erro: "Supabase nao configurado no frontend." };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return error ? { erro: traduzirErro(error.message) } : {};
  }

  async function atualizarSenha(senha: string): Promise<AuthResult> {
    if (!hasSupabaseConfig) return { erro: "Supabase nao configurado no frontend." };
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return { erro: traduzirErro(error.message) };
    setRecuperandoSenha(false);
    return {};
  }

  async function logout() {
    if (!hasSupabaseConfig) return;
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        carregando,
        configurado: hasSupabaseConfig,
        recuperandoSenha,
        login,
        registrar,
        recuperarSenha,
        atualizarSenha,
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

export function userDisplayName(user: User | null): string {
  const nome = user?.user_metadata?.nome;
  if (typeof nome === "string" && nome.trim()) return nome.trim();
  return user?.email ?? "Usuario";
}

function traduzirErro(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("user already registered")) return "Este e-mail ja esta cadastrado.";
  if (normalized.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (normalized.includes("invalid") && normalized.includes("email")) return "Informe um e-mail valido.";
  if (normalized.includes("email rate limit")) {
    return "Limite de envio de e-mails do Supabase atingido. Aguarde alguns minutos ou desative a confirmacao por e-mail.";
  }
  if (normalized.includes("for security purposes")) return "Aguarde alguns segundos antes de tentar novamente.";
  return "Nao foi possivel concluir a autenticacao. Tente novamente.";
}
