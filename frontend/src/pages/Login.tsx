import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { authConfig } from "../config/auth.config";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "mfa" | "cadastro" | "confirmar" | "recuperar" | "novaSenha";

const inputClass =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mesma politica do User Pool do Cognito.
const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const pedeEmail: Mode[] = ["login", "cadastro", "recuperar"];
const pedeSenha: Mode[] = ["login", "cadastro", "novaSenha"];
const pedeCodigo: Mode[] = ["mfa", "confirmar", "novaSenha"];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    confirmarCadastro,
    confirmarMfa,
    configurado,
    login,
    recuperarSenha,
    redefinirSenha,
    reenviarCodigo,
    registrar,
  } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [manterConectado, setManterConectado] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const { texts, brand, quote, footer } = authConfig;

  const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/app";

  const current = useMemo(() => texts[mode], [mode, texts]);

  function validar(): string | null {
    if (pedeEmail.includes(mode) && !emailRegex.test(email.trim())) {
      return "Informe um e-mail valido. Exemplo: nome@dominio.com";
    }
    if (mode === "cadastro" && !nome.trim()) return "Informe seu nome.";
    if (mode === "login" && !senha) return "Informe sua senha.";
    if ((mode === "cadastro" || mode === "novaSenha") && !senhaForteRegex.test(senha)) {
      return "A senha precisa ter 8 caracteres, com letra maiuscula, minuscula e numero.";
    }
    if (pedeCodigo.includes(mode) && !/^\d{6}$/.test(codigo.trim())) return "Informe o codigo de 6 digitos.";
    return null;
  }

  function irPara(next: Mode, mensagem: string | null = null) {
    setMode(next);
    setErro(null);
    setSucesso(mensagem);
    setCodigo("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);

    const erroValidacao = validar();
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const emailLimpo = email.trim();
    setEnviando(true);
    try {
      if (mode === "login") {
        const result = await login(emailLimpo, senha, manterConectado);
        if (result.erro) return setErro(result.erro);
        if (result.precisaConfirmar) return irPara("confirmar", "Confirme seu e-mail: enviamos um novo codigo.");
        if (result.precisaMfa) return irPara("mfa");
        navigate(redirectTo, { replace: true });
        return;
      }

      if (mode === "mfa") {
        const result = await confirmarMfa(codigo.trim());
        if (result.erro) return setErro(result.erro);
        navigate(redirectTo, { replace: true });
        return;
      }

      if (mode === "cadastro") {
        const result = await registrar(emailLimpo, senha, nome.trim());
        if (result.erro) return setErro(result.erro);
        if (result.precisaConfirmar) return irPara("confirmar", `Enviamos um codigo para ${emailLimpo}.`);
        return irPara("login", "Conta criada. Entre para continuar.");
      }

      if (mode === "confirmar") {
        const result = await confirmarCadastro(emailLimpo, codigo.trim());
        if (result.erro) return setErro(result.erro);
        // Logo apos o cadastro a senha ainda esta no formulario: entra direto.
        if (senha) {
          const entrada = await login(emailLimpo, senha, manterConectado);
          if (!entrada.erro && !entrada.precisaConfirmar) {
            navigate(redirectTo, { replace: true });
            return;
          }
        }
        setSenha("");
        return irPara("login", "E-mail confirmado. Entre com sua senha.");
      }

      if (mode === "recuperar") {
        const result = await recuperarSenha(emailLimpo);
        if (result.erro) return setErro(result.erro);
        setSenha("");
        return irPara("novaSenha", `Se ${emailLimpo} estiver cadastrado, voce recebera um codigo.`);
      }

      const result = await redefinirSenha(emailLimpo, codigo.trim(), senha);
      if (result.erro) return setErro(result.erro);
      setSenha("");
      irPara("login", "Senha alterada. Entre com a nova senha.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleReenviar() {
    setErro(null);
    const result = await reenviarCodigo(email.trim());
    if (result.erro) setErro(result.erro);
    else setSucesso("Codigo reenviado.");
  }

  return (
    <AuthLayout brand={brand} quote={quote} footer={footer}>
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-900">{current.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{current.subtitle}</p>
      </div>

      {!configurado ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          Configure VITE_COGNITO_USER_POOL_ID e VITE_COGNITO_CLIENT_ID no .env do frontend.
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

        {pedeEmail.includes(mode) ? (
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

        {pedeCodigo.includes(mode) ? (
          <div>
            <label htmlFor="codigo" className="mb-1.5 block text-sm font-medium text-slate-700">
              {texts.labels.codigo}
            </label>
            <input
              id="codigo"
              className={`${inputClass} tracking-[0.3em]`}
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={texts.placeholders.codigo}
            />
          </div>
        ) : null}

        {pedeSenha.includes(mode) ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="senha" className="block text-sm font-medium text-slate-700">
                {texts.labels.senha}
              </label>
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => irPara("recuperar")}
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
              onClick={() => irPara("cadastro")}
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
              onClick={() => irPara("login")}
            >
              {texts.cadastro.hasAccountAction}
            </button>
          </>
        ) : mode === "recuperar" ? (
          <button
            type="button"
            className="font-medium text-slate-900 underline-offset-4 hover:underline"
            onClick={() => irPara("login")}
          >
            {texts.recuperar.backAction}
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {mode === "confirmar" ? (
              <button
                type="button"
                className="font-medium text-slate-900 underline-offset-4 hover:underline"
                onClick={handleReenviar}
              >
                {texts.confirmar.resendAction}
              </button>
            ) : null}
            <button
              type="button"
              className="font-medium text-slate-500 underline-offset-4 hover:underline"
              onClick={() => irPara("login")}
            >
              {texts.recuperar.backAction}
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
