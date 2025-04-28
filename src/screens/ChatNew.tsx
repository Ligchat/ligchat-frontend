import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import '../styles/Chat/ChatNew.css';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import SessionService from '../services/SessionService';
import { getContacts, updateContact, createContact, deleteContactFromSector, markContactAsViewed } from '../services/ContactService';
import { sendMessage, sendFile, MessageResponse, sendAudioMessage } from '../services/MessageService';
import { getSector, Sector } from '../services/SectorService';
import { getMessagesByContactId } from '../services/MessageService';
import { AudioMessage } from '../components/AudioMessage';
import { AudioRecorder } from '../components/AudioRecorder';
import {  FiPhone, FiMoreVertical, FiUserPlus, FiTag, FiUsers } from 'react-icons/fi';
import { getAllUsers, User } from '../services/UserService';
import { getTags, Tag } from '../services/LabelService';
import { useLocation } from 'react-router-dom';
import ChatWebSocketService from '../services/ChatWebSocketService';
import { UserPlus } from 'lucide-react';
import InputMask from 'react-input-mask';
import { getUser } from '../services/UserService';

dayjs.extend(utc);
dayjs.extend(timezone);

const MESSAGES_PAGE_SIZE = 5;

const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
  </svg>
);

const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14C13.66 14 14.99 12.66 14.99 11L15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.3 11C17.3 14 14.76 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C16.28 17.24 19 14.42 19 11H17.3Z" fill="currentColor"/>
  </svg>
);

const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
  </svg>
);

// Novo ícone para vídeo
const VideoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3ZM9 17V7L16 12L9 17Z" fill="currentColor"/>
  </svg>
);

// Ícone de play para usar no thumbnail do vídeo
const PlayIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)" />
    <path d="M10 8L16 12L10 16V8Z" fill="white" />
  </svg>
);

// Componente para exibir thumbnail de vídeos
const VideoThumbnail: React.FC<{ src: string }> = ({ src }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoad = () => {
        try {
          // Certifica-se de que o vídeo está carregado o suficiente para gerar o thumbnail
          video.currentTime = 1.0; // Define para 1 segundo para pegar um frame real do vídeo
          
          // Esperar o currentTime ser aplicado
          const handleTimeUpdate = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg');
              setThumbnail(dataUrl);
              
              // Remover o listener após capturar o thumbnail
              video.removeEventListener('timeupdate', handleTimeUpdate);
            } catch (error) {
              console.error('Erro ao gerar thumbnail:', error);
            }
          };
          
          video.addEventListener('timeupdate', handleTimeUpdate);
        } catch (error) {
          console.error('Erro ao carregar vídeo para thumbnail:', error);
        }
      };
      
      // Adicionar listener para quando os metadados estiverem carregados
      video.addEventListener('loadedmetadata', handleLoad);
      
      // Limpar event listeners ao desmontar
      return () => {
        video.removeEventListener('loadedmetadata', handleLoad);
        video.removeEventListener('timeupdate', () => {});
      };
    }
  }, [src]);

  return (
    <>
      {/* Vídeo oculto usado apenas para gerar o thumbnail */}
      <video 
        ref={videoRef} 
        src={src}
        style={{ display: 'none' }}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      {/* Se o thumbnail estiver disponível, mostrar a imagem */}
      {thumbnail ? (
        <img 
          src={thumbnail} 
          alt="Prévia do vídeo" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            borderRadius: 'inherit'
          }}
        />
      ) : (
        // Fundo preto enquanto carrega
        <div style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center' 
        }}>
          <div style={{ color: '#666', fontSize: '14px' }}>Carregando prévia...</div>
        </div>
      )}
    </>
  );
};

// Novo componente de ícone para o botão voltar
const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
  </svg>
);

// Tipos
interface OriginalContactData {
  id: number;
  name: string;
  tagId: number | null;
  number: string;
  avatarUrl: string | null;
  email: string;
  notes: string | null;
  sectorId: number;
  isActive: boolean;
  priority: string;
  contactStatus: string;
  aiActive: number;
  assignedTo: number | null;
  assignedToName?: string | null;
  createdAt: string;
  profilePicture?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  is_viewed: boolean;
}

interface Message extends MessageResponse {
  status?: 'sending' | 'sent' | 'error';
  mediaUrl: string | null;
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
}

// Adicionar função de formatação de telefone antes do componente ChatNew
const formatPhoneNumber = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  let ddi = '';
  let cleanNumber = numbers;
  
  if (numbers.startsWith('55')) {
    ddi = '+55';
    cleanNumber = numbers.slice(2);
  }
  
  if (cleanNumber.length === 11) {
    return `${ddi} (${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 7)}-${cleanNumber.slice(7)}`;
  }
  
  if (cleanNumber.length === 10) {
    return `${ddi} (${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 6)}-${cleanNumber.slice(6)}`;
  }
  
  return phone;
};

type ChatNewProps = {
  hasNewMessages?: { [contactId: number]: boolean };
  setHasNewMessages?: (newState: { [contactId: number]: boolean }) => void;
  contacts?: ContactData[];
  setContacts?: React.Dispatch<React.SetStateAction<ContactData[]>>;
};

type ContactData = OriginalContactData;

