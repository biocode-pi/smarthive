import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, Phone, User } from "lucide-react";
import { FormEvent, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { authConfig } from "../config/auth.config";
import { useAuth } from "../context/AuthContext";
import { enviarPerfilPendente, guardarPerfilPendente, mascaraTelefone } from "../services/perfil";

type Mode = "login" | "mfa" | "cadastro" | "confirmar" | "recuperar" | "novaSenha";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mesma politica do User Pool do Cognito.
const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/** Campo no padrao do app: branco, cantos de 10px, sombra e icone a esquerda. */
function Campo({
  id,
  label,
  icone,
  acao,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; icone: ReactNode; acao?: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex h-[50px] items-center gap-4 rounded-field bg-white pl-4 pr-3 shadow-app focus-within:ring-2 focus-within:ring-ink">
        <span className="text-ink" aria-hidden="true">
          {icone}
        </span>
        <input
          id={id}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-slate-600 focus:outline-none"
          placeholder={label}
          {...props}
        />
        {acao}
      </div>
    </div>
  );
}

const botaoPrincipal =
  "focus-ring h-[50px] w-full rounded-field bg-hive-600 text-sm font-bold text-ink shadow-app transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";
const botaoSecundario =
  "focus-ring h-[50px] w-full rounded-field bg-white text-sm font-bold text-ink shadow-app transition hover:bg-honey-50";
const linkTexto = "focus-ring rounded font-bold text-ink underline underline-offset-4";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmarCadastro, confirmarMfa, configurado, login, recuperarSenha, redefinirSenha, reenviarCodigo, registrar } =
    useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [notificacoes, setNotificacoes] = useState(false);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [manterConectado, setManterConectado] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const { texts, footer } = authConfig;
  const current = texts[mode];
  const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/app";

  function validar(): string | null {
    const emailLimpo = email.trim();
    if (["login", "cadastro", "recuperar"].includes(mode) && !emailRegex.test(emailLimpo)) {
      return "Informe um e-mail válido. Exemplo: nome@dominio.com";
    }
    if (mode === "cadastro" && nome.trim().length < 2) return "Informe seu nome completo.";
    if (mode === "login" && !senha) return "Informe sua senha.";
    if ((mode === "cadastro" || mode === "novaSenha") && !senhaForteRegex.test(senha)) {
      return "A senha precisa ter 8 caracteres, com letra maiúscula, minúscula e número.";
    }
    if (mode === "cadastro" && senha !== confirmacao) return "As senhas não conferem.";
    if (mode === "cadastro" && telefone && telefone.replace(/\D/g, "").length < 10) {
      return "Informe o telefone com DDD, por exemplo (11) 91234-5678.";
    }
    if (mode === "cadastro" && !aceiteTermos) return "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.";
    if (["mfa", "confirmar", "novaSenha"].includes(mode) && !/^\d{6}$/.test(codigo.trim())) {
      return "Informe o código de 6 dígitos.";
    }
    return null;
  }

  function irPara(next: Mode, mensagem: string | null = null) {
    setMode(next);
    setErro(null);
    setSucesso(mensagem);
    setCodigo("");
  }

  async function entrarNaPlataforma(emailLimpo: string) {
    await enviarPerfilPendente(emailLimpo);
    navigate(redirectTo, { replace: true });
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
        if (result.precisaConfirmar) return irPara("confirmar", "Confirme seu e-mail: enviamos um novo código.");
        if (result.precisaMfa) return irPara("mfa");
        return entrarNaPlataforma(emailLimpo);
      }

      if (mode === "mfa") {
        const result = await confirmarMfa(codigo.trim());
        if (result.erro) return setErro(result.erro);
        return entrarNaPlataforma(emailLimpo);
      }

      if (mode === "cadastro") {
        const result = await registrar(emailLimpo, senha, nome.trim());
        if (result.erro) return setErro(result.erro);
        guardarPerfilPendente({ email: emailLimpo, telefone: telefone || null, notificacoes_email: notificacoes });
        if (result.precisaConfirmar) return irPara("confirmar", `Enviamos um código para ${emailLimpo}.`);
        return irPara("login", "Conta criada. Entre para continuar.");
      }

      if (mode === "confirmar") {
        const result = await confirmarCadastro(emailLimpo, codigo.trim());
        if (result.erro) return setErro(result.erro);
        // Logo apos o cadastro a senha ainda esta no formulario: entra direto.
        if (senha) {
          const entrada = await login(emailLimpo, senha, manterConectado);
          if (!entrada.erro && !entrada.precisaConfirmar && !entrada.precisaMfa) return entrarNaPlataforma(emailLimpo);
        }
        setSenha("");
        return irPara("login", "E-mail confirmado. Entre com sua senha.");
      }

      if (mode === "recuperar") {
        const result = await recuperarSenha(emailLimpo);
        if (result.erro) return setErro(result.erro);
        setSenha("");
        return irPara("novaSenha", `Se ${emailLimpo} estiver cadastrado, você receberá um código.`);
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
    else setSucesso("Código reenviado.");
  }

  const botaoOlho = (
    <button
      type="button"
      onClick={() => setMostrarSenha((valor) => !valor)}
      className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink"
      aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
    >
      {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );

  return (
    <AuthLayout footer={footer} comMarca={mode === "login"}>
      {mode !== "login" ? (
        <div className="mb-6">
          <button type="button" onClick={() => irPara("login")} className="focus-ring inline-flex items-center gap-1 rounded text-sm font-bold">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Entrar
          </button>
          <h1 className="mt-3 text-3xl font-bold">{current.title}</h1>
          <p className="mt-2 text-sm">{current.subtitle}</p>
        </div>
      ) : (
        // No celular a marca grande ja identifica a tela; no computador o formulario ganha titulo.
        <div className="mb-6">
          <h1 className="sr-only lg:not-sr-only lg:text-3xl lg:font-bold">Entrar</h1>
          <p className="hidden text-sm lg:mt-2 lg:block">{texts.login.subtitle}</p>
        </div>
      )}

      {!configurado ? (
        <p className="mb-4 rounded-field bg-white px-4 py-3 text-sm font-bold shadow-app">
          Login não configurado: defina VITE_COGNITO_USER_POOL_ID e VITE_COGNITO_CLIENT_ID.
        </p>
      ) : null}

      {erro ? (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-field bg-white px-4 py-3 text-sm font-bold text-status-risco-texto shadow-app">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {erro}
        </p>
      ) : null}

      {sucesso ? (
        <p role="status" className="mb-4 rounded-field bg-white px-4 py-3 text-sm font-bold text-status-ativa-texto shadow-app">
          {sucesso}
        </p>
      ) : null}

      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
        {mode === "cadastro" ? (
          <Campo id="nome" label="Nome completo" icone={<User className="h-5 w-5" />} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
        ) : null}

        {["login", "cadastro", "recuperar"].includes(mode) ? (
          <Campo id="email" type="email" label="E-mail" icone={<Mail className="h-5 w-5" />} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        ) : null}

        {["mfa", "confirmar", "novaSenha"].includes(mode) ? (
          <Campo
            id="codigo"
            label="Código de 6 dígitos"
            icone={<KeyRound className="h-5 w-5" />}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="tracking-[0.3em]"
          />
        ) : null}

        {["login", "cadastro", "novaSenha"].includes(mode) ? (
          <Campo
            id="senha"
            type={mostrarSenha ? "text" : "password"}
            label={mode === "novaSenha" ? "Nova senha" : "Senha"}
            icone={<Lock className="h-5 w-5" />}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            acao={botaoOlho}
          />
        ) : null}

        {mode === "cadastro" ? (
          <>
            <Campo
              id="confirmacao"
              type={mostrarSenha ? "text" : "password"}
              label="Confirmar senha"
              icone={<Lock className="h-5 w-5" />}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="new-password"
            />
            <p className="px-1 text-xs">Mínimo de 8 caracteres, com letra maiúscula, minúscula e número.</p>
            <Campo
              id="telefone"
              type="tel"
              label="Telefone (opcional)"
              icone={<Phone className="h-5 w-5" />}
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              autoComplete="tel-national"
              inputMode="tel"
            />
            <label className="flex items-start gap-3 px-1 pt-2 text-sm">
              <input type="checkbox" className="mt-0.5 h-5 w-5 flex-shrink-0 accent-ink" checked={notificacoes} onChange={(e) => setNotificacoes(e.target.checked)} />
              <span>Desejo receber notificações no meu e-mail. Você pode desativar quando quiser em Configurações.</span>
            </label>
            <label className="flex items-start gap-3 px-1 text-sm">
              <input type="checkbox" className="mt-0.5 h-5 w-5 flex-shrink-0 accent-ink" checked={aceiteTermos} onChange={(e) => setAceiteTermos(e.target.checked)} />
              <span>
                Li e aceito os{" "}
                <Link to="/termos" target="_blank" className={linkTexto}>
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link to="/privacidade" target="_blank" className={linkTexto}>
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>
          </>
        ) : null}

        {mode === "login" ? (
          <div className="flex items-center justify-between px-1 pt-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-ink" checked={manterConectado} onChange={(e) => setManterConectado(e.target.checked)} />
              Manter conectado
            </label>
            <button type="button" onClick={() => irPara("recuperar")} className={linkTexto}>
              Esqueci minha senha
            </button>
          </div>
        ) : null}

        <div className="pt-3">
          <button type="submit" disabled={enviando || !configurado} className={botaoPrincipal}>
            {enviando ? "Aguarde..." : mode === "cadastro" ? "Registrar-se" : current.submit}
          </button>
        </div>
      </form>

      {mode === "login" ? (
        <>
          <p className="my-4 text-center text-sm font-bold">ou</p>
          <button type="button" onClick={() => irPara("cadastro")} className={botaoSecundario}>
            Registrar-se
          </button>
        </>
      ) : null}

      {mode === "confirmar" ? (
        <button type="button" onClick={handleReenviar} className={`${linkTexto} mx-auto mt-5 block text-sm`}>
          Reenviar código
        </button>
      ) : null}
    </AuthLayout>
  );
}
