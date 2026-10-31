import { Link } from "react-router-dom";
import { Contato, LegalLayout } from "../components/layout/LegalLayout";
import { legalConfig } from "../config/legal.config";

export function Termos() {
  return (
    <LegalLayout
      titulo="Termos de Uso"
      resumo="O SmartHive é um projeto acadêmico gratuito para acompanhar colmeias de abelhas nativas. Ao criar uma conta, você concorda em usá-lo de forma responsável e entende que a plataforma é oferecida sem garantia de funcionamento contínuo."
    >
      <h2>1. Sobre o serviço</h2>
      <p>
        O SmartHive é uma plataforma de monitoramento de colmeias de abelhas nativas sem ferrão, desenvolvida como
        Projeto Integrador do curso de {legalConfig.curso} da {legalConfig.instituicao}. Permite cadastrar colmeias,
        registrar capturas de fotos e vídeos, acompanhar indicadores de atividade e receber alertas.
      </p>
      <p>O uso é gratuito e tem finalidade educacional e de pesquisa.</p>

      <h2>2. Aceite</h2>
      <p>
        Ao criar uma conta ou usar a plataforma, você declara que leu e concorda com estes Termos e com a{" "}
        <Link to="/privacidade" className="font-semibold text-hive-700 underline-offset-4 hover:underline">
          Política de Privacidade
        </Link>
        . Se não concordar, não use o serviço.
      </p>

      <h2>3. Sua conta</h2>
      <ul>
        <li>Informe um e-mail válido. Ele é usado para confirmar o cadastro e recuperar a senha.</li>
        <li>Mantenha sua senha em segredo. Recomendamos ativar a verificação em duas etapas em Configurações.</li>
        <li>Você é responsável pelas ações feitas com a sua conta.</li>
        <li>Se suspeitar de acesso indevido, troque a senha e avise a equipe.</li>
      </ul>

      <h2>4. Uso adequado</h2>
      <p>Ao usar o SmartHive, você se compromete a não:</p>
      <ul>
        <li>tentar acessar dados de outras contas ou burlar os mecanismos de segurança;</li>
        <li>enviar arquivos com vírus, conteúdo ilegal ou que não tenha relação com o monitoramento das colmeias;</li>
        <li>sobrecarregar a plataforma com requisições automatizadas;</li>
        <li>registrar imagens de pessoas sem autorização delas.</li>
      </ul>
      <p>Contas que violarem estas regras podem ser suspensas ou excluídas.</p>

      <h2>5. Seus conteúdos</h2>
      <p>
        Os dados, fotos e vídeos que você envia continuam sendo seus. Você nos autoriza a armazená-los e processá-los
        apenas para oferecer o serviço, como descrito na Política de Privacidade. Resultados acadêmicos do projeto usam
        apenas dados agregados ou anonimizados.
      </p>

      <h2>6. Limitações</h2>
      <ul>
        <li>
          As estimativas de atividade e os alertas são <strong>experimentais</strong> e servem de apoio. Eles não
          substituem a observação do meliponicultor nem a orientação de um profissional.
        </li>
        <li>
          Por ser um projeto acadêmico, a plataforma pode ficar indisponível, mudar ou ser encerrada. Faremos o possível
          para avisar com antecedência.
        </li>
        <li>
          Fazemos cópias de segurança diárias, mas não garantimos que nenhum dado será perdido. Mantenha seus próprios
          registros importantes.
        </li>
      </ul>

      <h2>7. Encerramento da conta</h2>
      <p>
        Você pode pedir a exclusão da sua conta e dos seus dados a qualquer momento falando com <Contato />.
      </p>

      <h2>8. Alterações nestes termos</h2>
      <p>
        Se estes Termos mudarem de forma relevante, avisaremos na plataforma antes de a nova versão valer. Continuar
        usando o serviço depois disso significa concordar com a nova versão.
      </p>

      <h2>9. Lei aplicável</h2>
      <p>Estes Termos seguem as leis do Brasil, incluindo a LGPD e o Marco Civil da Internet (Lei nº 12.965/2014).</p>
    </LegalLayout>
  );
}
