import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiFolder, FiCheckCircle } from 'react-icons/fi';
import { createSector, updateSector, deleteSector, getSectors, getWhatsAppStatus, getWhatsAppQRCode } from '../services/SectorService';
import SessionService from '../services/SessionService';
import Toast from '../components/Toast';
import './SectorsPage.css';

interface Sector {
  id?: number;
  name: string;
  userBusinessId?: number;
  phoneNumberId: string;
  accessToken: string;
  description: string;
  googleClientId?: string;
  googleApiKey?: string;
  isOfficial: boolean;
  whatsappConnection?: {
    id: number;
    sectorId: number;
    status: string;
    qrcodeBase64: string | null;
    lastQrcodeGeneratedAt: string | null;
    lastConnectedAt: string | null;
    lastDisconnectedAt: string | null;
    sessionData: any;
    createdAt: string;
    updatedAt: string;
  };
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface QRCodeData {
  qrcode: string;
  instructions?: string;
}

const SectorsPage: React.FC = () => {
  console.log('SectorsPage montando...'); // Debug

  const navigate = useNavigate();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [sectorData, setSectorData] = useState<Sector>({
    name: '',
    phoneNumberId: '',
    accessToken: '',
    description: '',
    isOfficial: true,
  });
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDeleting, setIsDeleting] = useState<{ [key: number]: boolean }>({});
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [qrCodeInstructions, setQrCodeInstructions] = useState<string | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<{ status: string; message: string } | null>(null);
  const [selectedSectorForQR, setSelectedSectorForQR] = useState<number | null>(null);
  const [statusPollingInterval, setStatusPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isLoadingQRCode, setIsLoadingQRCode] = useState<boolean>(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchSectors();

    // Cleanup function to clear any existing intervals when component unmounts
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
        setStatusPollingInterval(null);
      }
    };
  }, []);

  // Efeito para verificar status inicial dos setores não oficiais
  useEffect(() => {
    const checkUnofficialSectorsStatus = async () => {
      const unofficialSectors = sectors.filter(sector => !sector.isOfficial);
      for (const sector of unofficialSectors) {
        if (sector.id) {
          try {
            const status = await getWhatsAppStatus(sector.id, false);
            setSectors(prev => prev.map(s => 
              s.id === sector.id 
                ? { 
                    ...s, 
                    whatsappConnection: s.whatsappConnection 
                      ? { ...s.whatsappConnection, status: status.status }
                      : {
                          id: 0,
                          sectorId: sector.id!,
                          status: status.status,
                          qrcodeBase64: null,
                          lastQrcodeGeneratedAt: null,
                          lastConnectedAt: null,
                          lastDisconnectedAt: null,
                          sessionData: null,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        }
                  }
                : s
            ));
          } catch (error) {
            console.error(`Erro ao verificar status do setor ${sector.id}:`, error);
          }
        }
      }
    };

    // Apenas verificar o status uma vez quando os setores são carregados
    if (sectors.length > 0) {
      checkUnofficialSectorsStatus();
    }
  }, [sectors.length]); // Mudando a dependência para sectors.length

  // Efeito para polling do status quando o modal está aberto
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
        setStatusPollingInterval(null);
      }
    };

    if (showQRCode && selectedSectorForQR) {
      const sector = sectors.find(s => s.id === selectedSectorForQR);
      
      if (sector && !sector.isOfficial) {
        const checkStatus = async () => {
          try {
            const status = await getWhatsAppStatus(selectedSectorForQR, false);
            setWhatsappStatus(status);
            
            if (status.status === 'connected') {
              setSectors(prev => prev.map(s => 
                s.id === selectedSectorForQR 
                  ? { 
                      ...s, 
                      whatsappConnection: s.whatsappConnection 
                        ? { ...s.whatsappConnection, status: status.status }
                        : {
                            id: 0,
                            sectorId: s.id!,
                            status: status.status,
                            qrcodeBase64: null,
                            lastQrcodeGeneratedAt: null,
                            lastConnectedAt: null,
                            lastDisconnectedAt: null,
                            sessionData: null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          }
                    }
                  : s
              ));
              stopPolling();
              setTimeout(() => {
                setShowQRCode(false);
                setSelectedSectorForQR(null);
                setQRCodeData(null);
              }, 2000);
            }
          } catch (error) {
            console.error('Erro ao verificar status:', error);
            stopPolling();
          }
        };

        checkStatus();
        interval = setInterval(checkStatus, 2000);
        setStatusPollingInterval(interval);
      }
    }

    return () => {
      stopPolling();
    };
  }, [showQRCode, selectedSectorForQR]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(current => [...current, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  };

  const fetchSectors = async () => {
    try {
      setIsLoading(true);
      const token = SessionService.getToken();
      if (!token) {
        navigate('/');
        return;
      }
      const response = await getSectors(token);
      setSectors(response || []);
    } catch (error) {
      console.error('Falha ao buscar setores', error);
      setSectors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string | undefined } = {};
    
    if (!sectorData.name) {
      newErrors.name = 'O nome do setor é obrigatório';
    }
    if (!sectorData.description) {
      newErrors.description = 'A descrição é obrigatória';
    }

    // Validações específicas para API oficial
    if (sectorData.isOfficial) {
      if (!sectorData.phoneNumberId) {
        newErrors.phoneNumberId = 'A identificação do telefone é obrigatória';
      }
      if (!sectorData.accessToken) {
        newErrors.accessToken = 'O token de acesso é obrigatório';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const token = SessionService.getToken();
      if (!token) {
        addToast('Erro de autenticação', 'error');
        return;
      }
      const decodedToken = SessionService.decodeToken(token);
      const userBusinessId = decodedToken?.userId;

      if (!userBusinessId) {
        addToast('Erro de autenticação', 'error');
        return;
      }

      const updatedSectorData = {
        name: sectorData.name,
        description: sectorData.description,
        isOfficial: sectorData.isOfficial,
        phoneNumberId: sectorData.isOfficial ? sectorData.phoneNumberId : '',
        accessToken: sectorData.isOfficial ? sectorData.accessToken : '',
        userBusinessId
      };

      if (editingSector?.id) {
        try {
          const response = await updateSector(editingSector.id, updatedSectorData);
          if (response) {
            await fetchSectors(); // Recarrega todos os setores
            addToast('Setor atualizado com sucesso', 'success');
            handleCloseDrawer();
          }
        } catch (error: any) {
          console.error('Erro ao atualizar setor:', error);
          const errorMessage = error?.response?.data?.message;
          if (errorMessage === 'Invalid request: Phone number ID is already in use.') {
            setErrors(prev => ({
              ...prev,
              phoneNumberId: 'Este ID de telefone já está sendo usado'
            }));
            addToast('ID do telefone já está sendo usado', 'error');
          } else {
            addToast(errorMessage || 'Erro ao atualizar setor', 'error');
          }
        }
      } else {
        try {
          const response = await createSector(updatedSectorData);
          if (response) {
            await fetchSectors(); // Recarrega todos os setores
            addToast('Setor criado com sucesso', 'success');
            handleCloseDrawer();
          }
        } catch (error: any) {
          console.error('Erro ao criar setor:', error);
          const errorMessage = error?.response?.data?.message;
          if (errorMessage === 'Invalid request: Phone number ID is already in use.') {
            setErrors(prev => ({
              ...prev,
              phoneNumberId: 'Este ID de telefone já está sendo usado'
            }));
            addToast('ID do telefone já está sendo usado', 'error');
          } else {
            addToast(errorMessage || 'Erro ao criar setor', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Erro geral:', error);
      addToast('Erro ao processar operação', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSector(id);
      setSectors(sectors.filter(sector => sector.id !== id));
      addToast('Setor excluído com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      addToast('Erro ao excluir setor', 'error');
    } finally {
      setIsLoading(false);
      setIsDeleting({ ...isDeleting, [id]: false });
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingSector(null);
    setSectorData({
      name: '',
      phoneNumberId: '',
      accessToken: '',
      description: '',
      isOfficial: true,
    });
    setErrors({});
    document.body.classList.remove('drawer-open');
  };

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
    document.body.classList.add('drawer-open');
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseDrawer();
    }
  };

  // Função para buscar QR code
  const fetchQRCode = async (sectorId: number) => {
    try {
      setIsLoadingQRCode(true);
      const sector = sectors.find(s => s.id === sectorId);
      if (!sector) return;

      const response = await getWhatsAppQRCode(sectorId, sector.isOfficial);
      setQRCodeData(response);
    } catch (error) {
      console.error('Erro ao buscar QR code:', error);
      addToast('Erro ao gerar QR Code', 'error');
    } finally {
      setIsLoadingQRCode(false);
    }
  };

  // Função para mostrar QR code
  const handleShowQRCode = async (sectorId: number) => {
    setSelectedSectorForQR(sectorId);
    setShowQRCode(true);
    await fetchQRCode(sectorId);
  };

  // Função para fechar QR code
  const handleCloseQRCode = () => {
    setShowQRCode(false);
    setQRCodeData(null);
    setSelectedSectorForQR(null);
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
      setStatusPollingInterval(null);
    }
  };

  // Renderizar status do WhatsApp
  const renderWhatsAppStatus = (sector: Sector) => {
    if (!sector.whatsappConnection) return null;

    const getStatusColor = () => {
      switch (sector.whatsappConnection?.status) {
        case 'connected':
          return '#4CAF50';
        case 'connecting':
          return '#FFC107';
        case 'disconnected':
        case 'error':
          return '#FF5252';
        default:
          return '#757575';
      }
    };

    return (
      <div className="whatsapp-status" style={{ color: getStatusColor() }}>
        <span className="status-dot" style={{ backgroundColor: getStatusColor() }} />
        <span>{sector.whatsappConnection.status}</span>
      </div>
    );
  };

  const handleApiTypeChange = (isOfficial: boolean) => {
    if (isOfficial) {
      setSectorData(prev => ({
        ...prev,
        isOfficial: true,
        phoneNumberId: editingSector?.phoneNumberId || '',
        accessToken: editingSector?.accessToken || ''
      }));
    } else {
      setSectorData(prev => ({
        ...prev,
        isOfficial: false,
        phoneNumberId: '',
        accessToken: ''
      }));
    }
    setErrors({});
  };

  // Atualizar o formulário para incluir isOfficial
  const renderForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <div className="form-group">
        <label>Nome do Setor <span className="required">*</span></label>
        <input
          type="text"
          className={`form-input ${errors.name ? 'error' : ''}`}
          value={sectorData.name}
          placeholder="Ex: Vendas, Suporte, Marketing..."
          onChange={(e) => {
            setSectorData({ ...sectorData, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label>Tipo de API</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={sectorData.isOfficial}
              onChange={() => handleApiTypeChange(true)}
            />
            Whatsapp V1
          </label>
          <label>
            <input
              type="radio"
              checked={!sectorData.isOfficial}
              onChange={() => handleApiTypeChange(false)}
            />
            Whatsapp V2
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Descrição <span className="required">*</span></label>
        <textarea
          className={`form-input form-textarea ${errors.description ? 'error' : ''}`}
          value={sectorData.description}
          placeholder="Descreva o propósito ou função deste setor..."
          onChange={(e) => {
            setSectorData({ ...sectorData, description: e.target.value });
            if (errors.description) setErrors({ ...errors, description: '' });
          }}
        />
        {errors.description && <span className="error-message">{errors.description}</span>}
      </div>

      {sectorData.isOfficial && (
        <>
          <div className="form-group">
            <label>ID do Telefone <span className="required">*</span></label>
            <input
              type="text"
              className={`form-input ${errors.phoneNumberId ? 'error' : ''}`}
              value={sectorData.phoneNumberId}
              placeholder="ID do número do WhatsApp Business"
              onChange={(e) => {
                setSectorData({ ...sectorData, phoneNumberId: e.target.value });
                if (errors.phoneNumberId) setErrors({ ...errors, phoneNumberId: '' });
              }}
            />
            {errors.phoneNumberId && <span className="error-message">{errors.phoneNumberId}</span>}
          </div>

          <div className="form-group">
            <label>Token de Acesso <span className="required">*</span></label>
            <textarea
              className={`form-input form-textarea ${errors.accessToken ? 'error' : ''}`}
              value={sectorData.accessToken}
              placeholder="Token de acesso da API do WhatsApp Business"
              onChange={(e) => {
                setSectorData({ ...sectorData, accessToken: e.target.value });
                if (errors.accessToken) setErrors({ ...errors, accessToken: '' });
              }}
            />
            {errors.accessToken && <span className="error-message">{errors.accessToken}</span>}
          </div>
        </>
      )}

      <div className="drawer-footer">
        <button type="button" className="btn btn-secondary" onClick={handleCloseDrawer}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          {editingSector ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </form>
  );

  // Atualizar o card do setor para incluir status e botão de QR code
  const renderSectorCard = (sector: Sector) => (
    <div key={sector.id} className="sector-card">
      <div className="sector-card-header">
        <h3>{sector.name}</h3>
        <div className="sector-actions">
          <button
            className="action-button edit"
            onClick={() => {
              setEditingSector(sector);
              setSectorData({
                name: sector.name,
                description: sector.description,
                isOfficial: sector.isOfficial,
                phoneNumberId: sector.phoneNumberId || '',
                accessToken: sector.accessToken || '',
              });
              handleOpenDrawer();
            }}
          >
            <FiEdit2 />
          </button>
          <button
            className="action-button delete"
            onClick={() => setIsDeleting({ ...isDeleting, [sector.id!]: true })}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="sector-card-content">
        <div className="sector-info-section">
          <p className="info-row">
            <strong>Descrição:</strong>
            <p>{sector.description}</p>
          </p>
          <p className="info-row">
            <strong>Tipo de API:</strong>
            <p>{sector.isOfficial ? 'Oficial' : 'Não Oficial'}</p>
          </p>
        </div>

        {sector.isOfficial ? (
          <div className="sector-info-section">
            <h4>Configuração da API</h4>
            <p className="info-row">
              <strong>ID do Telefone:</strong>
              <p>{sector.phoneNumberId}</p>
            </p>
            <p className="info-row">
              <strong>Token de Acesso:</strong>
              <p>{sector.accessToken}</p>
            </p>
          </div>
        ) : (
          <div className="sector-info-section">
            <h4>Status do WhatsApp</h4>
            {renderWhatsAppStatus(sector)}
            <button
              className="whatsapp-connect-button"
              onClick={() => sector.id && handleShowQRCode(sector.id)}
            >
              {sector.whatsappConnection?.status === 'connected' ? 'Reconectar WhatsApp' : 'Conectar WhatsApp'}
            </button>
          </div>
        )}
      </div>

      {isDeleting[sector.id!] && (
        <div className="delete-confirmation">
          <div className="delete-message-container">
            <h4 className="delete-title">Confirmar Exclusão</h4>
            <p className="delete-message">
              Tem certeza que deseja excluir o setor "{sector.name}"?
              <br />
              Esta ação não poderá ser desfeita.
            </p>
          </div>
          <div className="confirmation-actions">
            <button 
              className="cancel-button"
              onClick={() => setIsDeleting({ ...isDeleting, [sector.id!]: false })}
            >
              <FiX /> Cancelar
            </button>
            <button 
              className="confirm-button"
              onClick={() => handleDelete(sector.id!)}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="sectors-screen">
      <div className="sectors-header">
        <div className="header-content">
          <h1>Gerenciar Setores</h1>
          <p className="header-description">Gerencie os setores da sua empresa</p>
        </div>
        <button 
          className="add-button"
          onClick={handleOpenDrawer}
        >
          <FiPlus />
          Novo Setor
        </button>
      </div>

      <div className="sectors-content">
        {isLoading ? (
          <div className="loading-overlay">
            <div className="card-loading">
              <div className="card-loading-spinner" />
              <span className="loading-text">Carregando setores...</span>
            </div>
          </div>
        ) : sectors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FiFolder size={48} />
            </div>
            <h3>Nenhum setor cadastrado</h3>
            <p>Clique no botão "Novo Setor" para começar</p>
          </div>
        ) : (
          <div className="sectors-grid">
            {sectors.map(sector => renderSectorCard(sector))}
          </div>
        )}
      </div>

      {/* Modal do QR Code */}
      {showQRCode && (
        <div className="qrcode-modal-overlay" onClick={handleCloseQRCode}>
          <div className="qrcode-modal" onClick={e => e.stopPropagation()}>
            <div className="qrcode-modal-header">
              <h3>Conectar WhatsApp</h3>
              <button className="close-button" onClick={handleCloseQRCode}>
                <FiX />
              </button>
            </div>
            <div className="qrcode-modal-content">
              {whatsappStatus && (
                <div className={`whatsapp-status-message ${whatsappStatus.status}`}>
                  {whatsappStatus.message}
                </div>
              )}
              {isLoadingQRCode ? (
                <div className="qrcode-loading">
                  <div className="qrcode-loading-spinner" />
                  <span className="qrcode-loading-text">Gerando QR Code...</span>
                </div>
              ) : (
                <>
                  {qrCodeData && whatsappStatus?.status !== 'connected' && (
                    <div className="qrcode-container">
                      <img src={qrCodeData.qrcode} alt="QR Code para conexão do WhatsApp" />
                    </div>
                  )}
                  {whatsappStatus?.status === 'connected' && (
                    <div className="connection-success">
                      <FiCheckCircle size={48} />
                      <p>WhatsApp conectado com sucesso!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={handleOverlayClick}>
          <div className="sector-drawer">
            <div className="drawer-header">
              <h2>{editingSector ? 'Editar Setor' : 'Novo Setor'}</h2>
              <button className="close-button" onClick={handleCloseDrawer}>
                <FiX />
              </button>
            </div>

            <div className="drawer-content">
              {renderForm()}
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default SectorsPage;
