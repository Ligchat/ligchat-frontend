import React, { useState, useEffect } from 'react';
import { Button, Input, Layout, Form, Tabs, Typography, Spin, message, Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../assets/images/Logo.png';
import { SendVerificationCodeRequestDTO, VerifyCodeRequestDTO } from '../interfaces/AuthInterface';
import { sendVerificationCode, verifyCode } from '../services/AuthService';
import SessionService from '../services/SessionService';

const { Content } = Layout;
const { TabPane } = Tabs;
const { Text } = Typography;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isCodeValid, setIsCodeValid] = useState(true);
  const [isFormValid, setIsFormValid] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [timer, setTimer] = useState(0);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.disconnected) {
      setIsModalVisible(true);
    }
  }, [location.state]);

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  // Função para validar o formato de email
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setIsEmailValid(isValid);
    setIsFormValid(isValid && value.trim() !== '');
  };

  // Validação do código de acesso
  const validateCode = (value: string) => {
    setIsCodeValid(value.length === 6);
  };

  // Função de envio de email com mensagem de erro no formulário
  const handleSendEmail = async () => {
    if (isFormValid) {
      setLoadingEmail(true);
      try {
        const requestData: SendVerificationCodeRequestDTO = {
          email,
          phoneNumber: '',
        };
        await sendVerificationCode(requestData);
        setActiveTab('2');
      } catch (error: any) {
        console.error('Erro ao enviar código de verificação:', error);
        if (error.response && error.response.status === 404) {
          setIsEmailValid(false);
        } else {
          setIsEmailValid(false);
        }
      } finally {
        setLoadingEmail(false);
      }
    }
  };

  // Função de envio de código
  const handleSendCode = async () => {
    if (isCodeValid) {
      setLoadingCode(true);
      try {
        const requestData: VerifyCodeRequestDTO = {
          email,
          code,
        };
        await verifyCode(requestData);
        navigate('/dashboard');
      } catch (error) {
        console.error('Erro ao verificar código:', error);
        setIsCodeValid(false);
      } finally {
        setLoadingCode(false);
      }
    }
  };

  useEffect(() => {
    const token = SessionService.getSession('authToken');
    if (token) {
      navigate('/dashboard');
    }
  }, []);

  const handleResendCode = () => {
    setTimer(30);
  };

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  return (
    <Layout className="layout">
      <Content
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100vh',
          padding: '0 50px',
          flexDirection: 'row',
        }}
      >
        {/* Modal para Sessão Expirada */}
        <Modal
          title="Sessão Expirada"
          visible={isModalVisible}
          onCancel={handleCloseModal}
          footer={[
            <Button key="close" type="primary" onClick={handleCloseModal}>
              Fechar
            </Button>,
          ]}
          centered
        >
          <p>Efetue o login novamente.</p>
        </Modal>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={Logo} alt="LigChat Logo" style={{ maxWidth: '150px', minWidth: '150px', maxHeight: 150, minHeight: 150 }} />
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <Tabs activeKey={activeTab} centered>
              <TabPane tab="Email ou número" key="1">
                <Form layout="vertical" onFinish={handleSendEmail}>
                  <Form.Item
                    validateStatus={!isEmailValid ? 'error' : ''}
                    help={!isEmailValid ? 'E-mail não encontrado' : ''}
                  >
                    <Input
                      value={email}
                      onChange={(e: any) => {
                        setEmail(e.target.value);
                        validateEmail(e.target.value);
                        setIsEmailValid(true);
                      }}
                      placeholder="Email ou Número com DDD"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      style={{ marginTop: 5 }}
                      type="primary"
                      htmlType="submit"
                      block
                      disabled={!isFormValid || loadingEmail}
                    >
                      {loadingEmail ? <Spin size="small" /> : 'Enviar'}
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab="Código de acesso" key="2" disabled={activeTab === '1'}>
                <Form layout="vertical" onFinish={handleSendCode}>
                  <Form.Item
                    validateStatus={!isCodeValid ? 'error' : ''}
                    help={!isCodeValid ? 'Código inválido.' : ''}
                  >
                    <Input
                      value={code}
                      onChange={(e: any) => {
                        setCode(e.target.value);
                        validateCode(e.target.value);
                      }}
                      placeholder="Digite o código recebido"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      disabled={!isCodeValid || loadingCode}
                    >
                      {loadingCode ? <Spin size="small" /> : 'Enviar'}
                    </Button>
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    {timer > 0 ? (
                      <Text type="secondary">Aguarde {timer} segundos para reenviar o código</Text>
                    ) : (
                      <Button
                        type="link"
                        onClick={handleResendCode}
                        style={{
                          padding: 0,
                          float: 'right',
                        }}
                      >
                        Reenviar código
                      </Button>
                    )}
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginScreen;
