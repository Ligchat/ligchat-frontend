import React, { useEffect, useState, useRef } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Picker from '@emoji-mart/react';
import {
  createMessageScheduling,
  CreateMessageSchedulingDTO,
  deleteMessageScheduling,
  getMessageSchedulings,
  updateMessageScheduling,
} from '../services/MessageSchedulingsService';
import { getTags, Tag } from '../services/LabelService';
import { getContacts, Contact } from '../services/ContactService';
import SessionService from '../services/SessionService';
import { getFlows } from '../services/FlowService';
import { getSector } from '../services/SectorService';
import './MessageSchedule.css';
import Toast from '../components/Toast';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const google = window.google;
const gapi = window.gapi;

const Icons = {
  Plus: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Calendar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Edit: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Delete: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18"></path>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Paperclip: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
  ),
  Picture: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  ),
  Smile: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
    </svg>
  ),
};

interface User {
  id: number;
  name: string;
  photoUrl?: string;
}

interface Message {
  id?: number;
  title: string;
  date: number | null;
  description: string;
  labels: string[];
  contactId: number | null;
  createdBy: User;
  contact: Contact;
}

const SCOPES = 'https://www.googleapis.com/auth/calendar';

const MOCK_USER = {
  id: 1,
  name: "Admin",
  photoUrl: "https://ui-avatars.com/api/?name=Admin&background=random"
};

