import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { Tag, createTag, getTags, updateTag, deleteTag } from '../services/LabelService';
import { getSectors, Sector } from '../services/SectorService';
import SessionService from '../services/SessionService';
import './LabelScreen.css';
import Toast from '../components/Toast';

// Extended color palette with 54 colors
const PRESET_COLORS = [
  // Reds
  '#FF6B6B', '#FF0000', '#FF4500', '#DC143C', '#B22222', '#8B0000',
  // Pinks/Purples
  '#D4A5A5', '#FF69B4', '#FF1493', '#C71585', '#9B59B6', '#8A2BE2', 
  '#9370DB', '#6A5ACD', '#483D8B', '#4B0082',
  // Blues
  '#45B7D1', '#1E90FF', '#00BFFF', '#87CEEB', '#3498DB', '#0000FF', 
  '#0000CD', '#00008B', '#191970',
  // Greens
  '#96CEB4', '#2ECC71', '#00FF7F', '#3CB371', '#2E8B57', '#006400', 
  '#00FF00', '#32CD32', '#8FBC8F', '#1ABC9C',
  // Yellows/Oranges
  '#FFEEAD', '#F1C40F', '#FFD700', '#FFA500', '#FF8C00', '#E67E22',
  // Neutrals
  '#7F8C8D', '#A9A9A9', '#808080', '#696969', '#2F4F4F', '#000000',
  // Teals/Cyans
  '#00ADB5', '#008B8B', '#008080', '#20B2AA', '#5F9EA0', '#00CED1',
  // Browns
  '#CD853F', '#D2691E', '#8B4513', '#A0522D', '#800000'
];

interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  newTitle: string;
  setNewTitle: (value: string) => void;
  newDescription: string;
  setNewDescription: (value: string) => void;
  selectedColor: string;
  setSelectedColor: (value: string) => void;
  showColorPicker: boolean;
  setShowColorPicker: (value: boolean) => void;
  errors: {
    title?: string;
    description?: string;
  };
  setErrors: React.Dispatch<React.SetStateAction<{
    title?: string;
    description?: string;
  }>>;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title, 
  newTitle, 
  setNewTitle, 
  newDescription, 
  setNewDescription, 
  selectedColor, 
  setSelectedColor, 
  showColorPicker, 
  setShowColorPicker, 
  errors,
  setErrors 
}) => {
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div 
      className="modal-overlay" 
      style={{ 
        display: 'flex', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal" 
        style={{ 
          backgroundColor: '#1a1a1a', 
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          zIndex: 10000,
          position: 'relative',
          color: '#e0e0e0',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #2a2a2a', textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="close-button" onClick={onClose} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.5rem' }}>
            <FiX />
          </button>
        </div>
        <div className="modal-content" style={{ 
          padding: '1.5rem', 
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div className="form-group" style={{
            width: '100%',
            marginBottom: '1.5rem'
          }}>
            <label htmlFor="label-name" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Nome <span className="required" style={{ color: '#ff4c4c' }}>*</span>
            </label>
            <input
              id="label-name"
              type="text"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (errors.title) {
                  setErrors(prev => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="Digite o nome da etiqueta"
              className={errors.title ? 'error' : ''}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: errors.title ? '1px solid #ff4c4c' : '1px solid #333',
                backgroundColor: '#252525',
                color: '#e0e0e0',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {errors.title && (
              <span className="error-message" style={{
                color: '#ff4c4c',
                fontSize: '0.8rem',
                marginTop: '0.5rem',
                display: 'block'
              }}>{errors.title}</span>
            )}
          </div>

          <div className="form-group" style={{
            width: '100%',
            marginBottom: '1.5rem'
          }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>Descrição</label>
            <textarea
              value={newDescription}
              onChange={(e) => {
                setNewDescription(e.target.value);
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="Digite uma descrição (opcional)"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: errors.description ? '1px solid #ff4c4c' : '1px solid #333',
                backgroundColor: '#252525',
                color: '#e0e0e0',
                fontSize: '1rem',
                boxSizing: 'border-box',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />
            {errors.description && (
              <span className="error-message" style={{
                color: '#ff4c4c',
                fontSize: '0.8rem',
                marginTop: '0.5rem',
                display: 'block'
              }}>{errors.description}</span>
            )}
            <span style={{
              color: '#888',
              fontSize: '0.8rem',
              marginTop: '0.5rem',
              display: 'block'
            }}>
              {newDescription.length}/200 caracteres
            </span>
          </div>

          <div className="form-group" style={{
            width: '100%',
            marginBottom: '1rem',
            position: 'relative'
          }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>Cor da Etiqueta</label>
            <div className="color-picker" style={{
              position: 'relative',
              width: '100%'
            }}>
              <div 
                className="color-preview"
                style={{ 
                  backgroundColor: selectedColor,
                  width: '100%',
                  height: '40px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid #333',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              {showColorPicker && (
                <div 
                  className="color-grid"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '100%',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(9, 1fr)',
                    gap: '6px',
                    zIndex: 10001,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    maxHeight: '250px',
                    overflowY: 'auto'
                  }}
                >
                  {PRESET_COLORS.map((color) => (
                    <div
                      key={color}
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                      style={{ 
                        backgroundColor: color,
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: selectedColor === color ? '2px solid #fff' : '2px solid transparent',
                        boxShadow: selectedColor === color ? '0 0 0 2px #1e1e1e' : 'none'
                      }}
                      onClick={() => {
                        setSelectedColor(color);
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ 
          padding: '1rem 1.5rem', 
          borderTop: '1px solid #2a2a2a', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '1rem' 
        }}>
          <button 
            className="cancel-button" 
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid #333',
              background: 'transparent',
              color: '#e0e0e0',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button 
            className="save-button" 
            onClick={onSave}
            disabled={!newTitle.trim()}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              background: '#00c2ff',
              color: '#121212',
              cursor: !newTitle.trim() ? 'not-allowed' : 'pointer',
              opacity: !newTitle.trim() ? 0.7 : 1
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tagName: string;
}> = ({ isOpen, onClose, onConfirm, tagName }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="modal-overlay" 
      style={{ 
        display: 'flex', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        className="modal" 
        style={{ 
          backgroundColor: '#1a1a1a', 
          borderRadius: '12px',
          width: '90%',
          maxWidth: '400px',
          minHeight: '200px',
          zIndex: 10000,
          position: 'relative',
          color: '#e0e0e0',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ 
          padding: '1rem 1.5rem', 
          borderBottom: '1px solid #2a2a2a', 
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'center'
        }}>
          <FiAlertCircle size={20} color="#ff4c4c" />
          <h2 style={{ margin: 0, color: '#ff4c4c', fontSize: '1.1rem' }}>Confirmar Exclusão</h2>
        </div>
        
        <div className="modal-content" style={{ 
          padding: '1.5rem',
          paddingTop: '1rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '0.95rem',
            textAlign: 'left'
          }}>
            Tem certeza que deseja excluir a etiqueta "{tagName}"?
          </p>
        </div>

        <div className="modal-footer" style={{ 
          padding: '1rem 1.5rem', 
          borderTop: '1px solid #2a2a2a', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '1rem' 
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid #333',
              background: 'transparent',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              background: '#ff4c4c',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const LabelScreen = () => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [errors, setErrors] = useState<{
        title?: string;
        description?: string;
    }>({});
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState<number | null>(null);

    useEffect(() => {
        const sectorId = SessionService.getSectorId();
        if (sectorId) {
            fetchTags();
            fetchSectors();
        }
    }, [SessionService.getSectorId()]);

    useEffect(() => {
        console.log('showModal state changed to:', showModal);
    }, [showModal]);

    const fetchTags = async () => {
        const sectorId = SessionService.getSectorId();
        if (!sectorId) return;

        try {
            setIsLoading(true);
            const response = await getTags(sectorId);
            setTags(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Erro ao buscar etiquetas:', error);
            setTags([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSectors = async () => {
        const token = SessionService.getSession('authToken');
        if (!token) return;

        try {
            const response = await getSectors(token);
            setSectors(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
            setSectors([]);
        }
    };

    const handleEdit = (index: number) => {
        setEditing(index);
        setNewTitle(tags[index].name);
        setNewDescription(tags[index].description);
        setSelectedSectorId(tags[index].sectorId);
        setSelectedColor(tags[index].color || PRESET_COLORS[0]);
        setShowModal(true);
    };

    const validateForm = () => {
        const newErrors: { title?: string; description?: string } = {};
        
        if (!newTitle.trim()) {
            newErrors.title = 'O nome da etiqueta é obrigatório';
        } else if (newTitle.length < 3) {
            newErrors.title = 'O nome deve ter pelo menos 3 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addToast = (message: string, type: 'success' | 'error' | 'info') => {
        const newToast = {
            id: Date.now(),
            message,
            type,
        };
        setToasts(current => [...current, newToast]);
    };

    const removeToast = (id: number) => {
        setToasts(current => current.filter(toast => toast.id !== id));
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        const sectorId = SessionService.getSectorId();
        if (!sectorId) {
            addToast('Selecione um setor antes de continuar', 'error');
            return;
        }

        try {
            const tagData = {
                name: newTitle,
                description: newDescription,
                sectorId: sectorId,
                color: selectedColor
            };

            if (editing !== null) {
                if (editing < tags.length) {
                    await updateTag(tags[editing].id, tagData);
                    addToast('Etiqueta atualizada com sucesso!', 'success');
                } else {
                    await createTag(tagData);
                    addToast('Etiqueta criada com sucesso!', 'success');
                }

                await fetchTags();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Erro ao salvar etiqueta:', error);
            setErrors({ title: 'Erro ao salvar a etiqueta. Tente novamente.' });
            addToast('Erro ao salvar a etiqueta', 'error');
        }
    };

    const handleDelete = async (index: number) => {
        try {
            await deleteTag(tags[index].id);
            await fetchTags();
            setDeleteModalOpen(null);
            addToast('Etiqueta excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir etiqueta:', error);
            addToast('Erro ao excluir a etiqueta', 'error');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditing(null);
        setNewTitle('');
        setNewDescription('');
        setErrors({});
    };

    const handleAddNew = () => {
        console.log('handleAddNew chamado');
        setEditing(tags.length);
        setNewTitle('');
        setNewDescription('');
        setSelectedColor(PRESET_COLORS[0]);
        setShowColorPicker(false);
        setShowModal(true);
    };

    return (
        <>
            <div className="label-screen">
                <div className="label-header">
                    <div className="header-content">
                        <h1>Etiquetas</h1>
                        <p className="header-description">Gerencie as etiquetas do seu setor</p>
                    </div>
                    <button className="add-label-button" onClick={handleAddNew}>
                        <FiPlus /> Nova Etiqueta
                    </button>
                </div>

                <div className="labels-container">
                    <div className="labels-header">
                        <div className="label-row header">
                            <div className="label-name">Nome</div>
                            <div className="label-description">Descrição</div>
                            <div className="label-actions">Ações</div>
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <div className="labels-list">
                            <div className="loading-overlay">
                                <div className="card-loading">
                                    <div className="card-loading-spinner" />
                                    <span className="loading-text">Carregando etiquetas...</span>
                                </div>
                            </div>
                        </div>
                    ) : tags.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhuma etiqueta encontrada</p>
                            <button className="add-first-label" onClick={handleAddNew}>
                                <FiPlus /> Criar primeira etiqueta
                            </button>
                        </div>
                    ) : (
                        <div className="labels-list">
                            {tags.map((tag, index) => (
                                <div key={tag.id} className="label-row">
                                    <div className="label-name">
                                        <span 
                                            className="label-indicator" 
                                            style={{ backgroundColor: tag.color }}
                                        ></span>
                                        {tag.name}
                                    </div>
                                    <div className="label-description">
                                        {tag.description || "Sem descrição"}
                                    </div>
                                    <div className="label-actions">
                                        <button 
                                            className="action-button edit" 
                                            onClick={() => handleEdit(index)}
                                            title="Editar"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button 
                                            className="action-button delete" 
                                            onClick={() => setDeleteModalOpen(index)}
                                            title="Excluir"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal 
                isOpen={showModal}
                onClose={handleCloseModal}
                onSave={handleSave}
                title={editing !== null && editing < tags.length ? 'Editar Etiqueta' : 'Nova Etiqueta'}
                newTitle={newTitle}
                setNewTitle={setNewTitle}
                newDescription={newDescription}
                setNewDescription={setNewDescription}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                showColorPicker={showColorPicker}
                setShowColorPicker={setShowColorPicker}
                errors={errors}
                setErrors={setErrors}
            />

            <DeleteConfirmationModal
                isOpen={deleteModalOpen !== null}
                onClose={() => setDeleteModalOpen(null)}
                onConfirm={() => deleteModalOpen !== null && handleDelete(deleteModalOpen)}
                tagName={deleteModalOpen !== null ? tags[deleteModalOpen].name : ''}
            />

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
        </>
    );
};

export default LabelScreen;
