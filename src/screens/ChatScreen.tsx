import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Layout,
  Input,
  Button,
  Avatar,
  List,
  Typography,
  message, 
  Drawer,
  Modal, 
  Skeleton,
  Divider,
  Select,
  Badge,
  Tooltip, 
  Dropdown,
  Tag,
} from 'antd';
import {
  UserOutlined,
  PaperClipOutlined, 
  EyeOutlined,
  ArrowLeftOutlined,
  MoreOutlined, 
  PhoneOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  UserSwitchOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'react-h5-audio-player/lib/styles.css';
import './ChatPage.css';
import { AudioMessage } from '../components/AudioMessage';
import ChatInput from '../components/ChatInput';
import { MessageAttachment } from '../types';
import { useMenu } from '../contexts/MenuContext';
import { getWhatsAppContacts, getMessagesByContactId, WhatsAppContact } from '../services/WhatsappContactService';
import { sendMessage, sendFile, MessageType } from '../services/MessageService';
import { getUser, User, getAllUsers } from '../services/UserService';
import { WebSocketService } from '../services/WebSocketService';
import SessionService from '../services/SessionService';

// Interface do Estado
interface ChatState {
  contacts: WhatsAppContact[];
  selectedContact: WhatsAppContact | null;
  messages: MessageType[];
  messageInput: string;
  filters: {
    searchTerm: string;
    selectedFilter: string;
    responsibleUser: string | null;
  };
  ui: {
    isLoading: boolean;
    showChat: boolean;
    showContactList: boolean;
    showDrawer: boolean;
    showEmojiPicker: boolean;
    isRecording: boolean;
  };
  media: {
    recordedAudio: Blob | null;
    filesToUpload: File[];
    filesWithUid: Array<{ file: File; uid: string }>;
  };
  recording: {
    isRecording: boolean;
    duration: number;
    audioData: number[];
  };
}

dayjs.extend(relativeTime);

const { Header, Sider, Content } = Layout;
const { TextArea, Search } = Input;
const { Title, Text } = Typography;

// Adicione esta função de utilidade
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Função auxiliar para determinar o tipo de mídia
const determineMediaType = (message: MessageType): string => {
  // Se já tem um mediaType definido corretamente
  if (message.mediaType === 'image' || message.mediaType === 'audio') {
    return message.mediaType;
  }

  // Verifica pela URL
  const url = message.mediaUrl || message.attachment?.url || '';
  const fileName = message.fileName || message.attachment?.name || '';

  if (url.includes('/uploads/image/') || 
      fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
      url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return 'image';
  }

  if (url.includes('/uploads/audio/') || 
      fileName.match(/\.(mp3|wav|ogg|m4a)$/i) ||
      url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
    return 'audio';
  }

  if (fileName.endsWith('.exe') || url.includes('msdownload')) {
    return 'document';
  }

  return message.mediaType || 'document';
};

// Atualiza a função normalizeMessage
const normalizeMessage = (message: MessageType) => {
  console.log('Normalizando mensagem:', message);

  // Se não tem mídia, retorna a mensagem como está
  if (!message.mediaUrl && !message.attachment?.url) {
    return message;
  }

  const mediaType = determineMediaType(message);
  console.log('Tipo de mídia determinado:', mediaType);

  // Para áudios, mantém tanto mediaUrl quanto attachment
  if (mediaType === 'audio') {
    return {
      ...message,
      mediaType,
      mediaUrl: message.mediaUrl || message.attachment?.url,
      fileName: message.fileName || message.attachment?.name,
      attachment: {
        url: message.mediaUrl || message.attachment?.url,
        type: mediaType,
        name: message.fileName || message.attachment?.name || 'audio'
      }
    };
  }

  // Para outros tipos de mídia...
  return {
    ...message,
    mediaType,
    mediaUrl: message.mediaUrl || message.attachment?.url,
    fileName: message.fileName || message.attachment?.name,
    attachment: mediaType === 'document' ? {
      type: 'document',
      url: message.mediaUrl || message.attachment?.url,
      name: message.fileName || message.attachment?.name || 'arquivo'
    } : null
  };
};

const ChatPage: React.FC = () => {
  // Hooks e Estados
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [state, setState] = useState<ChatState>({
    contacts: [],
    selectedContact: null,
    messages: [],
    messageInput: '',
    filters: {
      searchTerm: '',
      selectedFilter: 'all',
      responsibleUser: null,
    },
    ui: {
      isLoading: true,
      showChat: true,
      showContactList: true,
      showDrawer: false,
      showEmojiPicker: false,
      isRecording: false,
    },
    media: {
      recordedAudio: null,
      filesToUpload: [],
      filesWithUid: [],
    },
    recording: {
      isRecording: false,
      duration: 0,
      audioData: [],
    },
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const { drawerVisible, setDrawerVisible, setDrawerType } = useMenu();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const webSocketRef = useRef<WebSocketService>(new WebSocketService());

  // Ref para o container de mensagens
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Adicione um estado para o sectorId
  const [sectorId, setSectorId] = useState<number | null>(null);

  // Função melhorada para scroll
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Modifique o handler do WebSocket para logar mais informações
  const handleMessage = useCallback((message: MessageType) => {
    console.log('Mensagem original recebida no WebSocket:', message);
    
    const messageContactId = Number(message.contactID);
    const selectedContactId = Number(state.selectedContact?.id);
    
    console.log('Comparando IDs:', {
      messageContactId,
      selectedContactId,
      matches: messageContactId === selectedContactId
    });
    
    if (messageContactId === selectedContactId) {
      const messageExists = state.messages.some(m => m.id === message.id);
      console.log('Mensagem já existe?', messageExists);
      
      if (!messageExists) {
        const normalizedMessage = normalizeMessage(message);
        console.log('Mensagem normalizada:', normalizedMessage);
        
        setState(prevState => ({
          ...prevState,
          messages: [...prevState.messages, normalizedMessage]
        }));
        
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }
  }, [state.selectedContact?.id, state.messages, scrollToBottom]);

  // Effect para WebSocket
  useEffect(() => {
    if (!state.selectedContact?.sectorId) return;

    const webSocket = webSocketRef.current;
    webSocket.addMessageHandler(handleMessage);
    webSocket.connect(state.selectedContact.sectorId.toString());

    return () => {
      webSocket.removeMessageHandler(handleMessage);
      webSocket.disconnect();
    };
  }, [state.selectedContact?.sectorId, handleMessage]);

  // Effect para carregar mensagens iniciais
  useEffect(() => {
    const loadMessages = async () => {
      if (!state.selectedContact) return;

      try {
        setState(prev => ({
          ...prev,
          ui: { ...prev.ui, isLoading: true }
        }));

        const messages = await getMessagesByContactId(state.selectedContact.id);
        
        setState(prev => ({
          ...prev,
          messages: messages.map(msg => ({
            ...msg,
            id: msg.id || Date.now(),
            content: msg.content || '',
            isSent: msg.isSent || false,
            contactID: msg.contactID,
            isRead: msg.isRead || false,
            sentAt: msg.sentAt || new Date().toISOString()
          })),
          ui: { ...prev.ui, isLoading: false }
        }));

        // Força o scroll inicial
        requestAnimationFrame(() => {
          scrollToBottom(false);
        });
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        message.error('Erro ao carregar conversa');
        setState(prev => ({
          ...prev,
          ui: { ...prev.ui, isLoading: false }
        }));
      }
    };

    loadMessages();
  }, [state.selectedContact?.id]);

  // Memoize funções que não precisam ser recriadas
  const handleMessageChange = useCallback((value: string) => {
    handleStateUpdate({ messageInput: value });
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!state.selectedContact || !content.trim() || !sectorId) return;

    try {
      const response = await sendMessage({
        content,
        sectorId: sectorId,
        recipient: state.selectedContact.phoneNumber,
        contactId: state.selectedContact.id
      });

      const newMessage: MessageType = {
        id: response.id,
        content,
        isSent: true,
        contactID: state.selectedContact.id,
        sectorId: sectorId,
        isRead: false,
        sentAt: new Date().toISOString()
      };

      handleStateUpdate({
        messages: [...state.messages, newMessage],
        messageInput: ''
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      message.error('Erro ao enviar mensagem');
    }
  }, [state.selectedContact, state.messages, sectorId]);

  // No messagesList, adicione logs para debug
  const messagesList = useMemo(() => {
    return state.messages.map((message) => {
      const normalizedMessage = normalizeMessage(message);
      console.log('Renderizando mensagem:', normalizedMessage);
      
      return (
        <div
          key={normalizedMessage.id}
          className={`message-container ${normalizedMessage.isSent ? 'sent' : 'received'}`}
        >
          {!normalizedMessage.isSent && (
            <Avatar
              size="small"
              src={state.selectedContact?.profilePictureUrl}
              icon={<UserOutlined />}
              className="message-avatar"
            />
          )}
          
          {normalizedMessage.mediaType === 'document' ? (
            <div className="message-document">
              <Button
                icon={<PaperClipOutlined />}
                onClick={() => handleDownload(
                  normalizedMessage.mediaUrl!, 
                  normalizedMessage.fileName || 'arquivo'
                )}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {normalizedMessage.fileName || 'Arquivo'}
              </Button>
            </div>
          ) : normalizedMessage.mediaType === 'image' ? (
            <div 
              className="message-image-container"
              onClick={() => {
                Modal.info({
                  icon: null,
                  maskClosable: true,
                  centered: true,
                  width: '90%',
                  footer: null,
                  closable: true,
                  content: (
                    <div className="image-preview-modal">
                      <img 
                        src={normalizedMessage.mediaUrl} 
                        alt="Visualização"
                        style={{ 
                          width: '100%', 
                          maxHeight: '80vh', 
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                      />
                    </div>
                  ),
                });
              }}
            >
              <img
                src={normalizedMessage.mediaUrl}
                alt="Imagem"
                className="message-image"
              />
            </div>
          ) : normalizedMessage.mediaType === 'audio' ? (
            <AudioMessage
              src={normalizedMessage.mediaUrl}
              attachment={normalizedMessage.attachment}
              isSent={normalizedMessage.isSent}
            />
          ) : (
            <div className={`message-bubble ${normalizedMessage.isSent ? 'message-sent' : 'message-received'}`}>
              <div className="message-text">{normalizedMessage.content}</div>
              <div className="message-footer">
                <span className="message-time">
                  {dayjs(normalizedMessage.createdAt).format('HH:mm')}
                </span>
                {normalizedMessage.isSent && (
                  <span className="message-status">
                    {normalizedMessage.isRead ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    });
  }, [state.messages, state.selectedContact]);

  // Função auxiliar para download
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      message.error('Erro ao baixar arquivo');
    }
  };

  // Handlers
  const handleStateUpdate = useCallback((updates: Partial<ChatState> | ((prev: ChatState) => ChatState)) => {
    if (typeof updates === 'function') {
      setState(updates);
    } else {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const handleContactSelect = useCallback(async (contact: WhatsAppContact) => {
    try {
      handleStateUpdate({
        selectedContact: contact,
        ui: {
          ...state.ui,
          isLoading: true,
          showChat: true,
          showContactList: isMobile ? false : true
        }
      });

      const messages = await getMessagesByContactId(contact.id);
      
      handleStateUpdate({
        messages,
        ui: { 
          ...state.ui, 
          isLoading: false,
          showChat: true,
          showContactList: isMobile ? false : true
        }
      });

    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      message.error('Erro ao carregar conversa');
      handleStateUpdate({ 
        ui: { ...state.ui, isLoading: false }
      });
    }
  }, [isMobile, state.ui]);

  // Handlers de Mídia
  const handleStartRecording = async () => {
      setIsRecording(true);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

  const handleSendRecording = (audioBlob: Blob) => {
    // Lógica para enviar o áudio
    handleStateUpdate({
      media: { ...state.media, recordedAudio: audioBlob }
    });
    setIsRecording(false);
  };

  const handleFileUpload = useCallback(async (file: File, type: 'image' | 'document') => {
    if (!state.selectedContact || !sectorId) return;

    try {
      const base64File = await convertFileToBase64(file);
      
      const fileData = {
        base64File,
        mediaType: type === 'image' ? 'image' : 'document',
        fileName: file.name,
        caption: '',
        recipient: state.selectedContact.phoneNumber,
        contactId: state.selectedContact.id,
        sectorId: sectorId
      };

      const response = await sendFile(fileData);

      // Atualiza a lista de mensagens com o arquivo enviado
      const newMessage: MessageType = {
        id: response.id,
        content: null,
        isSent: true,
        mediaType: type,
        mediaUrl: URL.createObjectURL(file), // URL temporária
        contactID: state.selectedContact.id,
        sectorId: sectorId,
        isRead: false
      };

      handleStateUpdate({
        messages: [...state.messages, newMessage]
      });

    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      message.error('Erro ao enviar arquivo');
    }
  }, [state.selectedContact, state.messages, sectorId]);

  // Função auxiliar para converter File para Base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove o prefixo "data:image/jpeg;base64," do base64
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Handlers de UI
  const handleBackToContacts = useCallback(() => {
    handleStateUpdate({
      ui: {
        ...state.ui,
        showContactList: true,
        showChat: false
      }
    });
  }, [state.ui]);

  const handleSearch = useCallback((value: string) => {
    handleStateUpdate({
      filters: { ...state.filters, searchTerm: value }
    });
  }, [state.filters]);

  const handleFilterChange = useCallback((value: string) => {
    handleStateUpdate({
      filters: { ...state.filters, selectedFilter: value }
    });
  }, [state.filters]);

  const handleToggleEmojiPicker = useCallback(() => {
    handleStateUpdate({
      ui: { ...state.ui, showEmojiPicker: !state.ui.showEmojiPicker }
    });
  }, [state.ui.showEmojiPicker]);

  const handleMenuClick = useCallback(() => {
    setDrawerType('menu');
    setDrawerVisible(true);
  }, [setDrawerType, setDrawerVisible]);

  // Effects
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Pega o sectorId da sessão
        const sectorIdFromSession = SessionService.getSession('selectedSector');
        
        if (!sectorIdFromSession) {
          message.error('Nenhum setor selecionado');
          return;
        }

        setSectorId(Number(sectorIdFromSession));
        
        // Use o sectorId da sessão para carregar os contatos
        const contacts = await getWhatsAppContacts(Number(sectorIdFromSession));
        const user = await getUser(1); // Substitua pelo userId real

        handleStateUpdate({ 
          contacts,
          ui: { ...state.ui, isLoading: false }
        });
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        message.error('Erro ao carregar contatos');
        handleStateUpdate({ 
          ui: { ...state.ui, isLoading: false }
        });
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const filterContacts = async () => {
      try {
        // Usa o sectorId do estado
        if (!sectorId) {
          return;
        }

        const allContacts = await getWhatsAppContacts(sectorId);
        
        // Aplica os filtros
        const filteredContacts = allContacts.filter(contact => {
          const matchesSearch = contact.name.toLowerCase().includes(state.filters.searchTerm.toLowerCase());
          const matchesFilter = state.filters.selectedFilter === 'all' ? true :
            state.filters.selectedFilter === 'unread' ? !contact.isViewed :
            state.filters.selectedFilter === 'assigned' ? contact.responsibleId === currentUser?.id :
            state.filters.selectedFilter === 'unassigned' ? !contact.responsibleId :
            contact.isViewed;
          
          return matchesSearch && matchesFilter;
        });

        handleStateUpdate({ contacts: filteredContacts });
      } catch (error) {
        console.error('Erro ao filtrar contatos:', error);
      }
    };

    filterContacts();
  }, [state.filters.searchTerm, state.filters.selectedFilter, currentUser?.id, sectorId]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const loadedUsers = await getAllUsers();
        setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
      } catch (error) {
        console.error('Error loading users:', error);
        message.error('Failed to load users');
        setUsers([]); // Set empty array on error
      }
    };
    
    loadUsers();
  }, []);

  const fetchInitialContacts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, ui: { ...prev.ui, isLoading: true } }));
      
      const sectorId = SessionService.getSessionForSector();
      if (!sectorId) {
        console.error('Sector ID not found in session');
        setState(prev => ({ ...prev, ui: { ...prev.ui, isLoading: false } }));
        return;
      }

      const contacts = await getWhatsAppContacts(sectorId);
      
      // Garante que contacts é um array e mapeia os dados necessários
      const formattedContacts = (Array.isArray(contacts) ? contacts : []).map(contact => ({
        ...contact,
        unreadCount: 0,
        lastMessage: null,
        isOnline: false
      }));

      setState(prev => ({
        ...prev,
        contacts: formattedContacts,
        ui: { ...prev.ui, isLoading: false }
      }));

    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      message.error('Erro ao carregar contatos');
      setState(prev => ({
        ...prev,
        contacts: [], // Garante um array vazio em caso de erro
        ui: { ...prev.ui, isLoading: false }
      }));
    }
  }, []);

  // Use o useEffect para carregar os dados iniciais apenas uma vez
  useEffect(() => {
    fetchInitialContacts();
  }, []); // Array de dependências vazio

  // Função para carregar mensagens de um contato
  const loadMessages = useCallback(async (contactId: number) => {
    try {
      setState(prev => ({ ...prev, ui: { ...prev.ui, isLoading: true } }));
      const messages = await getMessagesByContactId(contactId);
      
      setState(prev => ({
        ...prev,
        messages: messages.map(msg => normalizeMessage(msg)),
        ui: { ...prev.ui, isLoading: false }
      }));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setState(prev => ({
        ...prev,
        ui: { ...prev.ui, isLoading: false }
      }));
    }
  }, []);

  // Atualiza as mensagens quando um contato é selecionado
  useEffect(() => {
    if (state.selectedContact) {
      loadMessages(state.selectedContact.id);
    }
  }, [state.selectedContact, loadMessages]);

  // Componentes de Renderização
  const ContactItem: React.FC<{ contact: WhatsAppContact }> = ({ contact }) => (
    <div 
      className={`contact-list-item ${contact.isViewed ? 'read' : 'unread'} ${
        state.selectedContact?.id === contact.id ? 'selected' : ''
      }`}
      onClick={() => handleContactSelect(contact)}
            >
              <List.Item.Meta
        avatar={
          <Badge
            dot={!contact.isViewed}
            offset={[-2, 2]}
            color={contact.isOnline ? 'var(--success-color)' : 'var(--text-light)'}
          >
            <Avatar
              size="large"
              src={contact.profilePictureUrl}
              icon={<UserOutlined />}
            />
          </Badge>
        }
        title={
          <div className="contact-header">
            <span className="contact-name">{contact.name}</span>
            <Text type="secondary" className="contact-time">
              {dayjs(contact.lastMessageTime).fromNow()}
            </Text>
        </div>
        }
        description={
          <div className="contact-preview">
            <Text ellipsis className="last-message">
              {contact.lastMessage || 'Iniciar conversa'}
            </Text>
            {contact.unreadCount > 0 && (
              <span className="contact-badge">
                {contact.unreadCount}
              </span>
            )}
          </div>
        }
            />
          </div>
  );

  const ChatHeader: React.FC = () => (
    <Header className="chat-header">
      <div className="chat-header-left">
        {isMobile && (
          <>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToContacts}
              className="back-button"
              style={{ marginRight: '8px' }}
            />
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={handleMenuClick}
              className="menu-button"
              style={{ marginRight: '8px' }}
            />
          </>
        )}
        <Avatar
          size="large"
          src={state.selectedContact?.profilePictureUrl}
          icon={<UserOutlined />}
        />
        <div className="contact-info">
          <Title level={5} className="contact-name">
            {state.selectedContact?.name}
            </Title>
          <Text type="secondary" className="contact-status">
            {state.selectedContact?.isOnline ? 'Online' : 'Offline'}
          </Text>
          {state.selectedContact?.assignedTo && (
            <Tag color="blue" className="assigned-tag">
              <Avatar 
                size="small" 
                src={state.selectedContact.assignedTo.avatar}
              />
              <span>Atribuído a {state.selectedContact.assignedTo.name}</span>
            </Tag>
          )}
        </div>
          </div>

      <div className="chat-header-actions">
        <Tooltip title="Chamada de áudio">
          <Button type="text" icon={<PhoneOutlined />} />
        </Tooltip>
        <Tooltip title="Chamada de vídeo">
          <Button type="text" icon={<VideoCameraOutlined />} />
        </Tooltip>
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: 'Informações do contato',
                icon: <EyeOutlined />,
                onClick: () => handleStateUpdate({
                  ui: { ...state.ui, showDrawer: true }
                })
              },
              {
                key: '2',
                label: 'Limpar conversa',
                icon: <ClockCircleOutlined />
              },
              {
                key: 'assign',
                label: 'Delegar conversa',
                icon: <UserSwitchOutlined />,
                children: Array.isArray(users) ? users.map(user => ({
                  key: `assign-${user.id}`,
                  label: user.name,
                  onClick: () => handleAssignContact(state.selectedContact, user),
                })) : []
              }
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
          </div>
        </Header>
  );

  const handleAssignContact = useCallback(async (contact: WhatsAppContact, user: User) => {
    try {
      handleStateUpdate({ ui: { ...state.ui, isLoading: true } });

      // Atualiza o contato com o novo responsável
      const updatedContacts = state.contacts.map(c => {
        if (c.id === contact.id) {
          return {
            ...c,
            assignedTo: user,
            assignedAt: new Date().toISOString()
          };
        }
        return c;
      });

      handleStateUpdate({
        contacts: updatedContacts,
        ui: { ...state.ui, isLoading: false }
      });

      message.success(`Conversa delegada para ${user.name}`);
    } catch (error) {
      message.error('Erro ao delegar conversa');
      handleStateUpdate({ ui: { ...state.ui, isLoading: false } });
    }
  }, [state.contacts, state.ui]);

  const handleImageClick = useCallback((url?: string) => {
    if (!url) return;
    
    Modal.info({
      icon: null,
      content: (
        <img 
          src={url} 
          alt="Visualização"
          style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
        />
      ),
      width: '90%',
      centered: true,
      footer: null
    });
  }, []);

  return (
    <div className="chat-page">
      <Layout className="chat-container">
        <Sider
          className={`chat-sider ${!state.ui.showContactList ? 'hidden' : ''}`}
          width={350}
          collapsible={false}
          style={{ position: 'relative' }}
        >
          <div className="contact-search-area">
            <Search
              placeholder="Buscar conversas..."
              onChange={(e) => handleSearch(e.target.value)}
              className="contact-search"
            />
            <Select
              defaultValue="all"
              onChange={handleFilterChange}
              className="contact-filter"
            >
              <Select.Option value="all">Todas as conversas</Select.Option>
              <Select.Option value="unread">Não lidas</Select.Option>
              <Select.Option value="assigned">Atribuídas a mim</Select.Option>
              <Select.Option value="unassigned">Não atribuídas</Select.Option>
            </Select>
            </div>

          <div className="contacts-list-container">
            <List
              dataSource={state.contacts}
              renderItem={(contact) => <ContactItem contact={contact} />}
              locale={{ emptyText: 'Nenhuma conversa encontrada' }}
            />
          </div>
        </Sider>

        {state.selectedContact && (
          <Layout className="chat-content-wrapper">
            <ChatHeader />
            
            <Content 
              className="chat-messages"
              ref={messagesContainerRef}
            >
              {state.ui.isLoading ? (
                <div className="loading-messages">
                  <Skeleton avatar active paragraph={{ rows: 3 }} />
                  <Skeleton avatar active paragraph={{ rows: 2 }} />
                  <Skeleton avatar active paragraph={{ rows: 3 }} />
                </div>
              ) : (
                <>
                  {messagesList}
                </>
              )}
            </Content>

            <ChatInput
              messageInput={state.messageInput}
              onMessageChange={handleMessageChange}
              onSendMessage={handleSendMessage}
              onFileUpload={handleFileUpload}
              showEmojiPicker={state.ui.showEmojiPicker}
              onToggleEmojiPicker={handleToggleEmojiPicker}
              contactId={state.selectedContact?.id || 0}
              sectorId={state.selectedContact?.sectorId || 0}
              recipient={state.selectedContact?.phoneNumber || ''}
            />
          </Layout>
        )}

        <Drawer
          title="Informações do Contato"
          placement={isMobile ? 'bottom' : 'right'}
          onClose={() => handleStateUpdate({ ui: { ...state.ui, showDrawer: false }})}
          visible={state.ui.showDrawer}
          width={isMobile ? '100%' : 400}
          height={isMobile ? '80vh' : undefined}
        >
          {state.selectedContact && (
            <div className="contact-details">
              <div className="contact-profile">
                <Avatar
                  size={80}
                  src={state.selectedContact.profilePictureUrl}
                  icon={<UserOutlined />}
                />
                <Title level={4}>{state.selectedContact.name}</Title>
                <Text type="secondary">{state.selectedContact.phoneNumber}</Text>
                  </div>

              <Divider />

              {/* Adicione aqui mais informações do contato e opções de edição */}
            </div>
          )}
          </Drawer>

        <Drawer
          title={null}
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ 
            padding: '0',
            height: '100vh',
            overflow: 'auto'
          }}
          width="100%"
          height="100vh"
          style={{
            backgroundColor: '#1f1f1f',
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh'
          }}
          maskStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }}
          closeIcon={<MenuOutlined style={{ color: '#fff', fontSize: '20px' }} />}
        >
          {/* Conteúdo do menu aqui */}
        </Drawer>
      </Layout>
    </div>
  );
};

export default React.memo(ChatPage);

