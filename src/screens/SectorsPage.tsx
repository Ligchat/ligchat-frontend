import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiFolder } from 'react-icons/fi';
import { createSector, updateSector, deleteSector, getSectors } from '../services/SectorService';
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
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
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
  });
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDeleting, setIsDeleting] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchSectors();
  }, []);

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
    if (!sectorData.phoneNumberId) {
      newErrors.phoneNumberId = 'A identificação do telefone é obrigatória';
    }
    if (!sectorData.accessToken) {
      newErrors.accessToken = 'O token de acesso é obrigatório';
    }
    if (!sectorData.description) {
      newErrors.description = 'A descrição é obrigatória';
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
        ...sectorData,
        userBusinessId,
      };

      if (editingSector?.id) {
        try {
          await updateSector(editingSector.id, updatedSectorData);
          addToast('Setor atualizado com sucesso', 'success');
          await fetchSectors();
          handleCloseDrawer();
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
          await createSector(updatedSectorData);
          addToast('Setor criado com sucesso', 'success');
          await fetchSectors();
          handleCloseDrawer();
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
      setIsLoading(true);
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
        ) : !SessionService.getSectorId() ? (
          <div className="no-sector-text">
            Nenhum setor selecionado
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
            {sectors.map((sector) => (
              <div key={sector.id} className="sector-card">
                <div className="sector-card-header">
                  <h3>{sector.name}</h3>
                  <div className="sector-actions">
                    <button
                      className="action-button edit"
                      onClick={() => {
                        setEditingSector(sector);
                        setSectorData(sector);
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
                  </div>

                  <div className="sector-info-section">
                    <h4>Configuração da Meta</h4>
                    <p className="info-row">
                      <strong>ID do Telefone:</strong>
                      <p>{sector.phoneNumberId}</p>
                    </p>
                    <p className="info-row">
                      <strong>Token de Acesso:</strong>
                      <p>{sector.accessToken}</p>
                    </p>
                  </div>
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
            ))}
          </div>
        )}
      </div>

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

                <div className="drawer-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseDrawer}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSector ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
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