const MessageSchedule: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [flows, setFlows] = useState([]);
  const [newMessage, setNewMessage] = useState<Message>({
    title: '',
    date: null,
    description: '',
    labels: [],
    contactId: null,
    createdBy: {} as User,
    contact: {} as Contact
  });
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isGeneratingMeetLink, setIsGeneratingMeetLink] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleApiKey, setGoogleApiKey] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(true);
  const [dateInputValue, setDateInputValue] = useState('');
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const sectorId = SessionService.getSectorId();
      setSelectedSector(sectorId);

      if (!sectorId) {
        setMessages([]);
        setTags([]);
        setContacts([]);
        return;
      }

      // Buscar tags e contatos primeiro
      const [tagsResponse, contactsResponse] = await Promise.all([
        getTags(sectorId),
        getContacts(sectorId)
      ]);

      // Definir tags e contatos
      setTags(tagsResponse.data || []);
      setContacts(contactsResponse.data || []);

      // Buscar mensagens agendadas
      try {
        const messagesResponse = await getMessageSchedulings();
        // Se tiver mensagens, mapear para o formato do componente
        const formattedMessages = messagesResponse.map(msg => {
          // Por enquanto, vamos usar o primeiro contato como padrão
          // TODO: Implementar a relação correta entre mensagem e contato quando disponível
          const defaultContact = contactsResponse.data[0];
          
          return {
            id: msg.id,
            title: msg.name,
            date: new Date(msg.sendDate).getTime(),
            description: msg.messageText,
            labels: msg.tagIds ? msg.tagIds.split(',') : [],
            contactId: defaultContact?.id || null,
            createdBy: MOCK_USER,
            contact: defaultContact
          };
        });

        setMessages(formattedMessages);
      } catch (error: any) {
        // Se for 404, significa que não há mensagens ainda
        if (error?.response?.status === 404) {
          setMessages([]);
        } else {
          // Se for outro erro, logar e mostrar array vazio
          console.error('Erro ao buscar mensagens:', error);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMessages([]);
      setTags([]);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    const handleSectorChange = () => {
      fetchInitialData();
    };

    window.addEventListener('sectorChanged', handleSectorChange);

    return () => {
      window.removeEventListener('sectorChanged', handleSectorChange);
    };
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(current => [...current, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string | null } = {};
    
    if (!newMessage.title.trim()) {
      newErrors.title = null;
    }
    
    if (!newMessage.date) {
      newErrors.date = null;
    }
    
    if (!newMessage.description.trim()) {
      newErrors.description = null;
    }
    
    if (!newMessage.contactId) {
      newErrors.contactId = null;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      addToast('Por favor, preencha todos os campos obrigatórios', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const sectorId = SessionService.getSectorId();
      
      if (!sectorId) {
        addToast('Nenhum setor selecionado', 'error');
        return;
      }

      const messageData: CreateMessageSchedulingDTO = {
        name: newMessage.title,
        messageText: newMessage.description,
        sendDate: new Date(newMessage.date!).toISOString(),
        contactId: newMessage.contactId!,
        sectorId: sectorId,
        status: true,
        tagIds: newMessage.labels.length > 0 ? newMessage.labels.join(',') : ''
      };

      if (currentMessageIndex !== null && newMessage.id) {
        // Atualizar mensagem existente
        await updateMessageScheduling(newMessage.id, messageData);
        addToast('Mensagem atualizada com sucesso', 'success');
      } else {
        // Criar nova mensagem
        await createMessageScheduling(messageData);
        addToast('Mensagem agendada com sucesso', 'success');
      }

      await fetchInitialData();
      closeDrawer();
    } catch (error: any) {
      console.error('Erro ao salvar mensagem:', error);
      addToast(error.response?.data?.message || 'Erro ao salvar mensagem', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const messageId = messages[index].id;
    if (!messageId) return;

    setIsLoading(true);
    try {
      await deleteMessageScheduling(messageId);
      addToast('Mensagem excluída com sucesso', 'success');
      await fetchInitialData();
    } catch (error: any) {
      console.error('Erro ao excluir mensagem:', error);
      addToast(error.response?.data?.message || 'Erro ao excluir mensagem', 'error');
    } finally {
      setConfirmDeleteIndex(null);
      setIsLoading(false);
    }
  };

  const showDrawer = (index: number | null = null) => {
    if (index !== null) {
      const message = messages[index];
      setCurrentMessageIndex(index);
      setNewMessage({
        id: message.id,
        title: message.title,
        date: message.date,
        description: message.description,
        labels: message.labels,
        contactId: message.contactId,
        createdBy: message.createdBy,
        contact: message.contact,
      });
    } else {
      setNewMessage({
        title: '',
        date: null,
        description: '',
        labels: [],
        contactId: null,
        createdBy: {} as User,
        contact: {} as Contact
      });
    }
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInputValue(value);
    
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setNewMessage({ ...newMessage, date: date.getTime() });
        if (errors.date !== undefined) {
          setErrors({ ...errors, date: null });
        }
      }
    } else {
      setNewMessage({ ...newMessage, date: null });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage({
      ...newMessage,
      description: e.target.value,
    });
  };

  const removeTag = (tagId: string) => {
    setNewMessage(prev => ({
      ...prev,
      labels: prev.labels.filter(id => id !== tagId)
    }));
  };

  const toggleTagSelection = (tagId: string) => {
    setNewMessage(prev => {
      const isSelected = prev.labels.includes(tagId);
      return {
        ...prev,
        labels: isSelected ? prev.labels.filter(id => id !== tagId) : [...prev.labels, tagId]
      };
    });
    setIsTagsDropdownOpen(false);
  };

  const renderMessageCard = (message: Message, index: number) => {
    if (confirmDeleteIndex === index) {
      return (
        <div className="confirm-delete">
          <h3>Deseja mesmo excluir?</h3>
          <p>Essa ação é irreversível.</p>
          <div className="confirm-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setConfirmDeleteIndex(null)}
            >
              Não
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => handleDelete(index)}
            >
              Sim
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="message-card">
        <div className="message-header">
          <h3 className="message-title">{message.title}</h3>
          <div className="message-actions">
            <button 
              className="action-button edit"
              onClick={() => showDrawer(index)}
            >
              <Icons.Edit />
            </button>
            <button 
              className="action-button delete"
              onClick={() => setConfirmDeleteIndex(index)}
            >
              <Icons.Delete />
            </button>
          </div>
        </div>
        
        <div className="message-creator">
          <img 
            src={message.createdBy.photoUrl || '/default-avatar.png'} 
            alt={message.createdBy.name}
            className="creator-avatar"
          />
          <span className="creator-name">{message.createdBy.name}</span>
        </div>

        <div className="message-recipient">
          <span className="recipient-label">Para:</span>
          <span className="recipient-name">{message.contact.name}</span>
        </div>

        <div className="message-date">
          {dayjs(message.date).format('DD/MM/YYYY HH:mm')}
        </div>
        
        <p className="message-description">
          {message.description}
        </p>
        
        <div className="labels-section">
          <div className="labels-title">Etiquetas</div>
          <div className="labels-container">
            {message.labels.map((labelId) => {
              const tag = tags.find(t => t.id === Number(labelId));
              return tag ? (
                <span key={labelId} className="label-tag">
                  {tag.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDrawer = () => {
    if (!isDrawerVisible) return null;

    return (
      <div className="schedule-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {currentMessageIndex !== null ? 'Editar mensagem' : 'Nova mensagem'}
          </h2>
        </div>

        <div className="form-group">
          <label className="form-label">Título <span className="required">*</span></label>
          <input
            type="text"
            className={`form-input ${errors.title !== undefined ? 'error' : ''}`}
            value={newMessage.title}
            onChange={(e) => {
              setNewMessage({ ...newMessage, title: e.target.value });
              if (errors.title !== undefined) {
                setErrors({ ...errors, title: null });
              }
            }}
            placeholder="Título da mensagem"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Data e Hora <span className="required">*</span></label>
          <div className="date-input-container">
            <input
              type="datetime-local"
              className={`${errors.date !== undefined ? 'error' : ''}`}
              value={dateInputValue}
              onChange={handleDateChange}
            />
            <Icons.Calendar />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mensagem <span className="required">*</span></label>
          <textarea
            className={`form-textarea ${errors.description !== undefined ? 'error' : ''}`}
            value={newMessage.description}
            onChange={(e) => {
              handleDescriptionChange(e);
              if (errors.description !== undefined) {
                setErrors({ ...errors, description: null });
              }
            }}
            placeholder="Digite sua mensagem aqui..."
            rows={4}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contato <span className="required">*</span></label>
          <select
            className={`form-select ${errors.contactId !== undefined ? 'error' : ''}`}
            value={newMessage.contactId || ''}
            onChange={(e) => {
              const selectedContact = contacts.find(c => c.id === Number(e.target.value));
              setNewMessage({ 
                ...newMessage, 
                contactId: Number(e.target.value),
                contact: selectedContact || {} as Contact
              });
              if (errors.contactId !== undefined) {
                setErrors({ ...errors, contactId: null });
              }
            }}
          >
            <option value="">Selecione um contato</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} ({contact.number})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Etiquetas</label>
          <div className="selected-tags">
            {newMessage.labels.map((labelId) => {
              const tag = tags.find(t => t.id === Number(labelId));
              return tag ? (
                <span 
                  key={labelId} 
                  className="selected-tag"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` }}
                >
                  {tag.name}
                  <span 
                    className="tag-remove"
                    onClick={() => removeTag(String(tag.id))}
                  >
                    ×
                  </span>
                </span>
              ) : null;
            })}
          </div>
          <div className="tags-dropdown">
            <button
              className="form-input"
              onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
            >
              Selecionar etiquetas
            </button>
            {isTagsDropdownOpen && (
              <div className="tags-dropdown-content">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`tags-dropdown-item ${
                      newMessage.labels.includes(String(tag.id)) ? 'selected' : ''
                    }`}
                    onClick={() => toggleTagSelection(String(tag.id))}
                    style={{ 
                      backgroundColor: newMessage.labels.includes(String(tag.id)) ? `${tag.color}20` : 'transparent',
                      color: tag.color
                    }}
                  >
                    {tag.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={closeDrawer}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="schedule-screen">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="schedule-header">
        <div className="header-content">
          <h1>Agendamento de mensagem</h1>
          <p className="header-description">
            Gerencie suas mensagens agendadas
          </p>
        </div>
      </div>

      <div className="schedule-content">
        {!selectedSector ? (
          <div className="no-sector-text">
            Nenhum setor selecionado
          </div>
        ) : (
          <div className="messages-grid">
            {messages.map((message, index) => (
              <div key={message.id || index}>
                {renderMessageCard(message, index)}
              </div>
            ))}
            <div 
              className="add-message-card"
              onClick={() => showDrawer(null)}
            >
              <Icons.Plus />
            </div>
          </div>
        )}
      </div>

      {renderDrawer()}

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

export default MessageSchedule;
