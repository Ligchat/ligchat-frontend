import React from 'react';
import { Layout, Typography, Divider } from 'antd';
import '../styles/TermsOfUsePage.css'; // Importar o CSS

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const TermsOfUsePage: React.FC = () => {
  return (
    <Layout className="terms-of-use-layout">
      <Content className="terms-of-use-content">
        <Title level={2} className="terms-of-use-title">Termos de Uso</Title>
        <Paragraph className="terms-of-use-paragraph">
          <strong>Última atualização:</strong> 17/10/2024
        </Paragraph>

        <Paragraph className="terms-of-use-paragraph">
          Ao acessar ou usar nossa plataforma SaaS, você concorda em cumprir estes Termos de Uso. Leia atentamente antes
          de utilizar nossos serviços.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">1. Aceitação dos Termos</Title>
        <Paragraph className="terms-of-use-paragraph">
          Ao criar uma conta ou utilizar a plataforma, você aceita e concorda em cumprir estes termos e todas as leis e
          regulamentos aplicáveis. Se você não concorda com estes termos, não utilize a plataforma.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">2. Elegibilidade</Title>
        <Paragraph className="terms-of-use-paragraph">
          Você deve ter pelo menos 18 anos para utilizar nossos serviços. Ao aceitar estes termos, você declara que tem a
          idade legal para firmar um contrato vinculativo e não está impedido de usar os serviços de acordo com as leis
          aplicáveis.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">3. Uso da Plataforma</Title>
        <Paragraph className="terms-of-use-paragraph">
          <ul className="terms-of-use-list">
            <li>
              <strong>Conta de Usuário:</strong> Você é responsável por manter a confidencialidade das informações da sua
              conta e por todas as atividades que ocorram sob sua conta. Notifique-nos imediatamente sobre qualquer uso
              não autorizado.
            </li>
            <li>
              <strong>Conduta do Usuário:</strong> Concorda em não utilizar a plataforma para qualquer finalidade ilegal
              ou não autorizada, incluindo, mas não limitado a, violação de direitos de propriedade intelectual ou envio
              de conteúdo ilícito.
            </li>
            <li>
              <strong>Licença de Uso:</strong> Concedemos a você uma licença limitada, não exclusiva e intransferível
              para acessar e usar a plataforma de acordo com estes termos.
            </li>
          </ul>
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">4. Propriedade Intelectual</Title>
        <Paragraph className="terms-of-use-paragraph">
          Todos os direitos, títulos e interesses relacionados à plataforma, incluindo conteúdos, são de nossa propriedade
          ou de nossos licenciadores e são protegidos por leis de propriedade intelectual. Você não deve reproduzir,
          distribuir ou criar obras derivadas sem nossa permissão expressa.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">5. Taxas e Pagamentos</Title>
        <Paragraph className="terms-of-use-paragraph">
          <ul className="terms-of-use-list">
            <li>
              <strong>Assinaturas:</strong> Alguns serviços podem exigir pagamento de taxas de assinatura. Os detalhes
              das taxas e planos serão fornecidos no momento da compra.
            </li>
            <li>
              <strong>Política de Reembolso:</strong> Consulte nossa política de reembolso para informações sobre
              cancelamentos e reembolsos. Taxas pagas não são reembolsáveis, exceto conforme exigido por lei.
            </li>
          </ul>
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">6. Rescisão</Title>
        <Paragraph className="terms-of-use-paragraph">
          Reservamo-nos o direito de suspender ou encerrar seu acesso à plataforma a qualquer momento, sem aviso prévio,
          se você violar estes Termos de Uso ou se envolver em conduta que considerarmos prejudicial.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">7. Isenção de Garantias</Title>
        <Paragraph className="terms-of-use-paragraph">
          A plataforma é fornecida "como está" e "conforme disponível". Não garantimos que os serviços serão
          ininterruptos, seguros ou livres de erros. Na máxima extensão permitida por lei, isentamo-nos de todas as
          garantias, expressas ou implícitas.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">8. Limitação de Responsabilidade</Title>
        <Paragraph className="terms-of-use-paragraph">
          Em nenhum caso seremos responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou
          punitivos decorrentes ou relacionados ao uso ou incapacidade de uso da plataforma, mesmo que tenhamos sido
          avisados da possibilidade de tais danos.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">9. Indenização</Title>
        <Paragraph className="terms-of-use-paragraph">
          Você concorda em nos indenizar e isentar de quaisquer reivindicações, danos, perdas ou despesas (incluindo
          honorários advocatícios razoáveis) decorrentes de sua violação destes termos ou de atividades relacionadas à
          sua conta.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">10. Alterações nos Termos</Title>
        <Paragraph className="terms-of-use-paragraph">
          Podemos modificar estes Termos de Uso a qualquer momento. Notificaremos sobre quaisquer mudanças significativas
          publicando os novos termos nesta página e atualizando a data de "Última atualização". Seu uso contínuo da
          plataforma após tais alterações constitui aceitação dos novos termos.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">11. Lei Aplicável e Jurisdição</Title>
        <Paragraph className="terms-of-use-paragraph">
          Estes termos serão regidos e interpretados de acordo com as leis do [Seu País/Estado], sem consideração aos
          seus conflitos de princípios legais. Você concorda que qualquer disputa será resolvida nos tribunais
          competentes dessa jurisdição.
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">12. Disposições Gerais</Title>
        <Paragraph className="terms-of-use-paragraph">
          <ul className="terms-of-use-list">
            <li>
              <strong>Acordo Integral:</strong> Estes termos constituem o acordo integral entre você e nós em relação ao
              uso da plataforma, substituindo quaisquer acordos anteriores.
            </li>
            <li>
              <strong>Renúncia e Divisibilidade:</strong> Nossa falha em aplicar qualquer direito ou disposição destes
              termos não constituirá renúncia de tal direito ou disposição. Se qualquer disposição destes termos for
              considerada inválida, as demais disposições permanecerão em vigor.
            </li>
          </ul>
        </Paragraph>

        <Divider />

        <Title level={3} className="terms-of-use-title">13. Contato</Title>
        <Paragraph className="terms-of-use-paragraph">
          Para perguntas ou preocupações sobre estes Termos de Uso, entre em contato conosco através dos meios
          disponíveis em nossa plataforma.
        </Paragraph>
      </Content>
    </Layout>
  );
};

export default TermsOfUsePage;
