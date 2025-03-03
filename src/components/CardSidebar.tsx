import React, { useState, useEffect } from 'react';
import { 
  FiPhone, 
  FiMail, 
  FiUser, 
  FiCalendar, 
  FiClock, 
  FiTag, 
  FiEdit, 
  FiPlus, 
  FiMessageSquare,
  FiInfo,
  FiCheckSquare,
  FiFileText,
  FiSend,
  FiX,
  FiSave,
  FiTrash2
} from 'react-icons/fi';
import '../styles/CardSidebar.css';


interface Card {
  id: string;
  title: string;
  content: string;
  labels?: string[];
  email?: string;
  phone?: string;
  status?: string;
  assignedTo?: string;
  assigneeAvatar?: string;
  createdAt?: string;
  lastContact?: string;
  notes?: string[];
  priority?: 'high' | 'medium' | 'low';
}

interface CardSidebarProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Card) => void;
  isNewCard?: boolean;
  columnId?: string;
}

const CardSidebar: React.FC<CardSidebarProps> = ({ 
  card, 
  isOpen, 
  onClose, 
  onSave,
  isNewCard = false,
  columnId
}) => {
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Inicializa o card em edição quando um novo card é recebido
  useEffect(() => {
    if (isNewCard) {
      // Cria um novo card com valores padrão
      setEditingCard({
        id: `card${Date.now()}`,
        title: '',
        content: '',
        status: 'Novo',
        createdAt: new Date().toISOString().split('T')[0],
        labels: []
      });
      setIsEditing(true);
    } else if (card) {
      setEditingCard({...card});
    }
  }, [card, isNewCard]);

  if ((!card && !isNewCard) || !isOpen) return null;

  // Função para atualizar o card em edição
  const updateEditingCard = (field: keyof Card, value: any) => {
    if (editingCard) {
      setEditingCard({
        ...editingCard,
        [field]: value
      });
    }
  };

  // Função para adicionar uma nova tag/label
  const addNewLabel = (label: string) => {
    if (editingCard && label.trim()) {
      const currentLabels = editingCard.labels || [];
      if (!currentLabels.includes(label.trim())) {
        setEditingCard({
          ...editingCard,
          labels: [...currentLabels, label.trim()]
        });
      }
    }
  };

  // Função para remover uma tag/label
  const removeLabel = (labelToRemove: string) => {
    if (editingCard && editingCard.labels) {
      setEditingCard({
        ...editingCard,
        labels: editingCard.labels.filter(label => label !== labelToRemove)
      });
    }
  };

  // Função para iniciar a edição
  const startEditing = () => {
    setIsEditing(true);
  };

  // Função para cancelar a edição
  const cancelEditing = () => {
    if (isNewCard) {
      onClose();
    } else if (card) {
      setEditingCard({...card});
      setIsEditing(false);
    }
  };

  // Função para salvar as alterações
  const saveChanges = () => {
    if (editingCard) {
      onSave(editingCard);
      if (isNewCard) {
        onClose();
      } else {
        setIsEditing(false);
      }
    }
  };

  // Função para confirmar antes de fechar se estiver editando
  const handleClose = () => {
    if (isEditing && !isNewCard) {
      if (window.confirm("Descartar alterações?")) {
        cancelEditing();
        onClose();
      }
    } else if (isNewCard) {
      if (window.confirm("Descartar novo lead?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className={`card-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="card-sidebar-header">
        <div className="card-sidebar-actions">
          <button className="sidebar-icon-button" onClick={handleClose}>
            <FiX />
          </button>
        </div>
        <h2>{isNewCard ? "Novo Lead" : isEditing ? "Editar Lead" : editingCard?.title}</h2>
        <p className="card-sidebar-subtitle">
          {isNewCard ? "Adicionar novo lead" : isEditing ? "Editar informações do lead" : "Lead sem número"}
        </p>
      </div>

      <div className="card-sidebar-content">
        {isEditing || isNewCard ? (
          // Modo de edição
          <div className="card-edit-form">
            <div className="form-group">
              <label htmlFor="edit-title">Nome <span className="required">*</span></label>
              <input
                id="edit-title"
                type="text"
                value={editingCard?.title || ''}
                onChange={(e) => updateEditingCard('title', e.target.value)}
                placeholder="Nome do contato"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-content">Descrição</label>
              <textarea
                id="edit-content"
                value={editingCard?.content || ''}
                onChange={(e) => updateEditingCard('content', e.target.value)}
                placeholder="Descrição do lead"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-phone">Telefone</label>
              <div className="input-with-icon">
                <FiPhone className="input-icon" />
                <input
                  id="edit-phone"
                  type="text"
                  value={editingCard?.phone || ''}
                  onChange={(e) => updateEditingCard('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-email">Email</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  id="edit-email"
                  type="email"
                  value={editingCard?.email || ''}
                  onChange={(e) => updateEditingCard('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-status">Status</label>
              <select
                id="edit-status"
                value={editingCard?.status || ''}
                onChange={(e) => updateEditingCard('status', e.target.value)}
              >
                <option value="">Selecione um status</option>
                <option value="Novo">Novo</option>
                <option value="Contato Inicial">Contato Inicial</option>
                <option value="Qualificado">Qualificado</option>
                <option value="Proposta">Proposta</option>
                <option value="Negociação">Negociação</option>
                <option value="Fechado">Fechado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-priority">Prioridade</label>
              <select
                id="edit-priority"
                value={editingCard?.priority || ''}
                onChange={(e) => updateEditingCard('priority', e.target.value as 'high' | 'medium' | 'low' | undefined)}
              >
                <option value="">Sem prioridade</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-assignedTo">Responsável</label>
              <div className="input-with-icon">
                <FiUser className="input-icon" />
                <input
                  id="edit-assignedTo"
                  type="text"
                  value={editingCard?.assignedTo || ''}
                  onChange={(e) => updateEditingCard('assignedTo', e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-editor">
                <div className="current-tags">
                  {editingCard?.labels && editingCard.labels.map((label, index) => (
                    <div key={index} className="tag-item">
                      <span>{label}</span>
                      <button 
                        type="button" 
                        className="tag-remove" 
                        onClick={() => removeLabel(label)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="add-tag-form">
                  <input
                    type="text"
                    placeholder="Nova tag"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTagInput.trim()) {
                        e.preventDefault();
                        addNewLabel(newTagInput);
                        setNewTagInput('');
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className="add-tag-button"
                    onClick={() => {
                      if (newTagInput.trim()) {
                        addNewLabel(newTagInput);
                        setNewTagInput('');
                      }
                    }}
                  >
                    <FiPlus /> Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Modo de visualização
          <>
            <div className="card-sidebar-section">
              <h3><FiUser /> Informações de Contato</h3>
              <div className="card-sidebar-info">
                {editingCard?.email ? (
                  <div className="card-sidebar-info-item">
                    <span className="info-label"><FiMail /> Email:</span>
                    <span className="info-value">{editingCard.email}</span>
                  </div>
                ) : (
                  <div className="card-sidebar-info-item empty">
                    <span className="info-label"><FiMail /> Email:</span>
                    <span className="info-value empty">Não informado</span>
                  </div>
                )}
                {editingCard?.phone ? (
                  <div className="card-sidebar-info-item">
                    <span className="info-label"><FiPhone /> Telefone:</span>
                    <span className="info-value">{editingCard.phone}</span>
                  </div>
                ) : (
                  <div className="card-sidebar-info-item empty">
                    <span className="info-label"><FiPhone /> Telefone:</span>
                    <span className="info-value empty">Não informado</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card-sidebar-section">
              <h3><FiInfo /> Status do Lead</h3>
              <div className="card-sidebar-info">
                {editingCard?.status ? (
                  <div className="card-sidebar-info-item">
                    <span className="info-label"><FiTag /> Status:</span>
                    <span className="info-value">{editingCard.status}</span>
                  </div>
                ) : (
                  <div className="card-sidebar-info-item empty">
                    <span className="info-label"><FiTag /> Status:</span>
                    <span className="info-value empty">Não definido</span>
                  </div>
                )}
                {editingCard?.assignedTo ? (
                  <div className="card-sidebar-info-item">
                    <span className="info-label"><FiUser /> Responsável:</span>
                    <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {editingCard.assigneeAvatar ? (
                        <div className="assignee-avatar" style={{ width: '24px', height: '24px' }}>
                          <img src={editingCard.assigneeAvatar} alt={editingCard.assignedTo} />
                        </div>
                      ) : (
                        <FiUser />
                      )}
                      {editingCard.assignedTo}
                    </div>
                  </div>
                ) : (
                  <div className="card-sidebar-info-item empty">
                    <span className="info-label"><FiUser /> Responsável:</span>
                    <span className="info-value empty">Não atribuído</span>
                  </div>
                )}
                {editingCard?.createdAt && (
                  <div className="card-sidebar-info-item">
                    <span className="info-label"><FiCalendar /> Criado em:</span>
                    <span className="info-value">{editingCard.createdAt}</span>
                  </div>
                )}
                {editingCard?.lastContact ? (
                  <div className="card-sidebar-info-item">
                    <span className="info-label"><FiClock /> Último contato:</span>
                    <span className="info-value">{editingCard.lastContact}</span>
                  </div>
                ) : (
                  <div className="card-sidebar-info-item empty">
                    <span className="info-label"><FiClock /> Último contato:</span>
                    <span className="info-value empty">Sem contato</span>
                  </div>
                )}
                {editingCard?.priority ? (
                  <div className="card-sidebar-info-item">
                    <span className="info-label"><FiTag /> Prioridade:</span>
                    <span className={`info-value priority-tag ${editingCard.priority}`}>
                      {editingCard.priority === 'high' ? 'Alta' : 
                       editingCard.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                ) : (
                  <div className="card-sidebar-info-item empty">
                    <span className="info-label"><FiTag /> Prioridade:</span>
                    <span className="info-value empty">Não definida</span>
                  </div>
                )}
              </div>
            </div>
            
            
          </>
        )}
      </div>

      <div className="card-sidebar-footer">
        {isEditing || isNewCard ? (
          <>
            <button 
              className="sidebar-button secondary"
              onClick={cancelEditing}
            >
              Cancelar
            </button>
            <button 
              className="sidebar-button primary"
              onClick={saveChanges}
              disabled={!editingCard?.title}
            >
              <FiSave /> {isNewCard ? "Criar Lead" : "Atualizar dados"}
            </button>
          </>
        ) : (
          <>
            <button 
              className="sidebar-button primary"
              onClick={startEditing}
            >
              <FiEdit /> Editar
            </button>
            <button 
              className="sidebar-button danger"
              onClick={() => {
                if (window.confirm("Tem certeza que deseja excluir este lead?")) {
                  // Lógica para excluir o card
                  onClose();
                }
              }}
            >
              <FiTrash2 /> Excluir
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CardSidebar; 