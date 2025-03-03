import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/Chat/ChatNew.css';
import dayjs from 'dayjs';
import SessionService from '../services/SessionService';

// Componente de ícone para anexos
const AttachmentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 6V17.5C16.5 19.71 14.71 21.5 12.5 21.5C10.29 21.5 8.5 19.71 8.5 17.5V5C8.5 3.62 9.62 2.5 11 2.5C12.38 2.5 13.5 3.62 13.5 5V15.5C13.5 16.05 13.05 16.5 12.5 16.5C11.95 16.5 11.5 16.05 11.5 15.5V6H10V15.5C10 16.88 11.12 18 12.5 18C13.88 18 15 16.88 15 15.5V5C15 2.79 13.21 1 11 1C8.79 1 7 2.79 7 5V17.5C7 20.54 9.46 23 12.5 23C15.54 23 18 20.54 18 17.5V6H16.5Z" fill="currentColor"/>
  </svg>
);

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

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
  </svg>
);

// Novo componente de ícone para o botão voltar
const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
  </svg>
);

// Componente de visualização de ondas sonoras aprimorado
const AudioWaveform = ({ duration = 30, isPlaying = false, isRecording = false }) => {
  const bars = 40;
  const [barHeights, setBarHeights] = useState<number[]>([]);
  const animationRef = useRef<number | null>(null);
  
  // Gera alturas aleatórias para as barras com uma distribuição mais natural
  const generateRandomHeights = useCallback(() => {
    const heights = [];
    let prevHeight = 20 + Math.random() * 30; // Começa com um valor médio
    
    for (let i = 0; i < bars; i++) {
      // Cria uma variação suave entre barras adjacentes
      const variation = Math.random() * 30 - 15; // Variação de -15 a +15
      let newHeight = prevHeight + variation;
      
      // Mantém a altura dentro de limites razoáveis
      newHeight = Math.max(5, Math.min(95, newHeight));
      
      heights.push(newHeight);
      prevHeight = newHeight;
    }
    
    return heights;
  }, []);
  
  // Inicializa as alturas das barras
  useEffect(() => {
    setBarHeights(generateRandomHeights());
  }, [generateRandomHeights]);
  
  // Atualiza as alturas das barras durante a gravação ou reprodução
  useEffect(() => {
    if (isRecording || isPlaying) {
      const updateWaveform = () => {
        // Durante a gravação, simula a captura de amplitude do microfone
        if (isRecording) {
          setBarHeights(prev => {
            const newHeights = [...prev];
            // Atualiza algumas barras aleatoriamente para simular atividade do microfone
            for (let i = 0; i < 5; i++) {
              const randomIndex = Math.floor(Math.random() * bars);
              const variation = Math.random() * 40 - 20; // Variação maior durante gravação
              let newHeight = newHeights[randomIndex] + variation;
              newHeight = Math.max(5, Math.min(95, newHeight));
              newHeights[randomIndex] = newHeight;
            }
            return newHeights;
          });
        } 
        // Durante a reprodução, cria um efeito de onda mais suave
        else if (isPlaying) {
          setBarHeights(prev => {
            const newHeights = [...prev];
            // Desloca as alturas para criar um efeito de onda
            const firstHeight = newHeights.shift() || 50;
            newHeights.push(firstHeight);
            return newHeights;
          });
        }
        
        animationRef.current = requestAnimationFrame(updateWaveform);
      };
      
      animationRef.current = requestAnimationFrame(updateWaveform);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isRecording, isPlaying, bars]);
  
  return (
    <div className={`audio-waveform ${isPlaying ? 'playing' : ''} ${isRecording ? 'recording' : ''}`}>
      {barHeights.map((height, index) => (
        <div 
          key={index} 
          className="waveform-bar" 
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
};

// Tipos
interface Contact {
  id: number;
  name: string;
  phoneNumber: string;
  profilePicture: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

interface Message {
  id: number;
  content: string;
  isSent: boolean;
  timestamp: string;
  isRead: boolean;
  mediaType?: 'text' | 'image' | 'document' | 'audio';
  mediaUrl?: string;
  fileName?: string;
}

// Dados mockados
const mockContacts: Contact[] = [
  {
    id: 1,
    name: "João Silva",
    phoneNumber: "+55 11 98765-4321",
    profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
    lastMessage: "Olá, tudo bem?",
    lastMessageTime: "2023-08-15T14:30:00",
    unreadCount: 3,
    isOnline: true
  },
  {
    id: 2,
    name: "Maria Oliveira",
    phoneNumber: "+55 11 91234-5678",
    profilePicture: "https://randomuser.me/api/portraits/women/2.jpg",
    lastMessage: "Quando podemos nos encontrar?",
    lastMessageTime: "2023-08-15T10:15:00",
    unreadCount: 0,
    isOnline: false
  },
  {
    id: 3,
    name: "Carlos Mendes",
    phoneNumber: "+55 11 99876-5432",
    profilePicture: "https://randomuser.me/api/portraits/men/3.jpg",
    lastMessage: "Obrigado pela informação!",
    lastMessageTime: "2023-08-14T18:45:00",
    unreadCount: 0,
    isOnline: true
  },
  {
    id: 4,
    name: "Ana Souza",
    phoneNumber: "+55 11 95555-9999",
    profilePicture: "https://randomuser.me/api/portraits/women/4.jpg",
    lastMessage: "Vou verificar e te retorno",
    lastMessageTime: "2023-08-14T09:20:00",
    unreadCount: 1,
    isOnline: false
  },
  {
    id: 5,
    name: "Pedro Santos",
    phoneNumber: "+55 11 97777-8888",
    profilePicture: "https://randomuser.me/api/portraits/men/5.jpg",
    lastMessage: "Preciso de ajuda com meu pedido",
    lastMessageTime: "2023-08-13T16:10:00",
    unreadCount: 5,
    isOnline: true
  }
];

// Mensagens mockadas para cada contato
const mockMessages: Record<number, Message[]> = {
  1: [
    {
      id: 101,
      content: "Olá, como posso ajudar?",
      isSent: true,
      timestamp: "2023-08-15T14:25:00",
      isRead: true
    },
    {
      id: 102,
      content: "Olá, tudo bem?",
      isSent: false,
      timestamp: "2023-08-15T14:30:00",
      isRead: true
    },
    {
      id: 103,
      content: "Estou com uma dúvida sobre o produto",
      isSent: false,
      timestamp: "2023-08-15T14:31:00",
      isRead: true
    },
    {
      id: 104,
      content: "Claro, pode me dizer qual é a sua dúvida?",
      isSent: true,
      timestamp: "2023-08-15T14:32:00",
      isRead: false
    }
  ],
  2: [
    {
      id: 201,
      content: "Bom dia, Maria!",
      isSent: true,
      timestamp: "2023-08-15T10:10:00",
      isRead: true
    },
    {
      id: 202,
      content: "Bom dia! Precisamos conversar sobre o projeto",
      isSent: false,
      timestamp: "2023-08-15T10:12:00",
      isRead: true
    },
    {
      id: 203,
      content: "Quando podemos nos encontrar?",
      isSent: false,
      timestamp: "2023-08-15T10:15:00",
      isRead: true
    }
  ],
  3: [
    {
      id: 301,
      content: "Segue o documento solicitado",
      isSent: true,
      timestamp: "2023-08-14T18:40:00",
      isRead: true,
      mediaType: "document",
      mediaUrl: "#",
      fileName: "relatorio.pdf"
    },
    {
      id: 302,
      content: "Obrigado pela informação!",
      isSent: false,
      timestamp: "2023-08-14T18:45:00",
      isRead: true
    }
  ],
  4: [
    {
      id: 401,
      content: "Ana, você poderia verificar o status do pedido #12345?",
      isSent: true,
      timestamp: "2023-08-14T09:15:00",
      isRead: true
    },
    {
      id: 402,
      content: "Vou verificar e te retorno",
      isSent: false,
      timestamp: "2023-08-14T09:20:00",
      isRead: false
    }
  ],
  5: [
    {
      id: 501,
      content: "Olá, como posso ajudar?",
      isSent: true,
      timestamp: "2023-08-13T16:05:00",
      isRead: true
    },
    {
      id: 502,
      content: "Preciso de ajuda com meu pedido",
      isSent: false,
      timestamp: "2023-08-13T16:10:00",
      isRead: false
    },
    {
      id: 503,
      content: "O produto que recebi está com defeito",
      isSent: false,
      timestamp: "2023-08-13T16:11:00",
      isRead: false
    },
    {
      id: 504,
      content: "Pode me enviar uma foto do problema?",
      isSent: true,
      timestamp: "2023-08-13T16:12:00",
      isRead: false
    },
    {
      id: 505,
      content: "Aqui está a foto",
      isSent: false,
      timestamp: "2023-08-13T16:15:00",
      isRead: false,
      mediaType: "image",
      mediaUrl: "https://via.placeholder.com/300"
    }
  ]
};

const ChatNew: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Adicionando estado para controle de reprodução de áudio
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);

  // Função para reproduzir/pausar áudio
  const toggleAudioPlayback = (messageId: number) => {
    if (playingAudioId === messageId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(messageId);
    }
  };

  // Verificar se há um setor selecionado na sessão
  useEffect(() => {
    const checkSector = () => {
      const sectorId = SessionService.getSession('selectedSector');
      setSelectedSectorId(sectorId);
    };

    // Verificar inicialmente
    checkSector();

    // Configurar um intervalo para verificar periodicamente
    const intervalId = setInterval(checkSector, 1000);

    return () => clearInterval(intervalId);
  }, []);

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
  
  // Filtrar contatos com base no termo de pesquisa
  const filteredContacts = mockContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phoneNumber.includes(searchTerm)
  );

  // Carregar mensagens quando um contato é selecionado
  useEffect(() => {
    if (selectedContact) {
      setMessages(mockMessages[selectedContact.id] || []);
    }
  }, [selectedContact]);

  // Melhorar o comportamento do scroll
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Selecionar um contato
  const handleContactSelect = (contact: Contact) => {
    if (!selectedSectorId) return; // Não permite selecionar contato sem setor
    setSelectedContact(contact);
    
    // Em dispositivos móveis, esconder a sidebar após selecionar um contato
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Voltar para a lista de contatos (apenas mobile)
  const handleBackToContacts = () => {
    setShowSidebar(true);
  };

  // Enviar uma mensagem
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedContact || !selectedSectorId) return;

    const newMessage: Message = {
      id: Date.now(),
      content: messageInput,
      isSent: true,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
    
    // Garantir que o scroll desça após enviar a mensagem
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Lidar com a tecla Enter para enviar mensagem
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentClick = () => {
    setShowAttachments(!showAttachments);
  };

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
    setShowAttachments(false);
  };

  const handleDocumentUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
      fileInputRef.current.click();
    }
    setShowAttachments(false);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact) return;

    const isImage = file.type.startsWith('image/');
    
    const newMessage: Message = {
      id: Date.now(),
      content: '',
      isSent: true,
      timestamp: new Date().toISOString(),
      isRead: false,
      mediaType: isImage ? 'image' : 'document',
      mediaUrl: URL.createObjectURL(file),
      fileName: file.name
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Garantir que o scroll desça após enviar o arquivo
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    // Iniciar timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    setShowAttachments(false);
    
    // Aqui você adicionaria a lógica real para iniciar a gravação de áudio
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    // Parar timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Simular envio de áudio
    const newMessage: Message = {
      id: Date.now(),
      content: '',
      isSent: true,
      timestamp: new Date().toISOString(),
      isRead: false,
      mediaType: 'audio',
      fileName: `Áudio (${formatTime(recordingTime)})`
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Garantir que o scroll desça após enviar o áudio
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const cancelRecording = () => {
    setIsRecording(false);
    
    // Parar timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Aqui você adicionaria a lógica real para cancelar a gravação
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="chat-new-container dark-mode">
      {/* Sidebar de contatos */}
      <div className={`chat-new-sidebar ${!selectedSectorId ? 'disabled' : ''} ${isMobile && !showSidebar ? 'hidden' : ''}`}>
        <div className="chat-new-search">
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!selectedSectorId}
          />
        </div>
        
        <div className="chat-new-contacts">
          {!selectedSectorId ? (
            <div className="chat-new-no-sector">
              <div className="chat-new-no-sector-icon">🔒</div>
              <p>Selecione um setor no menu principal para ver os contatos</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="chat-new-no-contacts">Nenhum contato encontrado</div>
          ) : (
            filteredContacts.map(contact => (
              <div
                key={contact.id}
                className={`chat-new-contact ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                onClick={() => handleContactSelect(contact)}
              >
                <div className="chat-new-contact-avatar">
                  <img src={contact.profilePicture} alt={contact.name} />
                  <span className={`status-indicator ${contact.isOnline ? 'online' : 'offline'}`}></span>
                </div>
                <div className="chat-new-contact-info">
                  <div className="chat-new-contact-header">
                    <span className="chat-new-contact-name">{contact.name}</span>
                    <span className="chat-new-contact-time">
                      {dayjs(contact.lastMessageTime).format('HH:mm')}
                    </span>
                  </div>
                  <div className="chat-new-contact-message">
                    <span className="chat-new-message-preview">{contact.lastMessage}</span>
                    {contact.unreadCount > 0 && (
                      <span className="chat-new-unread-badge">{contact.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className={`chat-new-main ${!selectedSectorId ? 'disabled' : ''}`}>
        {selectedContact ? (
          <>
            {/* Cabeçalho do chat */}
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
                  <img src={selectedContact.profilePicture} alt={selectedContact.name} />
                  <span className={`status-indicator ${selectedContact.isOnline ? 'online' : 'offline'}`}></span>
                </div>
                <div className="chat-new-header-info">
                  <div className="chat-new-header-name">{selectedContact.name}</div>
                  <div className="chat-new-header-status">
                    {selectedContact.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
              <div className="chat-new-header-actions">
                <button 
                  className="chat-new-header-button" 
                  title="Informações do contato"
                  disabled={!selectedSectorId}
                >
                  ℹ️
                </button>
                <div className="chat-new-dropdown">
                  <button 
                    className="chat-new-header-button" 
                    onClick={() => selectedSectorId && setShowDropdown(!showDropdown)}
                    title="Mais opções"
                    disabled={!selectedSectorId}
                  >
                    ⋮
                  </button>
                  {showDropdown && selectedSectorId && (
                    <div className="chat-new-dropdown-menu">
                      <div className="chat-new-dropdown-item">
                        <span>📌</span>
                        <span>Fixar conversa</span>
                      </div>
                      <div className="chat-new-dropdown-item">
                        <span>🔇</span>
                        <span>Silenciar notificações</span>
                      </div>
                      <div className="chat-new-dropdown-item">
                        <span>🗑️</span>
                        <span>Apagar conversa</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="chat-new-messages">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`chat-new-message ${message.isSent ? 'sent' : 'received'}`}
                >
                  {message.mediaType === 'image' ? (
                    <div className="chat-new-message-image">
                      <img src={message.mediaUrl} alt="Imagem" />
                    </div>
                  ) : message.mediaType === 'document' ? (
                    <div className="chat-new-message-document">
                      <DocumentIcon />
                      <span className="document-name">{message.fileName}</span>
                    </div>
                  ) : message.mediaType === 'audio' ? (
                    <div 
                      className="chat-new-message-audio"
                      onClick={() => toggleAudioPlayback(message.id)}
                    >
                      <div className="audio-controls">
                        <button className="audio-play-button">
                          {playingAudioId === message.id ? '⏸️' : '▶️'}
                        </button>
                        <span className="audio-duration">{message.fileName}</span>
                      </div>
                      <AudioWaveform isPlaying={playingAudioId === message.id} isRecording={false} />
                    </div>
                  ) : (
                    <div className="chat-new-message-content">
                      {message.content}
                    </div>
                  )}
                  <div className="chat-new-message-info">
                    <span className="chat-new-message-time">
                      {dayjs(message.timestamp).format('HH:mm')}
                    </span>
                    {message.isSent && (
                      <span className="chat-new-message-status">
                        {message.isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Área de input */}
            <div className="chat-new-input-area">
              {isRecording ? (
                <div className="chat-new-recording-indicator">
                  <div className="chat-new-recording-pulse"></div>
                  <div className="chat-new-recording-waveform">
                    <AudioWaveform isPlaying={false} isRecording={true} />
                  </div>
                  <span className="chat-new-recording-time">{formatTime(recordingTime)}</span>
                  <span className="chat-new-recording-cancel" onClick={cancelRecording}>Cancelar</span>
                </div>
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
                        title="Gravar áudio"
                        onClick={startRecording}
                        disabled={!selectedSectorId || isRecording}
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
                      onClick={handleSendMessage}
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
    </div>
  );
};

export default ChatNew; 