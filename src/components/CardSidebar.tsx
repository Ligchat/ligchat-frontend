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
  FiInfo,
  FiX,
  FiSave,
  FiTrash2,
  FiChevronDown,
  FiCheck,
  FiFlag
} from 'react-icons/fi';
import '../styles/CardSidebar.css';
import SessionService from '../services/SessionService';
import { getTags, Tag } from '../services/LabelService';
import { getAllUsers, User } from '../services/UserService';
import Toast from './Toast';

interface Card {
  id: string;
  title: string;
  content: string;
  email?: string;
  phone?: string;
  assignedTo?: string | number;
  assigneeAvatar?: string;
  createdAt?: string;
  lastContact?: string;
  notes?: string[];
  priority?: 'high' | 'medium' | 'low';
  contactId: number;
  tagId?: number;
  columnId?: number;
  sectorId: number;
  position?: number;
  user_id?: number;
  number?: string;
  name?: string;
}

interface CardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: Card) => Promise<void>;
  selectedCard: Card | null;
  isNewCard?: boolean;
  columnId?: string;
  addToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  mode?: 'chat' | 'crm';
}

const CardSidebar: React.FC<CardSidebarProps> = ({ 
  selectedCard, 
  isOpen, 
  onClose, 
  onSave,
  isNewCard = false,
  columnId,
  addToast,
  mode = 'crm'
}) => {
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPriorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [isResponsibleDropdownOpen, setResponsibleDropdownOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Inicializa o card em edição quando um novo card é recebido
  useEffect(() => {
    if (isNewCard) {
      setEditingCard({
        id: `card${Date.now()}`,
        title: '',
        content: '',
        createdAt: new Date().toISOString().split('T')[0],
        columnId: columnId ? parseInt(columnId) : undefined,
        sectorId: SessionService.getSectorId() || 0,
        position: 0,
        contactId: 0
      });
      setIsEditing(true);
    } else if (selectedCard) {
      const normalizedCard: Card = mode === 'chat' ? {
        ...selectedCard,
        title: selectedCard.name || selectedCard.title,
        phone: selectedCard.number || selectedCard.phone,
        content: selectedCard.notes?.toString() || selectedCard.content
      } : selectedCard;
      
      setEditingCard(normalizedCard);
    }
  }, [selectedCard, isNewCard, columnId, mode]);

  // Adicionar useEffect para fechar os dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.contact-select')) {
        setPriorityDropdownOpen(false);
        setTagDropdownOpen(false);
        setResponsibleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Adicione este useEffect para carregar as tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const sectorId = SessionService.getSectorId() || 0;
        const tagsData = await getTags(sectorId);
        setTags(tagsData.data);
      } catch (error) {
        console.error('Erro ao carregar tags:', error);
      }
    };
    loadTags();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };
    loadUsers();
  }, []);

  if ((!selectedCard && !isNewCard) || !isOpen) return null;

  // Função para atualizar o card em edição
  const updateEditingCard = (field: keyof Card, value: any) => {
    if (editingCard) {
      setEditingCard({
        ...editingCard,
        [field]: value
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
    } else if (selectedCard) {
      setEditingCard({...selectedCard});
      setIsEditing(false);
    }
  };

  // Função para salvar as alterações
  const saveChanges = async () => {
    if (!editingCard) return;
    
    const requiredField = mode === 'chat' ? 'name' : 'title';
    const fieldLabel = mode === 'chat' ? 'nome do contato' : 'título do lead';
    
    if (!editingCard[requiredField]?.trim() && !editingCard.title?.trim()) {
      addToast?.(`Por favor, preencha o ${fieldLabel}.`, 'error');
      return;
    }
    
    try {
      const normalizedCard: Card = mode === 'chat' ? {
        ...editingCard,
        name: editingCard.title,
        number: editingCard.phone,
        notes: editingCard.content ? [editingCard.content] : undefined
      } : editingCard;

      await onSave(normalizedCard);
      addToast?.(mode === 'chat' ? 'Contato atualizado com sucesso!' : 'Lead atualizado com sucesso!', 'success');
      handleClose();
    } catch (error) {
      addToast?.(mode === 'chat' ? 'Erro ao salvar o contato.' : 'Erro ao salvar o lead.', 'error');
    }
  };

  // Função para confirmar antes de fechar se estiver editando
  const handleClose = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    onClose();
  };

  // Opções para o select de prioridade
  const priorityOptions = [
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Média' },
    { value: 'low', label: 'Baixa' }
  ];

  // Estilos customizados para os selects (mesmo estilo do select de contato)
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#1e1e1e',
      borderColor: '#333',
      minHeight: '45px',
      '&:hover': {
        borderColor: '#444'
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#1e1e1e',
      border: '1px solid #333'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#252525' : '#1e1e1e',
      color: '#e0e0e0',
      '&:hover': {
        backgroundColor: '#252525'
      }
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#e0e0e0'
    }),
    input: (base: any) => ({
      ...base,
      color: '#e0e0e0'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#666'
    })
  };

  // Adicione esta função helper para formatar a data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Adicione esta função para gerar as iniciais
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className={`card-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose}></div>
      <div className={`card-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="card-sidebar-header">
          <div className="card-sidebar-actions">
            <button className="sidebar-icon-button" onClick={handleClose}>
              <FiX />
            </button>
          </div>
          <h2>
            {isNewCard ? (mode === 'chat' ? "Novo Contato" : "Novo Lead") : 
             isEditing ? (mode === 'chat' ? "Editar Contato" : "Editar Lead") : 
             editingCard?.title}
          </h2>
        </div>

        <div className="card-sidebar-content">
          {isEditing || isNewCard ? (
            <div className="card-edit-form">
              <div className="form-group">
                <label htmlFor="edit-title">
                  {mode === 'chat' ? 'Nome do Contato' : 'Título do Lead'} 
                  <span className="required">*</span>
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editingCard?.title || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 50) {
                      updateEditingCard('title', value);
                      if (mode === 'chat') {
                        updateEditingCard('name', value);
                      }
                    }
                  }}
                  placeholder={mode === 'chat' ? "Digite o nome do contato" : "Digite o título do lead"}
                  maxLength={50}
                />
                <div className="character-count">
                  {`${editingCard?.title?.length || 0}/50`}
                </div>
              </div>

              {mode === 'chat' && (
                <div className="form-group">
                  <label htmlFor="edit-phone">Telefone <span className="required">*</span></label>
                  <input
                    id="edit-phone"
                    type="text"
                    value={editingCard?.phone || ''}
                    onChange={(e) => {
                      updateEditingCard('phone', e.target.value);
                      updateEditingCard('number', e.target.value);
                    }}
                    placeholder="Digite o telefone"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editingCard?.email || ''}
                  onChange={(e) => updateEditingCard('email', e.target.value)}
                  placeholder="Digite o email"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-content">{mode === 'chat' ? 'Observações' : 'Descrição'}</label>
                <textarea
                  id="edit-content"
                  value={editingCard?.content || ''}
                  onChange={(e) => updateEditingCard('content', e.target.value)}
                  placeholder={mode === 'chat' ? "Observações sobre o contato" : "Descrição do lead"}
                  rows={3}
                />
              </div>

              {mode === 'crm' && (
                <div className="form-group">
                  <label>Prioridade</label>
                  <div className="contact-select">
                    <div 
                      className="select-input"
                      onClick={() => setPriorityDropdownOpen(!isPriorityDropdownOpen)}
                    >
                      <input
                        type="text"
                        value={editingCard?.priority ? 
                          editingCard.priority === 'high' ? 'Alta' :
                          editingCard.priority === 'medium' ? 'Média' : 'Baixa'
                          : ''
                        }
                        readOnly
                        placeholder="Selecione a prioridade"
                      />
                      <FiChevronDown className={`dropdown-icon ${isPriorityDropdownOpen ? 'open' : ''}`} />
                    </div>
                    {isPriorityDropdownOpen && (
                      <div className="contact-dropdown">
                        <div className="contact-option" onClick={() => {
                          updateEditingCard('priority', 'high');
                          setPriorityDropdownOpen(false);
                        }}>
                          Alta
                        </div>
                        <div className="contact-option" onClick={() => {
                          updateEditingCard('priority', 'medium');
                          setPriorityDropdownOpen(false);
                        }}>
                          Média
                        </div>
                        <div className="contact-option" onClick={() => {
                          updateEditingCard('priority', 'low');
                          setPriorityDropdownOpen(false);
                        }}>
                          Baixa
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label>Tag</label>
                <div className="contact-select">
                  <div 
                    className="select-input"
                    onClick={() => setTagDropdownOpen(!isTagDropdownOpen)}
                  >
                    <input
                      type="text"
                      value={editingCard?.tagId ? 
                        tags.find(t => t.id === editingCard.tagId)?.name || '' 
                        : ''
                      }
                      readOnly
                      placeholder="Selecione uma tag"
                    />
                    <FiChevronDown className={`dropdown-icon ${isTagDropdownOpen ? 'open' : ''}`} />
                  </div>
                  {isTagDropdownOpen && (
                    <div className="contact-dropdown">
                      <div 
                        className="contact-option"
                        onClick={() => {
                          updateEditingCard('tagId', undefined);
                          setTagDropdownOpen(false);
                        }}
                      >
                        Nenhuma tag
                      </div>
                      {tags.map(tag => (
                        <div 
                          key={tag.id}
                          className="contact-option"
                          onClick={() => {
                            updateEditingCard('tagId', tag.id);
                            setTagDropdownOpen(false);
                          }}
                        >
                          {tag.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Responsável</label>
                <div className="contact-select">
                  <div 
                    className="select-input"
                    onClick={() => setResponsibleDropdownOpen(!isResponsibleDropdownOpen)}
                  >
                    <input
                      type="text"
                      value={editingCard?.assignedTo ? 
                        users.find(u => Number(u.id) === Number(editingCard.assignedTo))?.name || '' 
                        : ''
                      }
                      readOnly
                      placeholder="Selecione um responsável"
                    />
                    <FiChevronDown className={`dropdown-icon ${isResponsibleDropdownOpen ? 'open' : ''}`} />
                  </div>
                  {isResponsibleDropdownOpen && (
                    <div className="contact-dropdown">
                      <div 
                        className="contact-option"
                        onClick={() => {
                          updateEditingCard('assignedTo', null);
                          setResponsibleDropdownOpen(false);
                        }}
                      >
                        Nenhum Responsável
                      </div>
                      {users.map(user => (
                        <div 
                          key={user.id}
                          className="contact-option"
                          onClick={() => {
                            updateEditingCard('assignedTo', Number(user.id));
                            setResponsibleDropdownOpen(false);
                          }}
                        >
                          {user.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
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
                  {(editingCard?.phone || editingCard?.number) ? (
                    <div className="card-sidebar-info-item">
                      <span className="info-label"><FiPhone /> Telefone:</span>
                      <span className="info-value">{editingCard.phone || editingCard.number}</span>
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
                <h3><FiInfo /> {mode === 'chat' ? 'Status do Contato' : 'Status do Lead'}</h3>
                <div className="card-sidebar-info">
                  {editingCard?.assignedTo ? (
                    <div className="card-sidebar-info-item">
                      <span className="info-label"><FiUser /> Responsável:</span>
                      <span className="info-value">
                        {users.find(u => Number(u.id) === Number(editingCard.assignedTo))?.name || 'Não encontrado'}
                      </span>
                    </div>
                  ) : (
                    <div className="card-sidebar-info-item empty">
                      <span className="info-label"><FiUser /> Responsável:</span>
                      <span className="info-value empty">Sem Responsável</span>
                    </div>
                  )}
                  
                  {editingCard?.createdAt && (
                    <div className="card-sidebar-info-item">
                      <span className="info-label"><FiCalendar /> Criado em:</span>
                      <span className="info-value">{formatDate(editingCard.createdAt)}</span>
                    </div>
                  )}
                  {editingCard?.lastContact ? (
                    <div className="card-sidebar-info-item">
                      <span className="info-label"><FiClock /> Último contato:</span>
                      <span className="info-value">{formatDate(editingCard.lastContact)}</span>
                    </div>
                  ) : (
                    <div className="card-sidebar-info-item empty">
                      <span className="info-label"><FiClock /> Último contato:</span>
                      <span className="info-value empty">Sem contato</span>
                    </div>
                  )}
                  {mode === 'crm' && editingCard?.priority ? (
                    <div className="card-sidebar-info-item">
                      <span className="info-label"><FiFlag /> Prioridade:</span>
                      <span className={`info-value priority-label ${editingCard.priority}`}>
                        {editingCard.priority === 'high' ? 'Alta' : 
                         editingCard.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                  ) : mode === 'crm' && (
                    <div className="card-sidebar-info-item empty">
                      <span className="info-label"><FiFlag /> Prioridade:</span>
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
              >
                <FiSave /> {isNewCard ? 
                  (mode === 'chat' ? "Criar Contato" : "Criar Lead") : 
                  "Atualizar dados"}
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
                  if (window.confirm(`Tem certeza que deseja excluir este ${mode === 'chat' ? 'contato' : 'lead'}?`)) {
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
    </>
  );
};

export default CardSidebar; 