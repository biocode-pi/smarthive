import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { authConfig } from "../config/auth.config";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "cadastro" | "recuperar" | "novaSenha";

const inputClass =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const { texts, brand, quote, footer } = authConfig;

  const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/";

  useEffect(() => {
    if (recuperandoSenha) setMode("novaSenha");
  }, [recuperandoSenha]);

  const current = useMemo(() => {
    if (mode === "login") return texts.login;
    if (mode === "cadastro") return texts.cadastro;
    if (mode === "recuperar") return texts.recuperar;
    return texts.novaSenha;
  }, [mode, texts]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);

    if (mode !== "novaSenha" && !email.trim()) {
      setErro("Informe seu e-mail.");
      return;
    }
    if (mode !== "novaSenha" && !emailRegex.test(email.trim())) {
      setErro("Informe um e-mail valido. Exemplo: nome@dominio.com");
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
        setSucesso("Senha atualizada.");
        navigate(redirectTo, { replace: true });
        return;
      }
      if (mode === "cadastro" && !result.sessaoCriada) {
        setSucesso("Conta criada. Confirme seu e-mail antes de entrar.");
        setMode("login");
        setSenha("");
        return;
      }
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErro(
        error instanceof Error && error.message === "auth_timeout"
          ? "A autenticacao demorou demais para responder. Verifique sua conexao e tente novamente."
          : "Nao foi possivel concluir a autenticacao. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setErro(null);
    setSucesso(null);
  }

  return (
    <AuthLayout brand={brand} quote={quote} footer={footer}>
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-900">{current.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{current.subtitle}</p>
      </div>

      {!configurado ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env do frontend.
        </div>
      ) : null}

      {erro ? (
        <div className="mt-6 flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{erro}</span>
        </div>
      ) : null}

      {sucesso ? (
        <div className="mt-6 rounded-md border border-hive-200 bg-hive-50 px-3.5 py-3 text-sm font-medium text-hive-700">
          {sucesso}
        </div>
      ) : null}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        {mode === "cadastro" ? (
          <div>
            <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-slate-700">
              {texts.labels.nome}
            </label>
            <input
              id="nome"
              className={inputClass}
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              autoComplete="name"
              placeholder={texts.placeholders.nome}
            />
          </div>
        ) : null}

        {mode !== "novaSenha" ? (
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              {texts.labels.email}
            </label>
            <input
              id="email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder={texts.placeholders.email}
            />
          </div>
        ) : null}

        {mode !== "recuperar" ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="senha" className="block text-sm font-medium text-slate-700">
                {texts.labels.senha}
              </label>
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => changeMode("recuperar")}
                  className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
                >
                  {texts.login.forgotLabel}
                </button>
              ) : null}
            </div>
            <div className="relative">
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                className={`${inputClass} pr-11`}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={texts.placeholders.senha}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((value) => !value)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-slate-400 transition hover:text-slate-700"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : null}

        {mode === "login" ? (
          <label className="flex select-none items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
              checked={manterConectado}
              onChange={(event) => setManterConectado(event.target.checked)}
            />
            <span>{texts.login.rememberLabel}</span>
          </label>
        ) : null}

        <button
          type="submit"
          disabled={enviando || !configurado}
          className="h-11 w-full rounded-md bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? "Aguarde..." : current.submit}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            {texts.login.noAccountPrefix}{" "}
            <button
              type="button"
              className="font-medium text-slate-900 underline-offset-4 hover:underline"
              onClick={() => changeMode("cadastro")}
            >
              {texts.login.noAccountAction}
            </button>
          </>
        ) : mode === "cadastro" ? (
          <>
            {texts.cadastro.hasAccountPrefix}{" "}
            <button
              type="button"
              className="font-medium text-slate-900 underline-offset-4 hover:underline"
              onClick={() => changeMode("login")}
            >
              {texts.cadastro.hasAccountAction}
            </button>
          </>
        ) : mode === "recuperar" ? (
          <button
            type="button"
            className="font-medium text-slate-900 underline-offset-4 hover:underline"
            onClick={() => changeMode("login")}
          >
            {texts.recuperar.backAction}
          </button>
        ) : null}
      </div>
    </AuthLayout>
  );
}
