import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, Mail, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { authConfig } from "../config/auth.config";
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
  const [manterConectado, setManterConectado] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const { texts, brand, promo, footer } = authConfig;

  const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/";
  useEffect(() => {
    if (recuperandoSenha) setMode("novaSenha");
  }, [recuperandoSenha]);

  const current = useMemo(() => {
    if (mode === "login") return { title: texts.login.title, subtitle: texts.login.subtitle, submit: texts.login.submit };
    if (mode === "cadastro") return { title: texts.cadastro.title, subtitle: texts.cadastro.subtitle, submit: texts.cadastro.submit };
    if (mode === "recuperar") return { title: texts.recuperar.title, subtitle: texts.recuperar.subtitle, submit: texts.recuperar.submit };
    return { title: texts.novaSenha.title, subtitle: texts.novaSenha.subtitle, submit: texts.novaSenha.submit };
  }, [mode, texts]);

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
      if (mode === "cadastro" && !result.sessaoCriada) {
        setSucesso("Conta criada. Confira seu e-mail para confirmar o acesso antes de entrar.");
        setMode("login");
        setSenha("");
        return;
      }
      navigate(redirectTo, { replace: true });
    } finally {
      setEnviando(false);
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setErro(null);
    setSucesso(null);
  }

  const topRight =
    mode === "login" ? (
      <span>
        {texts.login.noAccountPrefix}{" "}
        <button type="button" className="font-semibold text-blue-600 hover:text-blue-700" onClick={() => changeMode("cadastro")}>
          {texts.login.noAccountAction}
        </button>
      </span>
    ) : mode === "cadastro" ? (
      <span>
        {texts.cadastro.hasAccountPrefix}{" "}
        <button type="button" className="font-semibold text-blue-600 hover:text-blue-700" onClick={() => changeMode("login")}>
          {texts.cadastro.hasAccountAction}
        </button>
      </span>
    ) : null;

  return (
    <AuthLayout brand={brand} promo={promo} footer={footer} topRight={topRight}>
      <div className="mb-7">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">{current.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{current.subtitle}</p>
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
        <div className="mb-5 rounded-lg border border-hive-200 bg-hive-50 p-4 text-sm font-medium text-hive-700">{sucesso}</div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "cadastro" ? (
          <FormField label="Nome">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <UserPlus className="h-4 w-4 text-slate-400" />
              <input
                className="min-h-12 w-full bg-transparent px-3 text-sm text-slate-950 outline-none"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                autoComplete="name"
                placeholder={texts.placeholders.nome}
              />
            </div>
          </FormField>
        ) : null}

        {mode !== "novaSenha" ? (
          <FormField label="E-mail">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                className="min-h-12 w-full bg-transparent px-3 text-sm text-slate-950 outline-none"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder={texts.placeholders.email}
              />
            </div>
          </FormField>
        ) : null}

        {mode !== "recuperar" ? (
          <FormField label="Senha">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <KeyRound className="h-4 w-4 text-slate-400" />
              <input
                className="min-h-12 w-full bg-transparent px-3 text-sm text-slate-950 outline-none"
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={texts.placeholders.senha}
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

        {mode === "login" ? (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={manterConectado}
              onChange={(event) => setManterConectado(event.target.checked)}
            />
            <span>{texts.login.rememberLabel}</span>
          </label>
        ) : null}

        <Button
          type="submit"
          className="w-full bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
          icon={mode === "recuperar" ? <Mail className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          disabled={enviando || !configurado}
        >
          {enviando ? "Aguarde..." : current.submit}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
        {mode === "login" ? (
          <button type="button" className="font-semibold text-slate-500 hover:text-slate-800" onClick={() => changeMode("recuperar")}>
            {texts.login.forgotLabel}
          </button>
        ) : null}
        {mode === "recuperar" ? (
          <button type="button" className="font-semibold text-blue-600 hover:text-blue-700" onClick={() => changeMode("login")}>
            {texts.recuperar.backAction}
          </button>
        ) : null}
      </div>
    </AuthLayout>
  );
}
