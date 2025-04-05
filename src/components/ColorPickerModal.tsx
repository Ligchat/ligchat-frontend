import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface ColorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  visible,
  onClose,
  onSave
}) => {
  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#00c2ff');
  const [error, setError] = useState('');

  const colors = [
    '#00c2ff', '#ff4c4c', '#00c853', '#ffaa00', '#9c27b0',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688',
    '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107',
    '#ff9800', '#ff5722', '#795548', '#607d8b', '#e91e63'
  ];

  const handleSave = () => {
    if (!tagName.trim()) {
      setError('O nome da etiqueta é obrigatório');
      return;
    }
    onSave(tagName, selectedColor);
    setTagName('');
    setSelectedColor('#00c2ff');
    setError('');
  };

  if (!visible) return null;

  return (
    <div className="enhanced-modal-overlay" onClick={onClose}>
      <div className="enhanced-modal" onClick={e => e.stopPropagation()}>
        <div className="enhanced-modal-header">
          <h3>Nova Etiqueta</h3>
          <button className="enhanced-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="enhanced-modal-content">
          <div className="form-group">
            <label>Nome da Etiqueta</label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => {
                setTagName(e.target.value);
                setError('');
              }}
              placeholder="Digite o nome da etiqueta"
              className={error ? 'input-error' : ''}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="form-group">
            <label>Cor da Etiqueta</label>
            <div className="color-grid">
              {colors.map((color) => (
                <div
                  key={color}
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="tag-preview">
            <label>Prévia:</label>
            <div 
              className="tag-sample"
              style={{ 
                backgroundColor: `${selectedColor}15`,
                color: selectedColor,
                border: `1px solid ${selectedColor}30`
              }}
            >
              {tagName || 'Nome da etiqueta'}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="form-button secondary" onClick={onClose}>
            Cancelar
          </button>
          <button 
            className="form-button primary"
            onClick={handleSave}
            disabled={!tagName.trim()}
          >
            Criar Etiqueta
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerModal; 