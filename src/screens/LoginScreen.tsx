import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Logo from '../assets/images/Logo.png';
import { SendVerificationCodeRequestDTO, VerifyCodeRequestDTO } from '../interfaces/AuthInterface';
import { sendVerificationCode, verifyCode } from '../services/AuthService';
import SessionService from '../services/SessionService';
import '../styles/LoginScreen/LoginScreen.css';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isCodeValid, setIsCodeValid] = useState(true);
  const [isFormValid, setIsFormValid] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [timer, setTimer] = useState(0);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setIsEmailValid(isValid);
    setIsFormValid(isValid && value.trim() !== '');
  };

  const validateCode = (value: string) => {
    setIsCodeValid(value.length === 6);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      setLoadingEmail(true);
      try {
        const requestData: SendVerificationCodeRequestDTO = {
          email,
          phoneNumber: '',
        };
        await sendVerificationCode(requestData);
        setActiveTab('code');
      } catch (error: any) {
        console.error('Erro ao enviar código de verificação:', error);
        setIsEmailValid(false);
        setErrorMessage('E-mail não encontrado');
      } finally {
        setLoadingEmail(false);
      }
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setErrorMessage('Código inválido');
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
    const requestData: SendVerificationCodeRequestDTO = {
      email,
      phoneNumber: '',
    };
    sendVerificationCode(requestData).catch(error => {
      console.error('Erro ao reenviar código:', error);
    });
  };

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  return (
    <div className="loginScreen-layout">
      <div className="loginScreen-sidebar">
        <div className="loginScreen-sidebarContent">
          <div className="loginScreen-brandSection">
            <h1>LigChat</h1>
            <h2>Plataforma de comunicação empresarial</h2>
          </div>
          
          <div className="loginScreen-features">
            <div className="loginScreen-feature">
              <div className="loginScreen-featureIcon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M5.636 4.636a9 9 0 0 1 0 12.728M4.343 3.343a11 11 0 0 1 0 15.314M7.05 6.05a7 7 0 0 1 0 9.9M18.364 4.636a9 9 0 0 0 0 12.728M19.657 3.343a11 11 0 0 0 0 15.314M16.95 6.05a7 7 0 0 0 0 9.9M8 12h8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="loginScreen-featureText">
                <h3>Velocidade em Comunicação</h3>
                <p>Respostas instantâneas e integração multicanal para atendimento ágil e eficiente</p>
              </div>
            </div>
            
            <div className="loginScreen-feature">
              <div className="loginScreen-featureIcon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="loginScreen-featureText">
                <h3>Segurança Avançada</h3>
                <p>Proteção de dados com criptografia de ponta a ponta e conformidade com LGPD</p>
              </div>
            </div>
            
            <div className="loginScreen-feature">
              <div className="loginScreen-featureIcon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                </svg>
              </div>
              <div className="loginScreen-featureText">
                <h3>Resultados Mensuráveis</h3>
                <p>Aumento de conversão, redução de custos e melhoria na satisfação do cliente</p>
              </div>
            </div>
          </div>
          
          <div className="loginScreen-statsSection">
            <div className="loginScreen-stat">
              <span className="loginScreen-statNumber">+60%</span>
              <span className="loginScreen-statLabel">Aumento em conversões</span>
            </div>
            <div className="loginScreen-stat">
              <span className="loginScreen-statNumber">-40%</span>
              <span className="loginScreen-statLabel">Redução de custos</span>
            </div>
            <div className="loginScreen-stat">
              <span className="loginScreen-statNumber">+85%</span>
              <span className="loginScreen-statLabel">Satisfação do cliente</span>
            </div>
          </div>
        </div>
      </div>

      <div className="loginScreen-content">
        {isModalVisible && (
          <div className="loginScreen-modal">
            <div className="loginScreen-modalContent">
              <h2>Sessão Expirada</h2>
              <p>Efetue o login novamente.</p>
              <button 
                className="loginScreen-button loginScreen-primaryButton" 
                onClick={handleCloseModal}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <div className="loginScreen-formContainer">
          <div className="loginScreen-logoContainer">
            <img
              src={Logo}
              alt="LigChat Logo"
              className="loginScreen-logo"
            />
          </div>
          
          <div className="loginScreen-welcomeText">
            <h2>Acesso à Plataforma</h2>
            <p>Entre com suas credenciais para acessar o sistema</p>
          </div>

          <div className="loginScreen-formWrapper">
            <div className="loginScreen-tabs">
              <button 
                className={`loginScreen-tab ${activeTab === 'email' ? 'loginScreen-activeTab' : ''}`}
                onClick={() => activeTab === 'email' && setActiveTab('email')}
              >
                Email
              </button>
              <button 
                className={`loginScreen-tab ${activeTab === 'code' ? 'loginScreen-activeTab' : ''}`}
                disabled={activeTab === 'email'}
              >
                Código de acesso
              </button>
            </div>

            {activeTab === 'email' ? (
              <form className="loginScreen-form" onSubmit={handleSendEmail}>
                <div className="loginScreen-formItem">
                  <label className="loginScreen-label">Email</label>
                  <input
                    className={`loginScreen-input ${!isEmailValid ? 'loginScreen-inputError' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateEmail(e.target.value);
                      setIsEmailValid(true);
                    }}
                    placeholder="Seu email corporativo"
                    type="email"
                  />
                  {!isEmailValid && <p className="loginScreen-errorText">{errorMessage}</p>}
                </div>
                <div className="loginScreen-formItem">
                  <button
                    className="loginScreen-button loginScreen-primaryButton"
                    type="submit"
                    disabled={!isFormValid || loadingEmail}
                  >
                    {loadingEmail ? (
                      <span className="loginScreen-loadingSpinner"></span>
                    ) : (
                      'Continuar'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form className="loginScreen-form" onSubmit={handleSendCode}>
                <div className="loginScreen-formItem">
                  <label className="loginScreen-label">Código de verificação</label>
                  <div className="loginScreen-codeInfo">
                    <p>Enviamos um código de 6 dígitos para <strong>{email}</strong></p>
                  </div>
                  <input
                    className={`loginScreen-input ${!isCodeValid ? 'loginScreen-inputError' : ''}`}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      validateCode(e.target.value);
                    }}
                    placeholder="Digite o código de 6 dígitos"
                    maxLength={6}
                  />
                  {!isCodeValid && <p className="loginScreen-errorText">{errorMessage}</p>}
                </div>
                <div className="loginScreen-formItem">
                  <button
                    className="loginScreen-button loginScreen-primaryButton"
                    type="submit"
                    disabled={!isCodeValid || loadingCode}
                  >
                    {loadingCode ? (
                      <span className="loginScreen-loadingSpinner"></span>
                    ) : (
                      'Acessar conta'
                    )}
                  </button>
                </div>
                <div className="loginScreen-formItem loginScreen-resendContainer">
                  {timer > 0 ? (
                    <p className="loginScreen-timerText">Aguarde {timer} segundos para reenviar o código</p>
                  ) : (
                    <button
                      type="button"
                      className="loginScreen-linkButton"
                      onClick={handleResendCode}
                    >
                      Reenviar código
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="loginScreen-links">
              <Link to="/privacy-policy" className="loginScreen-link">Política de Privacidade</Link> |{' '}
              <Link to="/terms-of-use" className="loginScreen-link">Termos de Uso</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
