import React, { useState, useEffect } from 'react';
import { Button, Input, Upload, Avatar, message, Skeleton } from 'antd';
import SessionService from '../services/SessionService';
import { updateUser, getUser } from '../services/UserService';
import { UploadOutlined } from '@ant-design/icons';
import LoadingOverlay from '../components/LoadingOverlay';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAvatarLoading, setIsAvatarLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const token = SessionService.getSession('authToken');
        const decodedToken = token ? SessionService.decodeToken(token) : null;
        const userId = decodedToken ? decodedToken.userId : null;

        if (!userId) {
          setIsLoading(false);
          return;
        }

        const response: any = await getUser(userId);
        const userData = response.data;
        setName(userData.name);
        setEmail(userData.email);
        setPhoneNumber(userData.phoneWhatsapp);
        setAvatar(userData.avatarUrl || 'https://i.pravatar.cc/150?img=3');
      } catch (error) {
        console.error('Erro ao buscar dados do usuário', error);
      } finally {
        setIsLoading(false);
        setIsAvatarLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUpload = (file: any) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result as string);
      setIsAvatarLoading(false);
    };
    reader.readAsDataURL(file);
    setAvatar(URL.createObjectURL(file));
    setIsAvatarLoading(true);

    return false;
  };

  const handleSave = async () => {
    if (!isEmailValid || !isPhoneValid) {
      return;
    }

    setIsLoading(true);
    try {
      const token = SessionService.getSession('authToken');
      const decodedToken = token ? SessionService.decodeToken(token) : null;
      const userId = decodedToken ? decodedToken.userId : null;

      if (!userId) {
        setIsLoading(false);
        return;
      }

      await updateUser(userId, {
        name,
        email,
        avatarUrl: avatarBase64 || avatar || '',
        phoneWhatsapp: phoneNumber,
      });

      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, ''); // Remove caracteres não numéricos
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/); // Para o formato (xx) xxxxx-xxxx

    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`; // Retorna o número formatado
    }

    return value; // Retorna o valor original se não corresponder ao formato
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhoneNumber(rawValue);
    setPhoneNumber(formattedValue);
    validatePhone(formattedValue);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/; // Regex para validar o formato (xx) xxxxx-xxxx
    setIsPhoneValid(phoneRegex.test(phone));
  };

  const handleNameChange = (value: string) => {
    if (value.length <= 70) {
      setName(value); // Limita o nome a 70 caracteres
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {isLoading && <LoadingOverlay />}

      <div className="mb-4 relative">
        {isAvatarLoading ? (
          <Skeleton.Avatar active size={100} shape="circle" />
        ) : (
          <Avatar size={100} src={avatar || 'https://i.pravatar.cc/150?img=3'} />
        )}
        <div className="text-center mt-2">
          <Upload showUploadList={false} beforeUpload={handleUpload}>
            <Button icon={<UploadOutlined />} type="link" disabled={isLoading}>
              Editar foto
            </Button>
          </Upload>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <label>Nome</label>
        <Input
          className="mb-4"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="seu nome"
          disabled={isLoading}
        />

        <label>Email</label>
        <Input
          className={`mb-4 ${!isEmailValid ? 'border-red-500' : ''}`}
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="seu@email.com"
          disabled={isLoading}
        />
        {!isEmailValid && (
          <div className="text-red-500 mb-2">Por favor, insira um e-mail válido.</div>
        )}

        <label>Número</label>
        <Input
          className={`mb-4 ${!isPhoneValid ? 'border-red-500' : ''}`}
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder="(xx) xxxxx-xxxx"
          disabled={isLoading}
        />
        {!isPhoneValid && (
          <div className="text-red-500 mb-2">Por favor, insira um número de telefone válido.</div>
        )}

        <Button type="primary" className="w-full" onClick={handleSave} disabled={isLoading}>
          Salvar
        </Button>
        {successMessage && (
          <div className="text-green-500 text-center mt-2">
            Perfil atualizado com sucesso!
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
