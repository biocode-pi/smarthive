import { Link } from "react-router-dom";
import { Contato, LegalLayout } from "../components/layout/LegalLayout";
import { legalConfig } from "../config/legal.config";

export function Privacidade() {
  return (
    <LegalLayout
      titulo="Política de Privacidade"
      resumo="Coletamos apenas o necessário para você usar o Smart Hive: nome e e-mail para a conta, telefone se você quiser informar, e os dados dos meliponários e colmeias que você cadastra. Não vendemos dados, não usamos anúncios nem rastreadores, e você pode pedir a exclusão das suas informações a qualquer momento."
    >
      <h2>1. Quem somos</h2>
      <p>
        O Smart Hive é uma plataforma de monitoramento de colmeias de abelhas nativas sem ferrão, desenvolvida como
        Projeto Integrador do curso de {legalConfig.curso} da {legalConfig.instituicao}. A equipe do projeto é a
        controladora dos dados pessoais tratados na plataforma, nos termos da Lei Geral de Proteção de Dados (Lei nº
        13.709/2018, LGPD).
      </p>

      <h2>2. Quais dados coletamos</h2>
      <h3>Dados da conta</h3>
      <ul>
        <li>
          <strong>Nome e e-mail</strong>, informados no cadastro.
        </li>
        <li>
          <strong>Telefone</strong>, opcional. Pode ser informado no cadastro ou em Configurações e removido a qualquer
          momento.
        </li>
        <li>
          <strong>Preferência de notificações por e-mail</strong>, com a data em que você aceitou e, se for o caso, a
          data em que desativou.
        </li>
        <li>
          <strong>Senha</strong>: fica sob guarda do serviço de autenticação (Amazon Cognito). A equipe não tem acesso a
          ela, nem em texto nem cifrada.
        </li>
        <li>
          <strong>Verificação em duas etapas</strong>: se você ativar, a chave do aplicativo autenticador também fica no
          Amazon Cognito.
        </li>
      </ul>
      <h3>Dados que você cadastra</h3>
      <ul>
        <li>Meliponários: nome, endereço, cidade e estado do local onde ficam as colmeias.</li>
        <li>Colmeias: nome, código, espécie, localização e descrição.</li>
        <li>Monitoramentos: data e hora, contagens de abelhas, observações e a indicação de possível invasor.</li>
        <li>
          Fotos e vídeos da entrada das colmeias. Evite registrar pessoas nessas imagens; se aparecerem, serão tratadas
          com as mesmas proteções dos demais dados.
        </li>
      </ul>
      <h3>Dados técnicos</h3>
      <ul>
        <li>
          <strong>Endereço IP</strong>: usado apenas para limitar o número de requisições por minuto e proteger a
          plataforma contra abuso. Fica só na memória do servidor por cerca de um minuto e não é gravado em banco.
        </li>
        <li>
          <strong>Registros do servidor</strong>: informações técnicas de funcionamento e de erros, mantidas por pouco
          tempo e usadas só para manutenção e segurança.
        </li>
        <li>
          <strong>Armazenamento do navegador</strong>: guardamos os dados da sua sessão para manter você conectado. Com a
          opção “Manter conectado” desmarcada, eles são apagados ao fechar o navegador.
        </li>
      </ul>
      <p>
        Não usamos cookies de publicidade, ferramentas de análise de comportamento nem rastreadores de terceiros. As
        fontes e os arquivos do site são servidos pela própria plataforma.
      </p>

      <h2>3. Para que usamos os dados</h2>
      <ul>
        <li>Criar e manter sua conta e permitir o acesso pela web e pelo aplicativo.</li>
        <li>Registrar, organizar e exibir o histórico das suas colmeias, os indicadores e os alertas.</li>
        <li>Estimar o nível de atividade das colmeias a partir dos registros enviados.</li>
        <li>Garantir a segurança da plataforma e investigar falhas.</li>
        <li>
          Enviar e-mails de serviço, como o código de confirmação do cadastro e o de recuperação de senha.
        </li>
        <li>
          Enviar avisos sobre alertas das suas colmeias, somente se você ativar as notificações por e-mail. Não enviamos
          e-mails de marketing.
        </li>
      </ul>

      <h2>4. Bases legais</h2>
      <ul>
        <li>
          <strong>Execução de contrato</strong> (art. 7º, V, da LGPD): para oferecer o serviço que você solicitou ao
          criar a conta.
        </li>
        <li>
          <strong>Consentimento</strong> (art. 7º, I): para as notificações por e-mail. Você pode revogar quando quiser
          em Configurações, sem afetar o restante do serviço.
        </li>
        <li>
          <strong>Legítimo interesse</strong> (art. 7º, IX): para a segurança da plataforma, como o limite de
          requisições e os registros técnicos.
        </li>
        <li>
          <strong>Estudos por órgão de pesquisa</strong> (art. 7º, IV): o uso dos dados em resultados acadêmicos do
          projeto acontece de forma agregada ou anonimizada, sem identificar você.
        </li>
      </ul>

      <h2>5. Com quem compartilhamos</h2>
      <p>
        Não vendemos nem cedemos seus dados. A plataforma funciona na infraestrutura da{" "}
        <strong>Amazon Web Services (AWS)</strong>, que atua como operadora: armazena e processa os dados apenas segundo
        nossas instruções. Os serviços usados são o Amazon Cognito (contas), o Amazon S3 (fotos, vídeos e backups), o
        Amazon EC2 (servidor e banco de dados) e o Amazon CloudFront (entrega do site).
      </p>
      <p>
        Esses serviços ficam na região da AWS no norte da Virgínia, nos Estados Unidos. Por isso há transferência
        internacional de dados, feita com as garantias contratuais da AWS, conforme o art. 33 da LGPD.
      </p>
      <p>Também podemos compartilhar dados quando houver obrigação legal ou ordem judicial.</p>

      <h2>6. Como protegemos</h2>
      <ul>
        <li>Toda a comunicação usa conexão criptografada (HTTPS).</li>
        <li>Os arquivos e os discos ficam criptografados no armazenamento.</li>
        <li>Cada conta só acessa as próprias colmeias, monitoramentos e mídias.</li>
        <li>Fotos e vídeos ficam em armazenamento privado e só abrem por links temporários.</li>
        <li>Você pode ativar a verificação em duas etapas em Configurações.</li>
      </ul>

      <h2>7. Por quanto tempo guardamos</h2>
      <ul>
        <li>Os dados da conta, dos meliponários e das colmeias ficam guardados enquanto a conta existir.</li>
        <li>
          Ao excluir um meliponário, as colmeias dele continuam cadastradas, apenas sem vínculo com o local.
        </li>
        <li>Quando você apaga uma colmeia, seus monitoramentos e alertas são apagados junto.</li>
        <li>
          As cópias de segurança do banco de dados são guardadas por até 30 dias e depois apagadas automaticamente.
        </li>
        <li>
          Ao excluir a conta, os dados saem da plataforma na hora. Cópias de segurança e versões antigas de fotos e
          vídeos são eliminadas automaticamente em até 30 dias.
        </li>
        <li>
          Por ser um projeto acadêmico, a plataforma pode ser encerrada ao fim do projeto. Nesse caso, avisaremos antes e
          os dados serão excluídos.
        </li>
      </ul>

      <h2>8. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode pedir a qualquer momento:</p>
      <ul>
        <li>confirmação de que tratamos seus dados e acesso a eles;</li>
        <li>correção de dados incompletos ou desatualizados (nome, telefone e preferências podem ser alterados direto em
          Configurações);</li>
        <li>revogação do consentimento para notificações, em Configurações;</li>
        <li>
          exclusão dos seus dados e da sua conta, que você mesmo pode fazer em Configurações, em “Excluir minha conta”;
        </li>
        <li>portabilidade dos dados para outro serviço;</li>
        <li>informações sobre com quem compartilhamos os dados.</li>
      </ul>
      <p>
        Para exercer esses direitos ou tirar dúvidas, fale com <Contato />. Respondemos em até 15 dias. Você também pode
        reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>

      <h2>9. Mudanças nesta política</h2>
      <p>
        Se esta política mudar de forma relevante, avisaremos na plataforma antes de a nova versão valer. Consulte
        também os <Link to="/termos" className="font-semibold text-hive-700 underline-offset-4 hover:underline">Termos de Uso</Link>.
      </p>
    </LegalLayout>
  );
}
