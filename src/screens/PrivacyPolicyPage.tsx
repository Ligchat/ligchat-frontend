import React from 'react';
import '../styles/PrivacyPolicyPage.css';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="privacy-policy-layout">
      <main className="privacy-policy-content">
        <h1 className="privacy-policy-title">Política de Privacidade</h1>
        <p className="privacy-policy-paragraph">
          <strong>Última atualização:</strong> 17/10/2024
        </p>

        <p className="privacy-policy-paragraph">
          Bem-vindo à nossa plataforma SaaS. Sua privacidade é importante para nós. Esta Política de Privacidade
          descreve como coletamos, usamos, compartilhamos e protegemos suas informações pessoais.
        </p>

        <hr className="privacy-policy-divider" />

        <h2 className="privacy-policy-title">1. Informações que Coletamos</h2>
        <div className="privacy-policy-paragraph">
          <ul className="privacy-policy-list">
            <li>
              <strong>Dados de Registro:</strong> Nome, endereço de e-mail, número de telefone e outras informações
              necessárias para criar sua conta.
            </li>
            <li>
              <strong>Informações de Uso:</strong> Dados sobre como você utiliza a plataforma, incluindo interações e
              preferências.
            </li>
            <li>
              <strong>Informações do Dispositivo:</strong> Endereço IP, tipo de navegador, sistema operacional e
              identificadores do dispositivo.
            </li>
            <li>
              <strong>Cookies e Tecnologias Semelhantes:</strong> Utilizamos cookies para melhorar a experiência do
              usuário e personalizar conteúdo.
            </li>
          </ul>
        </div>

        <hr className="privacy-policy-divider" />

        <h2 className="privacy-policy-title">2. Como Usamos suas Informações</h2>
        <div className="privacy-policy-paragraph">
          <ul className="privacy-policy-list">
            <li>
              <strong>Fornecimento de Serviços:</strong> Para operar e manter a plataforma.
            </li>
            <li>
              <strong>Comunicações:</strong> Enviar notificações, atualizações e suporte ao cliente.
            </li>
            <li>
              <strong>Personalização:</strong> Adaptar a plataforma às suas preferências.
            </li>
            <li>
              <strong>Análises e Melhorias:</strong> Monitorar e analisar tendências e atividades para melhorar nossos
              serviços.
            </li>
          </ul>
        </div>

        <hr className="privacy-policy-divider" />

        <h2 className="privacy-policy-title">3. Compartilhamento de Informações</h2>
        <div className="privacy-policy-paragraph">
          <ul className="privacy-policy-list">
            <li>
              <strong>Com Terceiros de Confiança:</strong> Prestadores de serviços que auxiliam na operação da
              plataforma, sob acordos de confidencialidade.
            </li>
            <li>
              <strong>Conformidade Legal:</strong> Quando exigido por lei ou para proteger nossos direitos.
            </li>
            <li>
              <strong>Transferências de Negócios:</strong> Em caso de fusão, aquisição ou venda de ativos.
            </li>
          </ul>
        </div>

        <hr className="privacy-policy-divider" />

        <h2 className="privacy-policy-title">4. Segurança dos Dados</h2>
        <p className="privacy-policy-paragraph">
          Implementamos medidas de segurança adequadas para proteger suas informações contra acesso não autorizado,
          alteração, divulgação ou destruição. Utilizamos protocolos seguros de comunicação e armazenamento, além de
          controles de acesso restrito às informações pessoais.
        </p>

        <hr className="privacy-policy-divider" />

        <h2 className="privacy-policy-title">5. Seus Direitos</h2>
        <div className="privacy-policy-paragraph">
          <ul className="privacy-policy-list">
            <li>
              <strong>Acesso e Correção:</strong> Você pode acessar e atualizar suas informações pessoais a qualquer
              momento através das configurações da sua conta.
            </li>
            <li>
              <strong>Exclusão:</strong> Solicitar a exclusão de suas informações pessoais, sujeito a obrigações legais.
            </li>
            <li>
              <strong>Opt-out:</strong> Escolher não receber comunicações promocionais seguindo as instruções em tais
              mensagens.
            </li>
          </ul>
        </div>

        <hr className="privacy-policy-divider" />

        <h2 className="privacy-policy-title">6. Alterações nesta Política</h2>
        <p className="privacy-policy-paragraph">
          Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos sobre quaisquer alterações
          publicando a nova política nesta página e atualizando a data de "Última atualização" no topo. Recomendamos que
          você revise esta política regularmente para se manter informado sobre como protegemos suas informações.
        </p>

        <hr className="privacy-policy-divider" />

        <h2 className="privacy-policy-title">7. Contato</h2>
        <p className="privacy-policy-paragraph">
          Se tiver dúvidas ou preocupações sobre esta Política de Privacidade, entre em contato conosco através dos meios
          disponíveis em nossa plataforma.
        </p>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