const ContactItem = React.memo(({ contact, selectedContactId, onSelect, tags, hasUnread }: { contact: ContactData, selectedContactId: number | null, onSelect: (c: ContactData) => void, tags: Tag[], hasUnread?: boolean }) => {
  const initials = useMemo(() => contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2), [contact.name]);
  return (
    <div
      className={`contact-item ${selectedContactId === contact.id ? 'selected' : ''}`}
      onClick={() => onSelect(contact)}
    >
      <div className="contact-avatar">
        {contact.avatarUrl ? (
          <img 
            src={contact.avatarUrl} 
            alt={contact.name} 
            className="avatar-image"
            style={{
              border: contact.tagId ? `3px solid ${tags.find(t => t.id === contact.tagId)?.color || 'transparent'}` : 'none',
              borderRadius: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div 
            className="avatar-initials"
            style={{
              border: contact.tagId ? `3px solid ${tags.find(t => t.id === contact.tagId)?.color || 'transparent'}` : 'none'
            }}
          >
            {initials}
          </div>
        )}
        {hasUnread && <span className="unread-indicator" />}
      </div>
      <div className="contact-info">
        <div className="contact-header">
          <div className="contact-name">{contact.name}</div>
          {contact.lastMessageTime && (
            <span className="message-time">
              {dayjs(contact.lastMessageTime).format('HH:mm')}
            </span>
          )}
        </div>
        <div className="contact-number">{formatPhoneNumber(contact.number)}</div>
      </div>
    </div>
  );
});

const RenderContacts = React.memo(({
  contacts,
  selectedContact,
  onSelect,
  tags,
  hasNewMessages
}: {
  contacts: ContactData[],
  selectedContact: ContactData | null,
  onSelect: (c: ContactData) => void,
  tags: Tag[],
  hasNewMessages: { [contactId: number]: boolean }
}) => {
  if (contacts.length === 0) {
    return (
      <div className="contacts-empty-state">
        <div className="contacts-empty-content">
          <div className="contacts-empty-icon">
            <FiUsers size={40} />
          </div>
          <h4>Nenhum contato encontrado</h4>
          <p>Adicione um novo contato para iniciar uma conversa</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="contacts-list">
      {contacts.map((contact) => (
        <ContactItem 
          key={contact.id} 
          contact={contact} 
          selectedContactId={selectedContact?.id ?? null} 
          onSelect={onSelect}
          tags={tags}
          hasUnread={hasNewMessages[contact.id] === true}
        />
      ))}
    </div>
  );
});

const ChatNew: React.FC<ChatNewProps> = ({ hasNewMessages: externalHasNewMessages, setHasNewMessages, contacts: externalContacts, setContacts: externalSetContacts }) => {
  const location = useLocation();
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const contacts = externalContacts || [];
  const setContacts = externalSetContacts || (() => {});
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(false);
  const [isCheckingMicrophone, setIsCheckingMicrophone] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [scrollButtonLeft, setScrollButtonLeft] = useState<number | null>(null);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [selectedFilterUser, setSelectedFilterUser] = useState<number | null>(null);
  const [selectedFilterTag, setSelectedFilterTag] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [hasNewMessages, setLocalHasNewMessages] = useState<{ [contactId: number]: boolean }>(externalHasNewMessages || {});
  const [isAnonymous, setIsAnonymous] = useState(() => SessionService.getIsAnonymous());
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  useEffect(() => {
    if (externalHasNewMessages) setLocalHasNewMessages(externalHasNewMessages);
  }, [externalHasNewMessages]);

  const updateHasNewMessages = useCallback((updater: (prev: { [contactId: number]: boolean }) => { [contactId: number]: boolean }) => {
    setLocalHasNewMessages(prev => {
      const updated = updater(prev);
      if (setHasNewMessages) setHasNewMessages(updated);
      return updated;
    });
  }, [setHasNewMessages]);

  const loadMessages = useCallback(async (contactId: number, pageParam = 0, append = false) => {
    console.log('🔄 loadMessages - Iniciando carregamento de mensagens', { contactId, pageParam, append });
    if (append) setIsLoadingMore(true);
    else setIsMessagesLoading(true);
    try {
      const offset = pageParam * MESSAGES_PAGE_SIZE;
      console.log('📝 loadMessages - Chamando API getMessagesByContactId', { contactId, limit: MESSAGES_PAGE_SIZE, offset });
      const response = await getMessagesByContactId(contactId, MESSAGES_PAGE_SIZE, offset);
      console.log('✅ loadMessages - Resposta da API', { response, length: Array.isArray(response) ? response.length : 0 });
      
      const newMessages = Array.isArray(response) ? response : [];
      newMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      setHasMore(newMessages.length === MESSAGES_PAGE_SIZE);
      if (append) {
        setMessages(prev => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
      }
    } catch (error) {
      console.error('❌ loadMessages - Erro ao carregar mensagens:', error);
    } finally {
      if (append) setIsLoadingMore(false);
      else setIsMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContact) {
      console.log('🔄 useEffect [selectedContact] - Carregando mensagens para novo contato', { contactId: selectedContact.id });
      setPage(0);
      loadMessages(selectedContact.id, 0, false);
    }
  }, [selectedContact, loadMessages]);

  // Verificar se há um setor selecionado na sessão
  useEffect(() => {
    const checkSector = () => {
      const sectorId = SessionService.getSectorId();
      console.log('🔄 useEffect [checkSector] - Verificando setor na sessão', { sectorId, selectedSectorId });
      if (sectorId && String(sectorId) !== selectedSectorId) {
        setSelectedSectorId(String(sectorId));
      }
    };

    checkSector();
  }, [selectedSectorId]);

  // Verificar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Verificar inicialmente
    checkMobile();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Quando um contato é selecionado em dispositivo móvel, esconder a sidebar
  useEffect(() => {
    if (isMobile && selectedContact) {
      setShowSidebar(false);
    }
  }, [selectedContact, isMobile]);
  


  // Melhorar o comportamento do scroll
  useEffect(() => {
    if (!isLoadingMore && !isMessagesLoading && messages.length > 0 && page === 0) {
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
          setShowScrollToBottom(false);
        }
      }, 100);
    }
  }, [messages.length, isLoadingMore, isMessagesLoading, page]);

  // Função auxiliar para forçar o scroll para baixo
  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.chat-new-messages');
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Troca de contato: mostra loading, só troca mensagens quando carregar
  const handleContactSelect = useCallback(async (contact: ContactData) => {
    if (!selectedSectorId) {
      return;
    }
    localStorage.setItem('openContactId', contact.id.toString());
    try {
      setContacts(prevContacts => prevContacts.map(c =>
        c.id === contact.id
          ? { ...c, is_viewed: true }
          : c
      ));
      setPage(0);
      setSelectedContact({ ...contact });
      // Marcar como visualizado na API
      await markContactAsViewed(Number(selectedSectorId), contact.id);
    } catch (error) {
      console.error('❌ handleContactSelect - Erro ao selecionar contato:', error);
    }
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [selectedSectorId, isMobile]);

  // Voltar para a lista de contatos (apenas mobile)
  const handleBackToContacts = () => {
    setShowSidebar(true);
  };



  useEffect(() => {
    const fetchSelectedSector = async () => {
      if (!selectedSectorId) {
        console.log('❌ fetchSelectedSector - Sem selectedSectorId, não buscando setor');
        return;
      }

      try {
        console.log('🔄 fetchSelectedSector - Buscando setor:', selectedSectorId);
        const sector = await getSector(Number(selectedSectorId));
        console.log('✅ fetchSelectedSector - Setor retornado:', sector);
        setSelectedSector(sector);
      } catch (error) {
        console.error('❌ fetchSelectedSector - Erro ao buscar setor:', error);
      }
    };

    fetchSelectedSector();
  }, [selectedSectorId]);

  const handleSendMessage = async () => {
    console.log('🔄 handleSendMessage - Iniciando envio de mensagem', {
      messageInput,
      selectedContact,
      selectedSectorId,
      selectedSector
    });

    if (!messageInput.trim() || !selectedContact || !selectedSectorId) {
      console.log('❌ handleSendMessage - Dados inválidos para envio');
      return;
    }

    const tempId = Date.now();
    const contactId = selectedContact.id;

    const newMessage: Message = {
      id: tempId,
      content: messageInput,
      mediaType: 'text',
      mediaUrl: null,
      fileName: null,
      mimeType: null,
      sectorId: Number(selectedSectorId),
      contactID: contactId,
      sentAt: new Date().toISOString(),
      isSent: true,
      isRead: false,
      status: 'sending'
    };

    // Atualizar mensagens mantendo apenas as do contato atual
    setMessages(prev => [...prev.filter(msg => msg.contactID === contactId), newMessage]);
    setMessageInput('');

    try {
      console.log('🔄 handleSendMessage - Enviando mensagem para a API', {
        text: messageInput,
        to: selectedContact.number,
        recipientPhone: selectedContact.number,
        contactId: contactId,
        sectorId: Number(selectedSectorId),
        userId: currentUserId,
        isAnonymous: isCurrentUserAdmin ? isAnonymous : false
      });

      const response = await sendMessage({
        text: messageInput,
        to: selectedContact.number,
        recipientPhone: selectedContact.number,
        contactId: contactId,
        sectorId: Number(selectedSectorId),
        userId: currentUserId,
        isAnonymous: isCurrentUserAdmin ? isAnonymous : false
      });

      console.log('✅ handleSendMessage - Resposta da API:', response);

      // Atualizar mensagem com resposta da API
      setMessages(prev => prev.map(msg => 
        msg.id === tempId && msg.contactID === contactId
          ? { ...response, status: 'sent', contactID: contactId }
          : msg
      ));

    } catch (error) {
      console.error('❌ handleSendMessage - Erro ao enviar mensagem:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId && msg.contactID === contactId
          ? { ...msg, status: 'error' }
          : msg
      ));
    }
  };

  // 1. Atualizar a função handleKeyPress
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Previne quebra de linha
      if (messageInput.trim()) { // Verifica se há texto
        handleSendMessage();
      }
    }
  };


  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const handleDocumentUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact || !selectedSectorId) return;

    const tempId = Date.now();
    const isImage = file.type.startsWith('image/');
    
    const newMessage: Message = {
      id: tempId,
      content: '',
      isSent: true,
      sentAt: new Date().toISOString(),
      isRead: false,
      mediaType: isImage ? 'image' : 'document',
      mediaUrl: URL.createObjectURL(file),
      fileName: file.name,
      mimeType: file.type,
      sectorId: Number(selectedSectorId),
      contactID: selectedContact.id,
      status: 'sending'
    };

    setMessages(prev => [...prev.filter(msg => msg.contactID === selectedContact.id), newMessage]);
    scrollToBottom();

    try {
      const base64 = await fileToBase64(file);
      const response = await sendFile({
        base64File: base64,
        mediaType: file.type,
        fileName: file.name,
        caption: '',
        recipient: selectedContact.number,
        recipientPhone: selectedContact.number,
        contactId: selectedContact.id,
        sectorId: Number(selectedSectorId),
        userId: currentUserId,
        isAnonymous: isCurrentUserAdmin ? isAnonymous : false
      });

      setMessages(prev => prev.map(msg => 
        msg.id === tempId && msg.contactID === selectedContact.id
          ? { ...msg, id: response.id, status: 'sent' }
          : msg
      ));
      scrollToBottom();

      const lastMessagePreview = isImage ? '📷 Imagem enviada' : '📎 Anexo enviado';
      setContacts(prevContacts => prevContacts.map(contact => 
        contact.id === selectedContact.id
          ? {
              ...contact,
              lastMessage: lastMessagePreview,
              lastMessageTime: new Date().toISOString()
            }
          : contact
      ));

    } catch (error) {
      console.error('❌ handleFileSelected - Erro ao enviar arquivo:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId && msg.contactID === selectedContact.id
          ? { ...msg, status: 'error' }
          : msg
      ));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função auxiliar para converter arquivo em base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove o prefixo "data:*/*;base64," do resultado
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    if (!selectedContact || !selectedSectorId) return;

    const tempId = Date.now();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Adicionar mensagem temporária
    const newMessage: Message = {
      id: tempId,
      content: '',
      mediaType: 'audio',
      mediaUrl: audioUrl,
      fileName: `audio_${tempId}.wav`, // Mudado para .wav já que será convertido
      mimeType: 'audio/wav',
      sectorId: Number(selectedSectorId),
      contactID: selectedContact.id,
      sentAt: new Date().toISOString(),
      isSent: true,
      isRead: false,
      status: 'sending'
    };

    // Adiciona a mensagem temporária ao estado
    setMessages(prev => [...prev, newMessage]);
    scrollToBottom();

    try {
      // Usar sendAudioMessage em vez de sendFile
      const response = await sendAudioMessage(
        audioBlob,
        selectedContact.number,
        selectedContact.id,
        Number(selectedSectorId),
        currentUserId,
        isCurrentUserAdmin ? isAnonymous : false
      );

      // Atualiza a mensagem temporária com os dados do servidor
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { 
              ...response,
              mediaUrl: audioUrl,
              status: 'sent' 
            }
          : msg
      ));
      scrollToBottom();

      // Atualizar a última mensagem do contato na lista
      setContacts(prevContacts => prevContacts.map(contact => 
        contact.id === selectedContact.id
          ? {
              ...contact,
              lastMessage: '🎤 Áudio enviado',
              lastMessageTime: new Date().toISOString()
            }
          : contact
      ));

    } catch (error) {
      console.error('❌ handleSendAudio - Erro ao enviar áudio:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'error' }
          : msg
      ));
    }
  };

  // Atualizar o useEffect que monitora o selectedSectorId
  useEffect(() => {
    const initializeData = async () => {
      console.log('🔄 initializeData - Iniciando carregamento de dados', { selectedSectorId });
      if (!selectedSectorId) {
        console.log('❌ initializeData - Sem setor selecionado, limpando contatos');
        setContacts([]);
        return;
      }
      setIsContactsLoading(true);
      try {
        console.log('🔄 initializeData - Buscando usuários, tags e contatos');
        const [users, tagsResponse, contactsResponse] = await Promise.all([
          getAllUsers().catch(error => {
            console.error('❌ initializeData - Erro ao buscar usuários:', error);
            return [];
          }),
          getTags(Number(selectedSectorId)).catch(error => {
            console.error('❌ initializeData - Erro ao buscar tags:', error);
            return { data: [] };
          }),
          getContacts(Number(selectedSectorId)).catch(error => {
            console.error('❌ initializeData - Erro ao buscar contatos:', error);
            return null;
          })
        ]);

        console.log('✅ initializeData - Usuários obtidos:', users);
        setUsers(users || []);

        // Atualizar tags garantindo que temos a estrutura correta
        console.log('✅ initializeData - Tags obtidas:', tagsResponse);
        if (tagsResponse?.data && Array.isArray(tagsResponse.data)) {
          setTags(tagsResponse.data);
        } else {
          console.log('⚠️ initializeData - Formato de resposta inválido para tags');
          setTags([]);
        }

        console.log('✅ initializeData - Contatos obtidos:', contactsResponse);
        if (contactsResponse?.data && Array.isArray(contactsResponse.data)) {
          const currentContactsMap = new Map(contacts.map(contact => [contact.id, contact]));
          
          // Obtém o ID do usuário atual
          const token = SessionService.getToken();
          const decodedToken = token ? SessionService.decodeToken(token) : null;
          const userId = decodedToken ? decodedToken.userId : null;
          console.log('🔄 initializeData - Usuário atual:', { userId });
          
          // Converter userId para número para garantir uma comparação correta
          const currentUserIdNum = userId ? Number(userId) : null;
          console.log('🔄 initializeData - Usuário atual (número):', { currentUserIdNum });
          
          const updatedContacts = contactsResponse.data.map(contact => {
            const is_viewed = contact.is_viewed ?? contact.isViewed ?? true;
            const assignedToName = contact.assignedTo === currentUserIdNum
              ? "Delegado para mim"
              : (contact as any).assignedToName || null;
            return {
              ...contact,
              lastMessage: currentContactsMap.get(contact.id)?.lastMessage || '',
              lastMessageTime: currentContactsMap.get(contact.id)?.lastMessageTime || '',
              unreadCount: currentContactsMap.get(contact.id)?.unreadCount || 0,
              is_viewed,
              assignedToName
            };
          });
          
          console.log('✅ initializeData - Contatos atualizados:', updatedContacts);
          setContacts(updatedContacts);
          
          // Se já tiver um contato selecionado, atualizar seu assignedToName também
          if (selectedContact) {
            console.log('🔄 initializeData - Atualizando contato selecionado');
            const updatedSelectedContact = updatedContacts.find(c => c.id === selectedContact.id);
            if (updatedSelectedContact) {
              setSelectedContact(updatedSelectedContact);
            }
          }
          
          // Atualizar o mapa de não visualizados
          const unreadMap = updatedContacts.reduce((acc, contact) => {
            acc[contact.id] = contact.is_viewed === false;
            return acc;
          }, {} as { [contactId: number]: boolean });

          if (setHasNewMessages) setHasNewMessages(unreadMap);
          setLocalHasNewMessages(unreadMap);
          
        } else {
          console.log('⚠️ initializeData - Formato de resposta inválido para contatos');
          setContacts([]);
        }
      } catch (error) {
        console.error('❌ initializeData - Erro ao carregar dados iniciais:', error);
        setContacts([]);
        setTags([]);
      } finally {
        setIsContactsLoading(false);
      }
    };

    initializeData();
  }, [selectedSectorId]);

  const renderMessageStatus = (message: Message) => {
    if (message.status === 'sending') {
      return <span className="chat-new-message-status sending">✓</span>;
    } else if (message.status === 'error') {
      return <span className="chat-new-message-status error">⚠️</span>;
    } else if (message.isSent) {
      return <span className="chat-new-message-status">✓✓</span>;
    } else {
      return <span className="chat-new-message-status">✓</span>;
    }
  };

  // Substituir o useEffect que faz polling de mensagens por um que só carrega ao selecionar contato
  useEffect(() => {
    const isInChatPage = location.pathname === '/chat';
    console.log('🔄 useEffect [location] - Verificando localização', { 
      isInChatPage, 
      pathname: location.pathname, 
      selectedContactId: selectedContact?.id 
    });
    if (selectedContact && isInChatPage) {
      console.log('🔄 useEffect [location] - Carregando mensagens na página de chat');
      loadMessages(selectedContact.id, 0, false);
    }
    // Remover o setInterval de loadMessages
    return () => {};
  }, [selectedContact, location.pathname, loadMessages]);

  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      setShowScrollToBottom(
        messagesContainerRef.current.scrollTop < messagesContainerRef.current.scrollHeight - messagesContainerRef.current.clientHeight - 120
      );
    };
    handleScroll();
    if (messagesContainerRef.current) {
      messagesContainerRef.current.addEventListener('scroll', handleScroll);
      return () => messagesContainerRef.current?.removeEventListener('scroll', handleScroll);
    }
  }, [messages]);

  const handleLoadMore = () => {
    console.log('🔄 handleLoadMore - Carregando mais mensagens', { 
      selectedContactId: selectedContact?.id, 
      hasMore, 
      isMessagesLoading, 
      isLoadingMore,
      currentPage: page 
    });
    if (selectedContact && hasMore && !isMessagesLoading && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(selectedContact.id, nextPage, true);
    }
  };

  const renderMessage = (message: Message) => {
    const renderMediaContent = () => {
      if (!message.mediaUrl) {
        return (
          <div className="chat-new-message-content">
            {message.content || 'Mídia não disponível'}
          </div>
        );
      }

      switch (message.mediaType.toLowerCase()) {
        case 'image':
          return (
            <div className="chat-new-message-image">
              <img 
                src={message.mediaUrl} 
                alt="Imagem" 
                onClick={() => message.mediaUrl && window.open(message.mediaUrl, '_blank')}
              />
            </div>
          );
          
        case 'video':
          return (
            <div 
              className="chat-new-message-video"
              onClick={() => {
                setSelectedVideo(message.mediaUrl);
                setShowVideoModal(true);
              }}
            >
              <div className="video-thumbnail">
                <VideoThumbnail src={message.mediaUrl} />
                <div className="play-button">
                  <PlayIcon />
                </div>
              </div>
            </div>
          );

        case 'document':
          return (
            <div className="chat-new-message-document">
              <DocumentIcon />
              <a 
                href={message.mediaUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="document-name"
              >
                {message.fileName || 'Documento'}
              </a>
            </div>
          );

        case 'audio':
        case 'voice':
          return (
            <AudioMessage
              src={message.mediaUrl}
              isSent={message.isSent || message.status === 'sending' || message.status === 'sent'}
              onCancel={message.status === 'sending' ? () => {
                setMessages(prev => prev.filter(m => m.id !== message.id));
              } : undefined}
            />
          );

        case 'text':
        default:
          return (
            <div className="chat-new-message-content">
              {message.content}
            </div>
          );
      }
    };

    // Garantir que sentAt está em formato ISO para o dayjs
    const sentAt = dayjs(message.sentAt).isValid() ? dayjs(message.sentAt).toISOString() : new Date().toISOString();

    const shouldRenderAsSent = message.isSent;

    return (
      <div 
        key={message.id} 
        className={`chat-new-message ${shouldRenderAsSent ? 'sent' : 'received'}`}
      >
        {renderMediaContent()}
        <div className="chat-new-message-info">
          <span className="chat-new-message-time">
            {dayjs(sentAt).tz('America/Sao_Paulo').format('HH:mm')}
          </span>
          {shouldRenderAsSent && renderMessageStatus(message)}
        </div>
      </div>
    );
  };

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTransferContact = async () => {
    if (!selectedContact || !selectedUserId) return;

    setIsTransferLoading(true);
    try {
      await updateContact(selectedContact.id, {
        name: selectedContact.name,
        email: selectedContact.email,
        phoneWhatsapp: selectedContact.number,
        notes: selectedContact.notes,
        sectorId: selectedContact.sectorId,
        isActive: selectedContact.isActive,
        priority: selectedContact.priority,
        aiActive: selectedContact.aiActive,
        assignedTo: selectedUserId,
        tagId: selectedContact.tagId,
        avatarUrl: selectedContact.avatarUrl
      });

      // Atualizar com nome apropriado dependendo se é o usuário atual ou outro
      let userName;
      if (selectedUserId === currentUserId) {
        // Se for o próprio usuário atual, usar "Delegado para mim" para consistência
        userName = "Delegado para mim";
      } else {
        // Se for outro usuário, usar o nome do usuário selecionado
        const selectedUser = users.find(u => u.id === selectedUserId);
        userName = selectedUser?.name || 'Usuário';
      }

      // Atualizar o contato selecionado e a lista de contatos com o nome do usuário
      const updatedContact = {
        ...selectedContact,
        assignedTo: selectedUserId,
        assignedToName: userName
      };
      setSelectedContact(updatedContact);
      setContacts(prevContacts => prevContacts.map(contact => 
        contact.id === selectedContact.id ? updatedContact : contact
      ));

    } catch (error) {
      console.error('❌ handleTransferContact - Erro ao transferir contato:', error);
    } finally {
      setIsTransferLoading(false);
      setShowTransferModal(false);
      setSelectedUserId(null);
    }
  };

  const handleChangeTag = async () => {
    if (!selectedContact) return;

    setIsTagLoading(true);
    try {
      await updateContact(selectedContact.id, {
        name: selectedContact.name,
        email: selectedContact.email,
        phoneWhatsapp: selectedContact.number,
        notes: selectedContact.notes,
        sectorId: selectedContact.sectorId,
        isActive: selectedContact.isActive,
        priority: selectedContact.priority,
        aiActive: selectedContact.aiActive,
        assignedTo: selectedContact.assignedTo,
        tagId: selectedTagId || null,
        avatarUrl: selectedContact.avatarUrl
      });
      const updatedContactData = {
        ...selectedContact,
        tagId: selectedTagId || null
      };
      setSelectedContact(updatedContactData);
      setContacts(prevContacts => prevContacts.map(contact => 
        contact.id === selectedContact.id
          ? updatedContactData
          : contact
      ));
    } catch (error) {
      console.error('❌ handleChangeTag - Erro ao alterar tag:', error);
    } finally {
      setIsTagLoading(false);
      setShowTagModal(false);
      setSelectedTagId(null);
    }
  };

  // Adicionar useEffect para verificar disponibilidade do microfone
  useEffect(() => {
    const checkMicrophoneAvailability = async () => {
      try {
        setIsCheckingMicrophone(true);
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some(device => device.kind === 'audioinput');
        setIsMicrophoneAvailable(hasAudioInput);
      } catch (error) {
        console.error('❌ Error checking microphone:', error);
        setIsMicrophoneAvailable(false);
      } finally {
        setIsCheckingMicrophone(false);
      }
    };

    // Verificar inicialmente
    checkMicrophoneAvailability();

    // Adicionar listener para mudanças nos dispositivos
    navigator.mediaDevices.addEventListener('devicechange', checkMicrophoneAvailability);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', checkMicrophoneAvailability);
    };
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = ``;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const updateButtonPosition = () => {
      if (messagesContainerRef.current) {
        const rect = messagesContainerRef.current.getBoundingClientRect();
        setScrollButtonLeft(rect.left + rect.width / 2);
      }
    };
    updateButtonPosition();
    window.addEventListener('resize', updateButtonPosition);
    window.addEventListener('scroll', updateButtonPosition, true);
    return () => {
      window.removeEventListener('resize', updateButtonPosition);
      window.removeEventListener('scroll', updateButtonPosition, true);
    };
  }, []);

  useEffect(() => {
    const token = SessionService.getToken?.() || '';
    console.log('🔄 useEffect [WebSocket] - Configurando WebSocket', { hasToken: !!token });
    if (!token || !selectedSectorId) return;

    const handleWebSocketMessage = (msg: any) => {
      if (msg.type === 'unread_status') {
        const unread = msg.payload.unreadStatus || {};
        const normalized = Object.fromEntries(
          Object.entries(unread).map(([id, value]) => [id, !value])
        );
        updateHasNewMessages(() => ({ ...normalized }));
      } else if (msg.type === 'contact') {
        setContacts(prev => {
          const exists = prev.some(c => c.id === msg.payload.id);
          if (exists) {
            return prev.map(c => c.id === msg.payload.id ? { ...c, ...msg.payload } : c);
          } else {
            return [...prev, msg.payload];
          }
        });
      } else if (msg.type === 'message') {
        if (!selectedContact || msg.payload.contactID !== selectedContact.id) {
          updateHasNewMessages(prev => ({
            ...prev,
            [msg.payload.contactID]: true
          }));
        }
        if (selectedContact && msg.payload.contactID === selectedContact.id) {
          setMessages(prev => [...prev, msg.payload]);
        }
      }
    };

    ChatWebSocketService.connect(token, handleWebSocketMessage, Number(selectedSectorId));
    return () => {
      ChatWebSocketService.disconnect();
    };
  }, [selectedContact, selectedSectorId, updateHasNewMessages]);

  useEffect(() => {
    if (selectedContact) {
      updateHasNewMessages(prev => ({
        ...prev,
        [selectedContact.id]: false
      }));
      // Aqui você pode notificar o backend que o contato foi visualizado, se necessário
    }
  }, [selectedContact, updateHasNewMessages]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Filtro por nome/número
      const searchMatch = searchTerm.toLowerCase().trim() === '' ||
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.number.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por responsável
      const userMatch = !selectedFilterUser || contact.assignedTo === selectedFilterUser;

      // Filtro por tag
      const tagMatch = !selectedFilterTag || contact.tagId === selectedFilterTag;

      // Filtro por status de visualização
      const statusMatch = selectedStatus === 'all' || 
        (selectedStatus === 'unread' && !contact.is_viewed) ||
        (selectedStatus === 'read' && contact.is_viewed);

      return searchMatch && userMatch && tagMatch && statusMatch;
    });
  }, [contacts, searchTerm, selectedFilterUser, selectedFilterTag, selectedStatus]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = SessionService.getToken();
        const decodedToken = token ? SessionService.decodeToken(token) : null;
        const userId = decodedToken ? decodedToken.userId : null;
        if (!userId) return;
        setCurrentUserId(Number(userId));
        const response = await getUser(userId);
        setIsCurrentUserAdmin(!!response.data.isAdmin);
      } catch (error) {}
    };
    fetchUserData();
  }, []);

  const handleAssignToMe = async () => {
    if (!selectedContact || !currentUserId) return;

    try {
      await updateContact(selectedContact.id, {
        name: selectedContact.name,
        email: selectedContact.email,
        phoneWhatsapp: selectedContact.number,
        notes: selectedContact.notes,
        sectorId: selectedContact.sectorId,
        isActive: selectedContact.isActive,
        priority: selectedContact.priority,
        aiActive: selectedContact.aiActive,
        assignedTo: Number(currentUserId),
        tagId: selectedContact.tagId,
        avatarUrl: selectedContact.avatarUrl
      });

      // Sempre usar "Delegado para mim" para consistência
      const updatedContact = { 
        ...selectedContact, 
        assignedTo: Number(currentUserId),
        assignedToName: "Delegado para mim" 
      };
      
      setSelectedContact(updatedContact);
      setContacts(prevContacts => prevContacts.map(contact => 
        contact.id === selectedContact.id ? updatedContact : contact
      ));

    } catch (error) {
      console.error('❌ handleAssignToMe - Erro ao delegar contato:', error);
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact || !selectedSectorId) return;
    setIsDeletingContact(true);
    try {
      await deleteContactFromSector(selectedContact.id, Number(selectedSectorId));
      setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
      setSelectedContact(null);
      setShowDeleteModal(false);
    } catch (error) {
      setShowDeleteModal(false);
    } finally {
      setIsDeletingContact(false);
    }
  };

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  }, [contacts]);

  return (
    <div className="chat-new-container dark-mode">
      {/* Sidebar de contatos */}
      <div className={`chat-new-sidebar ${!showSidebar ? 'hidden' : ''}`}>
        <div className="chat-new-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 8px 12px' }}>
          <button 
            className="chat-new-new-contact-btn" 
            onClick={() => selectedSectorId && setShowNewContactModal(true)}
            disabled={!selectedSectorId}
            style={{ opacity: !selectedSectorId ? 0.5 : 1, cursor: !selectedSectorId ? 'not-allowed' : 'pointer' }}
          >
            + Novo contato
          </button>
          <button 
            className="chat-new-filters-btn" 
            onClick={() => selectedSectorId && setShowFiltersModal(true)}
            disabled={!selectedSectorId}
            style={{ opacity: !selectedSectorId ? 0.5 : 1, cursor: !selectedSectorId ? 'not-allowed' : 'pointer' }}
          >
            Filtros
          </button>
        </div>
        <div className="chat-new-search">
          <input
            type="text"
            placeholder={selectedSectorId ? "Buscar contatos..." : "Selecione um setor primeiro"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!selectedSectorId}
            style={{ opacity: !selectedSectorId ? 0.7 : 1 }}
          />
        </div>
        <div className="chat-new-contacts">
          {!selectedSectorId ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 200,
              color: '#bbb'
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <span style={{ color: '#bbb', fontSize: 16, textAlign: 'center' }}>
                Selecione um setor no menu principal<br/>para visualizar os contatos
              </span>
            </div>
          ) : isContactsLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 200
            }}>
              <div className="chat-new-loading-spinner" style={{ marginBottom: 16 }} />
              <span style={{ color: '#bbb', fontSize: 16 }}>Carregando contatos...</span>
            </div>
          ) : (
            <RenderContacts
              contacts={filteredContacts.length > 0 ? filteredContacts : sortedContacts}
              selectedContact={selectedContact}
              onSelect={handleContactSelect}
              tags={tags}
              hasNewMessages={hasNewMessages}
            />
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className={`chat-new-main ${!selectedSectorId ? 'disabled' : ''}`}>
        {selectedContact ? (
          <>
            <div className="chat-new-header">
              {isMobile && (
                <button 
                  className="chat-new-back-button" 
                  onClick={handleBackToContacts}
                  aria-label="Voltar para contatos"
                >
                  <BackIcon />
                </button>
              )}
              <div className="chat-new-header-contact">
                <div className="chat-new-header-avatar">
                  {selectedContact.avatarUrl ? (
                    <img
                      src={selectedContact.avatarUrl}
                      alt={selectedContact.name}
                      style={{
                        border: selectedContact.tagId ? `3px solid ${tags.find(t => t.id === selectedContact.tagId)?.color || 'transparent'}` : 'none',
                        borderRadius: '50%',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div 
                      className="avatar-initials"
                      style={{
                        border: selectedContact.tagId ? `3px solid ${tags.find(t => t.id === selectedContact.tagId)?.color || 'transparent'}` : 'none'
                      }}
                    >
                      {selectedContact.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="chat-new-header-info">
                  <div className="chat-new-header-group">
                    <div className="chat-new-header-left">
                      <span className="chat-new-header-name">
                        {selectedContact.name}
                      </span>
                      {selectedContact.number && (
                        <span className="chat-new-header-phone">
                          <FiPhone />
                          {formatPhoneNumber(selectedContact.number)}
                        </span>
                      )}
                    </div>
                    <div className="chat-new-header-right">
                      {selectedContact.assignedTo ? (
                        <span className="chat-new-header-assigned">
                          <UserIcon />
                          <span>
                            {selectedContact.assignedTo === Number(currentUserId) 
                              ? "Delegado para mim" 
                              : (selectedContact.assignedToName || users.find(u => u.id === selectedContact.assignedTo)?.name)}
                          </span>
                        </span>
                      ) : (
                        <button 
                          className="chat-new-header-button assign"
                          onClick={handleAssignToMe}
                        >
                          <UserPlus />
                          Delegar para mim
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="chat-new-header-actions" ref={menuRef}>
                <button 
                  className="chat-new-header-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                >
                  <FiMoreVertical />
                </button>
                {showMenu && (
                  <div className="chat-new-header-menu">
                    <div 
                      className="chat-new-header-menu-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTransferModal(true);
                        setShowMenu(false);
                      }}
                    >
                      <FiUserPlus />
                      Transferir contato
                    </div>
                    <div className="chat-new-header-menu-divider" />
                    <div 
                      className="chat-new-header-menu-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTagId(selectedContact.tagId);
                        setShowTagModal(true);
                        setShowMenu(false);
                      }}
                    >
                      <FiTag />
                      Alterar tag
                    </div>
                    {isCurrentUserAdmin && (
                      <>
                        <div className="chat-new-header-menu-divider" />
                        <div
                          className="chat-new-header-menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal(true);
                            setShowMenu(false);
                          }}
                        >
                          Remover contato
                        </div>
                      </>
                    )}
                  </div>
                )}
                {isCurrentUserAdmin && (
                  <label style={{ display: 'flex', alignItems: 'center', marginRight: 16, gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => {
                        setIsAnonymous(e.target.checked);
                        SessionService.setIsAnonymous(e.target.checked);
                      }}
                      style={{ marginRight: 4 }}
                    />
                    Mensagem anônima
                  </label>
                )}
              </div>
            </div>

            {/* Área de mensagens */}
            <div
              className="chat-new-messages"
              ref={messagesContainerRef}
              style={{ position: 'relative', overflowY: 'auto', height: '100%', maxHeight: '100%' }}
            >
              {hasMore && !isMessagesLoading && (
                <button className="chat-new-load-more" onClick={handleLoadMore} disabled={isLoadingMore || isMessagesLoading} style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
                  {isLoadingMore && !isMessagesLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <div className="chat-new-loading-spinner" style={{ margin: '0 auto', borderColor: '#fff transparent #fff transparent' }} />
                    </span>
                  ) : (
                    <>
                      <span className="chat-new-load-more-icon" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8l6 6H6l6-6z" fill="currentColor"/></svg>
                      </span>
                      Ver mais mensagens
                    </>
                  )}
                </button>
              )}
              {isMessagesLoading && (
                <div className="chat-new-messages-loading" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)', zIndex: 2, flexDirection: 'column' }}>
                  <div className="chat-new-loading-spinner" style={{ marginBottom: 12, borderColor: '#fff transparent #fff transparent' }}></div>
                  <span style={{ color: '#fff', fontWeight: 500, fontSize: 16 }}>Carregando mensagens</span>
                </div>
              )}
              {messages.length === 0 && !isMessagesLoading && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#bbb',
                  fontSize: 16,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  pointerEvents: 'none'
                }}>
                  Nenhuma mensagem encontrada
                </div>
              )}
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
              {showScrollToBottom && scrollButtonLeft !== null && (
                <button
                  className="chat-new-scroll-to-bottom"
                  style={{
                    position: 'fixed',
                    left: scrollButtonLeft,
                    transform: 'translateX(-50%)',
                    bottom: 222,
                    zIndex: 1000,
                    pointerEvents: 'auto'
                  }}
                  onClick={() => {
                    const messagesContainer = document.querySelector('.chat-new-messages');
                    if (messagesContainer) {
                      messagesContainer.scrollTo({
                        top: messagesContainer.scrollHeight,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  aria-label="Descer para a última mensagem"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16l-6-6h12l-6 6z" fill="currentColor"/></svg>
                </button>
              )}
            </div>

            {/* Área de input */}
            <div className="chat-new-input-area">
              {isRecording ? (
                <AudioRecorder
                  onSend={handleSendAudio}
                  onCancel={() => setIsRecording(false)}
                />
              ) : (
                <div className="chat-new-input-container">
                  <textarea
                    className="chat-new-input"
                    placeholder={selectedSectorId ? "Digite uma mensagem..." : "Selecione um setor para enviar mensagens"}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={!selectedSectorId}
                  />
                  
                  <div className="chat-new-input-divider"></div>
                  
                  <div className="chat-new-input-bottom">
                    <div className="chat-new-input-actions">
                      <button 
                        className="chat-new-input-button" 
                        title="Anexar imagem"
                        onClick={handleImageUpload}
                        disabled={!selectedSectorId || isRecording}
                      >
                        <ImageIcon />
                      </button>
                      
                      <button 
                        className="chat-new-input-button" 
                        title="Anexar documento"
                        onClick={handleDocumentUpload}
                        disabled={!selectedSectorId || isRecording}
                      >
                        <DocumentIcon />
                      </button>
                      
                      <button 
                        className="chat-new-input-button" 
                        title={isCheckingMicrophone 
                          ? "Verificando microfone..." 
                          : isMicrophoneAvailable 
                            ? "Gravar áudio" 
                            : "Microfone não disponível"}
                        onClick={() => isMicrophoneAvailable && setIsRecording(true)}
                        disabled={!selectedSectorId || !isMicrophoneAvailable || isCheckingMicrophone}
                        style={{
                          opacity: (!selectedSectorId || !isMicrophoneAvailable || isCheckingMicrophone) ? 0.5 : 1,
                          cursor: (!selectedSectorId || !isMicrophoneAvailable || isCheckingMicrophone) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <MicIcon />
                      </button>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileSelected}
                      />
                    </div>
                    
                    <button 
                      className="chat-new-send-button"
                      onClick={() => messageInput.trim() && handleSendMessage()}
                      disabled={!messageInput.trim() || !selectedSectorId}
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="chat-new-empty">
            <div className="chat-new-empty-content">
              <div className="chat-new-empty-icon">💬</div>
              <h3>Selecione um contato para iniciar uma conversa</h3>
              <p>{selectedSectorId 
                ? "Escolha um contato da lista à esquerda para começar a conversar" 
                : "Selecione um setor no menu principal para ver os contatos disponíveis"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de transferência */}
      {showTransferModal && (
        <div className="chat-new-modal">
          <div className="chat-new-modal-content">
            <div className="chat-new-modal-header">
              <h3 className="chat-new-modal-title">Transferir contato</h3>
            </div>
            <div className="chat-new-modal-body">
              <select 
                className="chat-new-modal-select"
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
              >
                <option value="">Selecione um usuário</option>
                {users
                  .filter(user => {
                    // Filtrar apenas usuários que têm acesso ao setor atual
                    if (!selectedSectorId) return false;
                    
                    // Verificar se o usuário tem o setor atual entre seus setores
                    return user.sectors && user.sectors.some(
                      (sector: {id: number}) => sector.id === Number(selectedSectorId)
                    );
                  })
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="chat-new-modal-actions">
              <button 
                className="chat-new-modal-button cancel"
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedUserId(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="chat-new-modal-button confirm"
                onClick={handleTransferContact}
                disabled={!selectedUserId || isTransferLoading}
              >
                {isTransferLoading ? 'Transferindo...' : 'Transferir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de tags */}
      {showTagModal && (
        <div className="chat-new-modal">
          <div className="chat-new-modal-content">
            <div className="chat-new-modal-header">
              <h3 className="chat-new-modal-title">Alterar tag</h3>
            </div>
            <div className="chat-new-modal-body">
              <select 
                className="chat-new-modal-select"
                value={selectedTagId || ''}
                onChange={(e) => setSelectedTagId(Number(e.target.value))}
                style={{ minWidth: 0, width: '100%' }}
              >
                <option value="">Sem tag</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="chat-new-modal-actions">
              <button 
                className="chat-new-modal-button cancel"
                onClick={() => {
                  setShowTagModal(false);
                  setSelectedTagId(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="chat-new-modal-button confirm"
                onClick={handleChangeTag}
                disabled={isTagLoading}
              >
                {isTagLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Contato */}
      {showNewContactModal && selectedSectorId && (
        <div className="chat-new-modal">
          <div className="chat-new-modal-content">
            <div className="chat-new-modal-header">
              <h3 className="chat-new-modal-title">Novo contato</h3>
            </div>
            <div className="chat-new-modal-body">
              <input
                className="chat-new-modal-input"
                placeholder="Nome"
                value={newContactName}
                onChange={e => setNewContactName(e.target.value)}
                disabled={isCreatingContact}
              />
              <InputMask
                mask="+55 (99) 99999-9999"
                value={newContactNumber}
                onChange={e => setNewContactNumber(e.target.value)}
                disabled={isCreatingContact}
              >
                {(inputProps) => (
                  <input
                    {...inputProps}
                    className="chat-new-modal-input"
                    placeholder="Número (ex: +55 (11) 99999-9999)"
                    type="text"
                  />
                )}
              </InputMask>
            </div>
            <div className="chat-new-modal-actions">
              <button
                className="chat-new-modal-button cancel"
                onClick={() => {
                  setShowNewContactModal(false);
                  setNewContactName('');
                  setNewContactNumber('');
                }}
                disabled={isCreatingContact}
              >
                Cancelar
              </button>
              <button
                className="chat-new-modal-button confirm"
                onClick={async () => {
                  if (!newContactName.trim() || !newContactNumber.trim() || !selectedSectorId) return;
                  setIsCreatingContact(true);
                  try {
                    const cleanNumber = newContactNumber.replace(/\D/g, '').slice(0, 15);
                    const created = await createContact({ name: newContactName, phoneNumber: cleanNumber, email: '', sectorId: Number(selectedSectorId) });
                    if (created && created.id) {
                      setContacts(prev => [...prev, { ...created, is_viewed: true }]);
                      setSelectedContact({ ...created, is_viewed: true });
                      setShowNewContactModal(false);
                      setNewContactName('');
                      setNewContactNumber('');
                    }
                  } finally {
                    setIsCreatingContact(false);
                  }
                }}
                disabled={isCreatingContact || !newContactName.trim() || !newContactNumber.trim()}
              >
                {isCreatingContact ? 'Criando...' : 'Iniciar conversa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Filtros */}
      {showFiltersModal && (
        <div className="chat-new-modal">
          <div className="chat-new-modal-content">
            <div className="chat-new-modal-header">
              <h3 className="chat-new-modal-title">Filtros</h3>
            </div>
            <div className="chat-new-modal-body chat-new-modal-filters-body">
              <select 
                value={selectedFilterUser || ''} 
                onChange={(e) => setSelectedFilterUser(e.target.value ? Number(e.target.value) : null)}
                className="filter-select"
              >
                <option value="">Todos os responsáveis</option>
                {users
                  .filter(user => {
                    // Filtrar apenas usuários que têm acesso ao setor atual
                    if (!selectedSectorId) return false;
                    
                    // Verificar se o usuário tem o setor atual entre seus setores
                    return user.sectors && user.sectors.some(
                      (sector: {id: number}) => sector.id === Number(selectedSectorId)
                    );
                  })
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))
                }
              </select>
              <select 
                value={selectedFilterTag || ''} 
                onChange={(e) => setSelectedFilterTag(e.target.value ? Number(e.target.value) : null)}
                className="filter-select"
                style={{ marginTop: 16 }}
              >
                <option value="">Todas as tags</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
                style={{ marginTop: 16 }}
              >
                <option value="all">Todos os status</option>
                <option value="unread">Não visualizados</option>
                <option value="read">Visualizados</option>
              </select>
            </div>
            <div className="chat-new-modal-actions">
              <button
                className="chat-new-modal-button cancel"
                onClick={() => setShowFiltersModal(false)}
              >
                Cancelar
              </button>
              <button
                className="chat-new-modal-button confirm"
                onClick={() => setShowFiltersModal(false)}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Remoção */}
      {showDeleteModal && (
        <div className="chat-new-modal">
          <div className="chat-new-modal-content">
            <div className="chat-new-modal-header">
              <h3 className="chat-new-modal-title">Remover contato</h3>
            </div>
            <div className="chat-new-modal-body">
              Tem certeza que deseja remover este contato? <br />
              <b>Todo o histórico de mensagens e anexos deste contato será removido permanentemente.</b>
              <br />Esta ação não poderá ser desfeita.
            </div>
            <div className="chat-new-modal-actions">
              <button
                className="chat-new-modal-button cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingContact}
              >
                Cancelar
              </button>
              <button
                className="chat-new-modal-button confirm"
                onClick={handleDeleteContact}
                disabled={isDeletingContact}
              >
                {isDeletingContact ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para reprodução de vídeo */}
      {showVideoModal && selectedVideo && (
        <div className="chat-new-video-modal" onClick={() => setShowVideoModal(false)}>
          <div className="chat-new-video-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="chat-new-video-modal-header">
              <button 
                className="chat-new-video-modal-close" 
                onClick={() => setShowVideoModal(false)}
              >
                ×
              </button>
            </div>
            <div className="chat-new-video-modal-body">
              <video 
                src={selectedVideo} 
                controls 
                autoPlay 
                className="chat-new-video-player"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatNew; 