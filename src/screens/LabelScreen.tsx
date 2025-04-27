import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { ImSpinner2 } from 'react-icons/im';
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

const Modal: React.FC<ModalProps & { isSaving?: boolean }> = ({ 
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
  setErrors,
  isSaving = false
}) => {
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div 
      className="label-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="label-modal" 
        onClick={e => e.stopPropagation()}
      >
        <div className="label-modal-header">
          <h2>{title}</h2>
          <button className="label-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="label-modal-content">
          <div className="label-form-group">
            <label htmlFor="label-name">
              Nome <span className="required">*</span>
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
            />
            {errors.title && (
              <span className="label-error-message">{errors.title}</span>
            )}
          </div>

          <div className="label-form-group">
            <label>Descrição</label>
            <textarea
              value={newDescription}
              onChange={(e) => {
                setNewDescription(e.target.value);
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="Digite uma descrição (opcional)"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && (
              <span className="label-error-message">{errors.description}</span>
            )}
            <span className="label-char-count">
              {newDescription.length}/200 caracteres
            </span>
          </div>

          <div className="label-form-group">
            <label>Cor da Etiqueta</label>
            <div className="label-color-picker">
              <div 
                className="label-color-preview"
                style={{ backgroundColor: selectedColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              {showColorPicker && (
                <div className="label-color-grid">
                  {PRESET_COLORS.map((color) => (
                    <div
                      key={color}
                      className={`label-color-option ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
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
        <div className="label-modal-footer">
          <button 
            className="label-cancel-button" 
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button 
            className="label-save-button" 
            onClick={onSave}
            disabled={!newTitle.trim() || isSaving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {isSaving && <ImSpinner2 className="spin" style={{ fontSize: 18 }} />}
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
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, tagName, isDeleting }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="label-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="label-modal label-delete-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="label-modal-header label-delete-header">
          <FiAlertCircle size={20} color="#ff4c4c" />
          <h2>Confirmar Exclusão</h2>
        </div>
        
        <div className="label-modal-content label-delete-content">
          <p>
            Tem certeza que deseja excluir a etiqueta "{tagName}"?
          </p>
        </div>

        <div className="label-modal-footer">
          <button 
            className="label-cancel-button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button 
            className="label-delete-button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {isDeleting && <ImSpinner2 className="spin" style={{ fontSize: 18 }} />}
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
    const [isDeletingTag, setIsDeletingTag] = useState(false);
    const [isSavingTag, setIsSavingTag] = useState(false);

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
        setIsSavingTag(true);
        if (!validateForm()) {
            setIsSavingTag(false);
            return;
        }

        const sectorId = SessionService.getSectorId();
        if (!sectorId) {
            addToast('Selecione um setor antes de continuar', 'error');
            setIsSavingTag(false);
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
        setIsSavingTag(false);
    };

    const handleDelete = async (index: number) => {
        setIsDeletingTag(true);
        try {
            await deleteTag(tags[index].id);
            await fetchTags();
            setDeleteModalOpen(null);
            addToast('Etiqueta excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir etiqueta:', error);
            addToast('Erro ao excluir a etiqueta', 'error');
        }
        setIsDeletingTag(false);
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
            <div className="ls-container">
                <div className="ls-header">
                    <div className="ls-header-content">
                        <h1>Etiquetas</h1>
                        <p className="ls-header-description">Gerencie as etiquetas para organizar seus contatos</p>
                    </div>
                    <button 
                        className="ls-add-button"
                        onClick={handleAddNew}
                        disabled={!SessionService.getSectorId()}
                    >
                        <FiPlus />
                        Nova Etiqueta
                    </button>
                </div>

                <div className="ls-content">
                    {isLoading && SessionService.getSectorId() ? (
                        <div className="ls-loading">
                            <div className="ls-spinner" />
                        </div>
                    ) : !SessionService.getSectorId() ? (
                        <div className="ls-no-sector">
                            Nenhum setor selecionado
                        </div>
                    ) : tags.length === 0 ? (
                        <div className="ls-empty">
                            <div className="ls-empty-icon">
                                <FiAlertCircle />
                            </div>
                            <h3 className="ls-empty-title">Nenhuma etiqueta encontrada</h3>
                            <p className="ls-empty-description">Clique no botão "Nova Etiqueta" para começar</p>
                        </div>
                    ) : (
                        <div className="ls-table">
                            <div className="ls-row ls-row-header">
                                <div className="ls-name">Nome</div>
                                <div className="ls-description">Descrição</div>
                                <div className="ls-actions">Ações</div>
                            </div>
                            {tags.map((tag, index) => (
                                <div key={tag.id} className="ls-row">
                                    <div className="ls-name">
                                        <span 
                                            className="ls-color" 
                                            style={{ backgroundColor: tag.color }}
                                        ></span>
                                        {tag.name}
                                    </div>
                                    <div className="ls-description">
                                        {tag.description || "Sem descrição"}
                                    </div>
                                    <div className="ls-actions">
                                        <button 
                                            className="ls-action-button edit" 
                                            onClick={() => handleEdit(index)}
                                            title="Editar"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button 
                                            className="ls-action-button delete" 
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
                isSaving={isSavingTag}
            />

            <DeleteConfirmationModal
                isOpen={deleteModalOpen !== null}
                onClose={() => { if (!isDeletingTag) setDeleteModalOpen(null); }}
                onConfirm={() => { if (deleteModalOpen !== null && !isDeletingTag) handleDelete(deleteModalOpen); }}
                tagName={deleteModalOpen !== null ? tags[deleteModalOpen].name : ''}
                isDeleting={isDeletingTag}
            />

            <div className="ls-toast-container">
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
