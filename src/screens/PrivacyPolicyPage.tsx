import React from 'react';
import { Layout, Typography } from 'antd';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const PrivacyPolicyPage: React.FC = () => {
  return (
    <Layout className="layout">
      <Content style={{ padding: '50px', maxWidth: '800px', margin: '0 auto' }}>
        <Title level={2}>Política de Privacidade</Title>
        <Paragraph>
          <strong>Última atualização:</strong> 17/10/2024
        </Paragraph>

        <Paragraph>
          Bem-vindo à nossa plataforma SaaS. Sua privacidade é importante para nós. Esta Política de Privacidade
          descreve como coletamos, usamos, compartilhamos e protegemos suas informações pessoais.
        </Paragraph>

        <Title level={3}>1. Informações que Coletamos</Title>
        <Paragraph>
          <ul>
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
        </Paragraph>

        <Title level={3}>2. Como Usamos suas Informações</Title>
        <Paragraph>
          <ul>
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
        </Paragraph>

        <Title level={3}>3. Compartilhamento de Informações</Title>
        <Paragraph>
          <ul>
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
        </Paragraph>

        <Title level={3}>4. Segurança dos Dados</Title>
        <Paragraph>
          Implementamos medidas de segurança adequadas para proteger suas informações contra acesso não autorizado,
          alteração, divulgação ou destruição. Utilizamos protocolos seguros de comunicação e armazenamento, além de
          controles de acesso restrito às informações pessoais.
        </Paragraph>

        <Title level={3}>5. Seus Direitos</Title>
        <Paragraph>
          <ul>
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
        </Paragraph>

        <Title level={3}>6. Retenção de Dados</Title>
        <Paragraph>
          Manteremos suas informações pelo tempo necessário para cumprir os propósitos descritos nesta política, a menos
          que um período de retenção mais longo seja exigido ou permitido por lei. Ao final deste período, as informações
          serão excluídas ou anonimizadas de forma segura.
        </Paragraph>

        <Title level={3}>7. Transferência Internacional de Dados</Title>
        <Paragraph>
          Suas informações podem ser transferidas e mantidas em servidores localizados fora do seu estado, província ou
          país, onde as leis de proteção de dados podem ser diferentes das de sua jurisdição. Tomamos medidas para
          assegurar que suas informações sejam tratadas de forma segura e de acordo com esta política.
        </Paragraph>

        <Title level={3}>8. Sites de Terceiros</Title>
        <Paragraph>
          Nossa plataforma pode conter links para outros sites que não são operados por nós. Não nos responsabilizamos
          pelo conteúdo ou práticas de privacidade de sites de terceiros. Recomendamos que você revise a política de
          privacidade de cada site que visitar.
        </Paragraph>

        <Title level={3}>9. Privacidade de Menores</Title>
        <Paragraph>
          Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente informações pessoais
          de menores. Se você é pai ou responsável e sabe que seu filho nos forneceu informações pessoais, entre em
          contato conosco para que possamos tomar as medidas necessárias.
        </Paragraph>

        <Title level={3}>10. Alterações nesta Política</Title>
        <Paragraph>
          Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos sobre quaisquer alterações
          publicando a nova política nesta página e atualizando a data de "Última atualização" no topo. Recomendamos que
          você revise esta política regularmente para se manter informado sobre como protegemos suas informações.
        </Paragraph>

        <Title level={3}>11. Contato</Title>
        <Paragraph>
          Se tiver dúvidas ou preocupações sobre esta Política de Privacidade, entre em contato conosco através dos meios
          disponíveis em nossa plataforma.
        </Paragraph>
      </Content>
    </Layout>
  );
};

export default PrivacyPolicyPage;
