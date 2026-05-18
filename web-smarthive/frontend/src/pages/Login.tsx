import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, Mail, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "cadastro" | "recuperar" | "novaSenha";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { atualizarSenha, configurado, login, recuperarSenha, recuperandoSenha, registrar } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/";
  useEffect(() => {
    if (recuperandoSenha) setMode("novaSenha");
  }, [recuperandoSenha]);

  const title =
    mode === "login"
      ? "Entrar no SmartHive"
      : mode === "cadastro"
        ? "Criar acesso"
        : mode === "recuperar"
          ? "Recuperar senha"
          : "Criar nova senha";
  const subtitle = useMemo(() => {
    if (mode === "login") return "Use a mesma conta do aplicativo mobile.";
    if (mode === "cadastro") return "A conta criada aqui tambem entra no mobile.";
    if (mode === "recuperar") return "Enviaremos as instrucoes para o mesmo e-mail da sua conta.";
    return "Defina uma senha nova para continuar usando web e mobile.";
  }, [mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);

    if (mode !== "novaSenha" && !email.trim()) {
      setErro("Informe seu e-mail.");
      return;
    }

    if (mode !== "recuperar" && senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (mode === "cadastro" && !nome.trim()) {
      setErro("Informe seu nome.");
      return;
    }

    setEnviando(true);
    try {
      const result =
        mode === "login"
          ? await login(email.trim(), senha)
          : mode === "cadastro"
            ? await registrar(email.trim(), senha, nome.trim())
            : mode === "recuperar"
              ? await recuperarSenha(email.trim())
              : await atualizarSenha(senha);

      if (result.erro) {
        setErro(result.erro);
        return;
      }

      if (mode === "recuperar") {
        setSucesso("Confira seu e-mail para continuar a recuperacao.");
        return;
      }

      if (mode === "novaSenha") {
        setSucesso("Senha atualizada. Voce ja pode continuar.");
        navigate(redirectTo, { replace: true });
        return;
      }

      if (mode === "cadastro") {
        if (!result.sessaoCriada) {
          setSucesso("Conta criada. Confira seu e-mail para confirmar o acesso antes de entrar.");
          setMode("login");
          setSenha("");
          return;
        }
        setSucesso("Conta criada. Entrando...");
      }

      navigate(redirectTo, { replace: true });
    } finally {
      setEnviando(false);
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setErro(null);
    setSucesso(null);
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.95fr_1.05fr]">
      <section className="flex min-h-screen flex-col justify-between bg-hive-900 px-6 py-8 text-white sm:px-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
            <img src={logo} alt="SmartHive" className="h-9 w-9 object-contain" />
          </div>
          <div>
            <p className="text-lg font-bold">Smart Hive</p>
            <p className="text-xs font-medium text-hive-100">Web e mobile no mesmo Supabase</p>
          </div>
        </Link>

        <div className="max-w-xl py-14">
          <p className="text-sm font-bold uppercase tracking-wider text-honey-400">Monitoramento conectado</p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Uma conta para campo, web e dados.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-hive-100">
            Entre pela web com o mesmo usuario do app mobile. As sessoes passam pelo Supabase Auth e os registros
            continuam centralizados no banco compartilhado do SmartHive.
          </p>
        </div>

        <div className="grid gap-3 text-sm text-hive-100 sm:grid-cols-3">
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Supabase Auth</span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Banco unico</span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Mobile integrado</span>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-wider text-hive-700">Acesso</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>

          {!configurado ? (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env` do frontend.
            </div>
          ) : null}

          {erro ? (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{erro}</span>
            </div>
          ) : null}

          {sucesso ? (
            <div className="mb-5 rounded-lg border border-hive-200 bg-hive-50 p-4 text-sm font-medium text-hive-700">
              {sucesso}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "cadastro" ? (
              <FormField label="Nome">
                <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3">
                  <UserPlus className="h-4 w-4 text-slate-400" />
                  <input
                    className="min-h-12 w-full bg-transparent px-3 text-sm text-slate-950 outline-none"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    autoComplete="name"
                    placeholder="Seu nome"
                  />
                </div>
              </FormField>
            ) : null}

            {mode !== "novaSenha" ? (
              <FormField label="E-mail">
                <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    className="min-h-12 w-full bg-transparent px-3 text-sm text-slate-950 outline-none"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="voce@email.com"
                  />
                </div>
              </FormField>
            ) : null}

            {mode !== "recuperar" ? (
              <FormField label="Senha">
                <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  <input
                    className="min-h-12 w-full bg-transparent px-3 text-sm text-slate-950 outline-none"
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="Minimo 6 caracteres"
                  />
                  <button
                    type="button"
                    className="focus-ring rounded-md p-1 text-slate-400 hover:text-slate-700"
                    onClick={() => setMostrarSenha((value) => !value)}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              icon={mode === "recuperar" ? <Mail className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              disabled={enviando || !configurado}
            >
              {enviando
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : mode === "cadastro"
                    ? "Criar conta"
                    : mode === "recuperar"
                      ? "Enviar e-mail"
                      : "Atualizar senha"}
            </Button>
          </form>

          {mode !== "novaSenha" ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              {mode !== "login" ? (
                <button className="font-semibold text-hive-700 hover:text-hive-900" type="button" onClick={() => changeMode("login")}>
                  Ja tenho conta
                </button>
              ) : null}
              {mode !== "cadastro" ? (
                <button className="font-semibold text-hive-700 hover:text-hive-900" type="button" onClick={() => changeMode("cadastro")}>
                  Criar conta
                </button>
              ) : null}
              {mode !== "recuperar" ? (
                <button className="font-semibold text-slate-500 hover:text-slate-800" type="button" onClick={() => changeMode("recuperar")}>
                  Esqueci minha senha
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
