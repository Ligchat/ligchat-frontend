import React from 'react';
import { FiX } from 'react-icons/fi';
import ReactDOM from 'react-dom';

interface LabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  newTitle: string;
  setNewTitle: (value: string) => void;
  newDescription: string;
  setNewDescription: (value: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  errors: {
    title?: string;
    description?: string;
  };
}

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
  '#1ABC9C', '#F1C40F', '#7F8C8D', '#00ADB5', '#FF8C94'
];

const LabelModal: React.FC<LabelModalProps> = ({
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
}) => {
  if (!isOpen) return null;
  
  // Usando portal para garantir que o modal seja renderizado no body
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={(e) => {
      // Fecha o modal ao clicar no overlay
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="label-name">
              Nome <span className="required">*</span>
            </label>
            <input
              id="label-name"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Digite o nome da etiqueta"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && (
              <span className="error-message">{errors.title}</span>
            )}
          </div>

          <div className="form-group">
            <label>Cor da Etiqueta</label>
            <div className="color-picker">
              <div 
                className="color-preview"
                style={{ backgroundColor: selectedColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              {showColorPicker && (
                <div className="color-grid">
                  {PRESET_COLORS.map((color) => (
                    <div
                      key={color}
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
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

          <div className="form-group">
            <label htmlFor="label-description">Descrição</label>
            <textarea
              id="label-description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Digite uma descrição (opcional)"
              rows={3}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
            <span className="char-count">
              {newDescription.length}/200 caracteres
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancelar
          </button>
          <button 
            className="save-button" 
            onClick={onSave}
            disabled={!newTitle.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LabelModal; 