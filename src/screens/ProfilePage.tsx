import React, { useState, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import SessionService from '../services/SessionService';
import axios from 'axios';
import './ProfilePage.css';

interface ProfileUpdateEvent extends CustomEvent {
  detail: {
    avatarUrl: string | null;
    name: string;
    timestamp: number;
  };
}

const PROFILE_UPDATED_EVENT = 'profileUpdated';

const API_URL = process.env.REACT_APP_API_URL;

const ProfilePage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(true);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 200,
    height: 200,
    x: 0,
    y: 0
  });
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    console.log('useEffect running');
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const token = SessionService.getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        const userData = response.data;
        console.log('userData:', userData);
        setName(userData.name);
        setEmail(userData.email);
        setPhoneNumber(userData.phoneWhatsapp);
        setAvatar(userData.avatarUrl ? `${userData.avatarUrl}?t=${new Date().getTime()}` : null);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
    const cropSize = Math.min(mediaWidth, mediaHeight, 200);
    return centerCrop(
      makeAspectCrop(
        {
          unit: 'px',
          width: cropSize,
          height: cropSize
        },
        1,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImage(reader.result as string);
      const image = new Image();
      image.src = reader.result as string;
      image.onload = () => {
        const crop = centerAspectCrop(image.width, image.height);
        setCrop(crop);
        setImgRef(image);
      };
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImg = (image: string, crop: Crop): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Tamanho fixo para o avatar
        const size = 150;
        canvas.width = size;
        canvas.height = size;

        // Limpa o canvas e cria o círculo
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();

        // Calcula a escala correta
        const scaleX = img.naturalWidth / imgRef!.width;
        const scaleY = img.naturalHeight / imgRef!.height;

        // Calcula as dimensões do corte em pixels
        const pixelCrop = {
          x: crop.x * scaleX,
          y: crop.y * scaleY,
          width: crop.width * scaleX,
          height: crop.height * scaleY
        };

        // Aplica a suavização
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Desenha a imagem mantendo a proporção do corte
        ctx.drawImage(
          img,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          size,
          size
        );

        try {
          const base64Image = canvas.toDataURL('image/jpeg', 0.95);
          resolve(base64Image);
        } catch (err) {
          console.error('Error generating base64 image:', err);
          resolve('');
        }
      };

      img.onerror = () => {
        console.error('Error loading source image for cropping');
        resolve('');
      };
    });
  };

  const handleCropComplete = async () => {
    if (!crop.width || !crop.height) return;

    try {
      const croppedImageUrl = await getCroppedImg(cropImage, crop);
      setAvatarBase64(croppedImageUrl);
      setAvatar(croppedImageUrl);
      
      // Dispatch event with updated data and timestamp
      const event = new CustomEvent(PROFILE_UPDATED_EVENT, {
        detail: {
          avatarUrl: croppedImageUrl,
          name: name,
          timestamp: new Date().getTime()
        }
      });
      window.dispatchEvent(event);
      
      setShowCropModal(false);
    } catch (e) {
      console.error('Erro ao cortar imagem:', e);
    }
  };

  const handleSave = async () => {
    if (!isEmailValid || !isPhoneValid) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = SessionService.getToken();
      if (!token) {
        setErrorMessage('Usuário não autenticado');
        setIsLoading(false);
        return;
      }

      const response = await axios.put(`${API_URL}/users/profile`, {
        name,
        email,
        phoneWhatsapp: phoneNumber,
        avatarUrl: avatarBase64 || avatar || ''
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response) {
        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
        
        // Dispatch event with updated data
        const event = new CustomEvent(PROFILE_UPDATED_EVENT, {
          detail: {
            avatarUrl: avatarBase64 || avatar,
            name: name,
            timestamp: new Date().getTime()
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar o usuário:', error);
      setErrorMessage(
        error.response?.data?.message || 
        'Erro ao atualizar o perfil. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);

    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }

    return value;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhoneNumber(rawValue);
    setPhoneNumber(formattedValue);
    validatePhone(formattedValue);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    setIsPhoneValid(phoneRegex.test(phone));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('handleNameChange value:', value);
    if (value.length <= 70) {
      setName(value);
    }
  };

  console.log('Current name state:', name);

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <div className="header-content">
          <h1>Perfil</h1>
          <p className="header-description">Gerencie suas informações pessoais</p>
        </div>
      </div>

      <div className="profile-content">
        {isLoading && (
          <div className="loading-overlay">
            <div className="card-loading">
              <div className="card-loading-spinner" />
              <span className="loading-text">Carregando perfil...</span>
            </div>
          </div>
        )}

        <div className="avatar-container">
          <div 
            className="avatar"
            onClick={() => document.getElementById('avatar-input')?.click()}
          >
            {avatar ? (
              <img 
                src={avatar}
                alt="Avatar do usuário"
                loading="eager"
                onError={(e) => {
                  console.error('Error loading avatar image:', e);
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite loop
                  target.src = ''; // Clear invalid source
                }}
              />
            ) : (
              <span className="avatar-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                  <path d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z" fill="currentColor"/>
                </svg>
              </span>
            )}
          </div>
          <label className="upload-button">
            Editar foto
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: 'none' }}
              disabled={isLoading}
            />
          </label>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Nome</label>
            <input
              type="text"
              className="form-input"
              value={name}
              defaultValue={name}
              onChange={handleNameChange}
              placeholder="Seu nome"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className={`form-input ${!isEmailValid ? 'error' : ''}`}
              value={email}
              onChange={handleEmailChange}
              placeholder="seu@email.com"
              disabled={isLoading}
            />
            {!isEmailValid && (
              <div className="error-message">Por favor, insira um e-mail válido.</div>
            )}
          </div>

          <div className="form-group">
            <label>Número</label>
            <input
              type="tel"
              className={`form-input ${!isPhoneValid ? 'error' : ''}`}
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="(xx) xxxxx-xxxx"
              disabled={isLoading}
            />
            {!isPhoneValid && (
              <div className="error-message">Por favor, insira um número de telefone válido.</div>
            )}
          </div>

          <button
            className="save-button"
            onClick={handleSave}
            disabled={isLoading || !isEmailValid || !isPhoneValid}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>

          {successMessage && (
            <div className="success-message">
              Perfil atualizado com sucesso!
            </div>
          )}

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {showCropModal && (
        <div className="modal-overlay">
          <div className="crop-modal">
            <div className="modal-header">
              <h2>Ajustar Foto</h2>
              <button 
                className="close-button"
                onClick={() => setShowCropModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {cropImage && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCrop(c)}
                  aspect={1}
                  circularCrop
                  minWidth={200}
                  minHeight={200}
                >
                  <img 
                    src={cropImage} 
                    alt="Imagem para cortar"
                    style={{ maxHeight: '70vh' }}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      setImgRef(target);
                      const crop = centerAspectCrop(target.width, target.height);
                      setCrop(crop);
                    }}
                  />
                </ReactCrop>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowCropModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="save-button"
                onClick={handleCropComplete}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;


