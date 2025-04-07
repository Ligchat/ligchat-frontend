import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/Chat/ChatNew.css';
import dayjs from 'dayjs';
import Toast, { ToastContainer } from '../components/Toast';
import SessionService from '../services/SessionService';
import { getContacts, updateContact } from '../services/ContactService';
import { sendMessage, sendFile } from '../services/WhatsappService';
import { getSector, Sector } from '../services/SectorService';
import { getMessagesByContactId, MessageResponse, MessageType } from '../services/MessageService';
import { AudioMessage } from '../components/AudioMessage';
import { AudioRecorder } from '../components/AudioRecorder';
import { FiMail, FiPhone, FiX, FiSend, FiMoreVertical, FiUserPlus, FiTag } from 'react-icons/fi';
import { getAllUsers, User } from '../services/UserService';
import { WebSocketService } from '../services/WebSocketService';
import { getTags, Tag } from '../services/LabelService';

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

const EditIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
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
interface ContactData {
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
  createdAt: string;
  // Campos adicionais para UI
  profilePicture?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
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
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Verifica se é um número de celular brasileiro
  if (numbers.length === 13 && numbers.startsWith('55')) { // Com DDI: +55 (XX) XXXXX-XXXX
    return `+55 (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
  } else if (numbers.length === 11) { // Sem DDI: (XX) XXXXX-XXXX
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) { // Telefone fixo: (XX) XXXX-XXXX
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  // Se o número já começar com +55, não adiciona novamente
  if (phone.startsWith('+55')) {
    return phone;
  }
  
  // Para outros formatos, adiciona +55 no início
  return `+55 ${phone}`;
};

const getAvatarUrl = (name: string, existingUrl: string | null) => {
  if (existingUrl) return existingUrl;
  // Usar o nome como seed para gerar uma cor consistente
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&seed=${encodeURIComponent(name)}`;
};

const ChatNew: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
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
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [isTagLoading, setIsTagLoading] = useState(false);

  const webSocketRef = useRef<WebSocketService | null>(null);

  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);

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
      const sectorId = SessionService.getSectorId();
      console.log('SectorId da sessão:', sectorId);
      
      // Se não houver setor selecionado, tenta pegar do localStorage
      if (!sectorId) {
        const storedSectorId = localStorage.getItem('selectedSector');
        if (storedSectorId) {
          console.log('SectorId encontrado no localStorage:', storedSectorId);
          SessionService.setSectorId(Number(storedSectorId));
          setSelectedSectorId(storedSectorId);
          return;
        }
      }

      // Se houver setor na sessão, atualiza o estado
      if (sectorId && String(sectorId) !== selectedSectorId) {
        setSelectedSectorId(String(sectorId));
        SessionService.setSectorId(sectorId);
      }
    };

    // Checa imediatamente
    checkSector();

    // Configura o intervalo para checagem periódica
    const intervalId = setInterval(checkSector, 5000); // Reduzido para 5 segundos

    return () => {
      clearInterval(intervalId);
    };
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
  
  // Filtrar contatos com base no termo de pesquisa
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.number.includes(searchTerm)
  );

  // Carregar mensagens quando um contato é selecionado
  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    }
  }, [selectedContact]);

  // Melhorar o comportamento do scroll
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Selecionar um contato
  const handleContactSelect = (contact: ContactData) => {
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

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setTimeout(() => {
    }, 5000);
  };

  const removeToast = (id: number) => {
  };

  useEffect(() => {
    const fetchSelectedSector = async () => {
      if (!selectedSectorId) {
        console.log('Sem selectedSectorId, não buscando setor');
        return;
      }

      try {
        console.log('Buscando setor:', selectedSectorId);
        const sector = await getSector(Number(selectedSectorId));
        console.log('Setor retornado:', sector);
        if (!sector?.phoneNumberId) {
          console.error('Setor não tem phoneNumberId:', sector);
          return;
        }
        setSelectedSector(sector);
      } catch (error) {
        console.error('Erro ao buscar setor:', error);
      }
    };

    fetchSelectedSector();
  }, [selectedSectorId]);

  const handleSendMessage = async () => {
    console.log('handleSendMessage chamado', {
      messageInput,
      selectedContact,
      selectedSectorId,
      selectedSector
    });

    if (!messageInput.trim()) {
      console.log('Mensagem vazia');
      return;
    }
    
    if (!selectedContact) {
      console.log('Nenhum contato selecionado');
      return;
    }
    
    if (!selectedSectorId || !selectedSector?.phoneNumberId) {
      console.log('Setor não selecionado ou phoneNumberId não disponível');
      return;
    }

    const tempId = Date.now();
    const newMessage: Message = {
      id: tempId,
      content: messageInput,
      mediaType: 'text',
      mediaUrl: null,
      fileName: null,
      mimeType: null,
      sectorId: Number(selectedSectorId),
      contactID: selectedContact.id,
      sentAt: new Date().toISOString(),
      isSent: true,
      isRead: false,
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');

    try {
      console.log('Enviando mensagem para a API', {
        message: messageInput,
        to: selectedContact.number,
        recipientNumber: selectedSector.phoneNumberId,
        contactId: selectedContact.id,
        sectorId: Number(selectedSectorId)
      });

      const response = await sendMessage({
        message: messageInput,
        to: selectedContact.number,
        recipientNumber: selectedSector.phoneNumberId,
        text: messageInput,
        contactId: selectedContact.id,
        sectorId: Number(selectedSectorId),
        isHuman: true
      });

      console.log('Resposta da API:', response);

      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...response, status: 'sent' }
          : msg
      ));

      // Atualizar a última mensagem do contato na lista
      setContacts(prevContacts => prevContacts.map(contact => 
        contact.id === selectedContact.id
          ? {
              ...contact,
              lastMessage: messageInput,
              lastMessageTime: new Date().toISOString()
            }
          : contact
      ));

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
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

    setMessages(prev => [...prev, newMessage]);

    try {
      const base64 = await fileToBase64(file);
      const response = await sendFile({
        base64File: base64,
        mediaType: file.type,
        fileName: file.name,
        caption: '',
        recipient: selectedContact.number,
        contactId: selectedContact.id,
        sectorId: Number(selectedSectorId)
      });

      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, id: response.id, status: 'sent' }
          : msg
      ));

      // Atualizar a última mensagem do contato na lista
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
      console.error('Erro ao enviar arquivo:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
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
      fileName: `audio_${tempId}.webm`,
      mimeType: 'audio/webm',
      sectorId: Number(selectedSectorId),
      contactID: selectedContact.id,
      sentAt: new Date().toISOString(),
      isSent: true,
      isRead: false,
      status: 'sending'
    };

    // Adiciona a mensagem temporária ao estado
    setMessages(prev => [...prev, newMessage]);

    try {
      const base64Audio = await fileToBase64(new File([audioBlob], `audio_${tempId}.webm`, { type: 'audio/webm' }));
      const response = await sendFile({
        base64File: base64Audio,
        mediaType: 'audio/webm',
        fileName: `audio_${tempId}.webm`,
        caption: '',
        recipient: selectedContact.number,
        contactId: selectedContact.id,
        sectorId: Number(selectedSectorId)
      });

      // Atualiza a mensagem temporária com os dados do servidor, mantendo o tipo como audio/webm
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { 
              ...response, 
              mediaUrl: audioUrl, 
              mediaType: 'audio',
              mimeType: 'audio/webm',
              status: 'sent' 
            }
          : msg
      ));

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
      console.error('Erro ao enviar áudio:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'error' }
          : msg
      ));
    }
  };

  // Atualizar o useEffect que monitora o selectedSectorId
  useEffect(() => {
    const fetchContacts = async () => {
      if (!selectedSectorId) {
        setContacts([]);
        return;
      }

      setIsLoadingContacts(true);
      setError(null);

      try {
        const [contactsResponse, usersData] = await Promise.all([
          getContacts(Number(selectedSectorId)),
          getAllUsers()
        ]);
        
        console.log('Contatos recebidos:', contactsResponse);
        setUsers(usersData);

        // Processar cada contato com suas mensagens mais recentes
        const contactsWithMessages = await Promise.all(
          contactsResponse.data.map(async (contact: ContactData) => {
            try {
              const messages = await getMessagesByContactId(contact.id);
              const lastMessage = messages[messages.length - 1];
              
              let lastMessagePreview = '';
              let lastMessageTime = contact.createdAt;
              
              if (lastMessage) {
                lastMessageTime = lastMessage.sentAt;
                
                switch (lastMessage.mediaType?.toLowerCase()) {
                  case 'image':
                    lastMessagePreview = lastMessage.isSent ? '📷 Imagem enviada' : '📷 Imagem recebida';
                    break;
                  case 'document':
                    lastMessagePreview = lastMessage.isSent ? '📎 Anexo enviado' : '📎 Anexo recebido';
                    break;
                  case 'audio':
                  case 'voice':
                    lastMessagePreview = lastMessage.isSent ? '🎤 Áudio enviado' : '🎤 Áudio recebido';
                    break;
                  default:
                    lastMessagePreview = lastMessage.content || '';
                }
              }

              return {
                ...contact,
                profilePicture: getAvatarUrl(contact.name, contact.avatarUrl),
                lastMessage: lastMessagePreview,
                lastMessageTime: lastMessageTime,
                phoneNumber: contact.number
              };
            } catch (error) {
              console.error(`Erro ao buscar mensagens para o contato ${contact.id}:`, error);
              return {
                ...contact,
                profilePicture: getAvatarUrl(contact.name, contact.avatarUrl),
                lastMessage: 'Erro ao carregar mensagens',
                lastMessageTime: contact.createdAt,
                phoneNumber: contact.number
              };
            }
          })
        );

        // Ordenar contatos por data da última mensagem (mais recentes primeiro)
        const sortedContacts = contactsWithMessages.sort((a: ContactData, b: ContactData) => {
          const dateA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const dateB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return dateB - dateA;
        });

        console.log('Contatos processados:', sortedContacts);
        setContacts(sortedContacts);
      } catch (err) {
        console.error('Erro ao buscar contatos:', err);
        setError('Erro ao carregar contatos. Tente novamente.');
        setContacts([]);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [selectedSectorId]);

  // Atualizar o render da lista de contatos
  const renderContacts = () => {
    if (!selectedSectorId) {
      return (
        <div className="chat-new-no-sector">
          <div className="chat-new-no-sector-icon">🔒</div>
          <p>Selecione um setor no menu principal para ver os contatos</p>
        </div>
      );
    }

    if (isLoadingContacts) {
      return (
        <div className="chat-new-loading">
          <div className="chat-new-loading-spinner"></div>
          <p>Carregando contatos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="chat-new-error">
          <div className="chat-new-error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
      );
    }

    if (contacts.length === 0) {
      return (
        <div className="chat-new-no-contacts">
          <div className="chat-new-no-contacts-icon">👥</div>
          <p>Nenhum contato encontrado neste setor</p>
        </div>
      );
    }

    return filteredContacts.map(contact => {
      // Encontrar o usuário responsável
      const assignedUser = users.find(u => u.id === contact.assignedTo);
      const assigneeInitials = assignedUser?.name ? (() => {
        const nameParts = assignedUser.name.split(' ');
        if (nameParts.length >= 2) {
          return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        }
        return nameParts[0].substring(0, 2).toUpperCase();
      })() : null;

      // Encontrar a tag do contato
      const tag = tags.find(t => t.id === Number(contact.tagId));

      return (
        <div
          key={contact.id}
          className={`chat-new-contact ${selectedContact?.id === contact.id ? 'selected' : ''}`}
          onClick={() => handleContactSelect(contact)}
        >
          <div className="chat-new-contact-avatar">
            <img 
              src={getAvatarUrl(contact.name, contact.avatarUrl)}
              alt={contact.name}
              style={tag ? {
                borderColor: tag.color
              } : undefined}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getAvatarUrl(contact.name, null);
              }}
            />
            {assigneeInitials && (
              <div className="chat-new-contact-assignee">
                <span 
                  className="assignee-initials" 
                  title={assignedUser?.name}
                >
                  {assigneeInitials}
                </span>
              </div>
            )}
          </div>
          <div className="chat-new-contact-info">
            <div className="chat-new-contact-header">
              <span className="chat-new-contact-name">{contact.name}</span>
              <span className="chat-new-contact-time">
                {contact.lastMessageTime ? dayjs(contact.lastMessageTime).format('HH:mm') : ''}
              </span>
            </div>
            <div className="chat-new-contact-message">
              <span className="chat-new-message-preview">
                {contact.lastMessage || 'Nenhuma mensagem'}
              </span>
              {contact.unreadCount && contact.unreadCount > 0 && (
                <span className="chat-new-unread-badge">{contact.unreadCount}</span>
              )}
            </div>
            <div className="chat-new-contact-details">
              {contact.email && (
                <span className="chat-new-contact-email" title={contact.email}>
                  <FiMail size={12} />
                  {contact.email}
                </span>
              )}
              {contact.number && (
                <span className="chat-new-contact-phone">
                  <FiPhone size={12} />
                  {formatPhoneNumber(contact.number)}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  // Atualizar o componente de mensagem para mostrar os estados
  const renderMessageStatus = (message: Message) => {
    if (message.status === 'sending') {
      return <span className="chat-new-message-status sending">✓</span>;
    } else if (message.status === 'error') {
      return <span className="chat-new-message-status error">⚠️</span>;
    } else if (message.status === 'sent') {
      return <span className="chat-new-message-status">✓✓</span>;
    } else {
      return <span className="chat-new-message-status">✓</span>;
    }
  };

  // Adicionar função para carregar mensagens
  const loadMessages = async (contactId: number) => {
    try {
      const fetchedMessages = await getMessagesByContactId(contactId);
      setMessages(fetchedMessages.map(msg => ({
        ...msg,
        status: msg.isSent ? 'sent' : undefined
      })));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  // Atualizar a renderização das mensagens
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

    // Determinar se a mensagem deve ser exibida como enviada
    // Agora considera APENAS o isSent para determinar se a mensagem foi enviada
    const shouldRenderAsSent = message.isSent;

    return (
      <div 
        key={message.id} 
        className={`chat-new-message ${shouldRenderAsSent ? 'sent' : 'received'}`}
      >
        {renderMediaContent()}
        <div className="chat-new-message-info">
          <span className="chat-new-message-time">
            {dayjs(message.sentAt).format('HH:mm')}
          </span>
          {shouldRenderAsSent && renderMessageStatus(message)}
        </div>
      </div>
    );
  };

  // Definir o handler de mensagens como useCallback para acessar o selectedContact atual
  const messageHandler = useCallback((message: any) => {
    console.log('Mensagem recebida no ChatNew:', message);
    
    // Normalizar mensagem do WebSocket
    if (message.type === 'message') {
      // Mensagem sem WebSocket
      const normalizedMessage: Message = {
        id: Date.now(),
        content: message.content,
        mediaType: 'text',
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        sectorId: message.sectorId,
        contactID: message.contactId,
        sentAt: message.sentAt,
        isSent: message.isAgent || false,
        isRead: false,
        status: 'sent'
      };
      
      if (selectedContact && message.contactId === selectedContact.id) {
        setMessages(prev => [...prev, normalizedMessage]);
      }
    } else {
      // Mensagem com WebSocket
      const contactId = message.contactID || message.contactId;
      const normalizedMessage: Message = {
        id: message.id || Date.now(),
        content: message.content || '',
        mediaType: message.mediaType || 'text',
        mediaUrl: message.mediaUrl || null,
        fileName: message.fileName || null,
        mimeType: message.mimeType || null,
        sectorId: message.sectorId,
        contactID: contactId,
        sentAt: message.sentAt || new Date().toISOString(),
        isSent: message.isAgent || false,
        isRead: false,
        status: 'sent'
      };

      // Verificar se a mensagem é para o contato atual e atualizar o estado
      if (selectedContact && (Number(normalizedMessage.contactID) === selectedContact.id)) {
        setMessages(prevMessages => {
          // Verificar se a mensagem já existe ou se é uma mensagem de áudio que já está sendo enviada
          const messageExists = prevMessages.some(m => 
            m.id === normalizedMessage.id || 
            (m.mediaType === 'audio' && m.status === 'sending' && normalizedMessage.mediaType === 'audio')
          );
          
          if (!messageExists) {
            return [...prevMessages, normalizedMessage];
          }
          return prevMessages;
        });
      }
    }
    
    // Atualizar lista de contatos
    const updateContacts = async () => {
      try {
        const sectorId = SessionService.getSectorId();
        if (!sectorId) return;

        const contactsResponse = await getContacts(sectorId);
        if (!contactsResponse?.data) return;

        const currentContactsMap = new Map(contacts.map(contact => [contact.id, contact]));
        
        const contactId = message.contactID || message.contactId;
        let messagePreview = '';
        
        if (message.mediaType) {
          switch (message.mediaType.toLowerCase()) {
            case 'image':
              messagePreview = message.isSent ? '📷 Imagem enviada' : '📷 Imagem recebida';
              break;
            case 'document':
              messagePreview = message.isSent ? '📎 Anexo enviado' : '📎 Anexo recebido';
              break;
            case 'audio':
            case 'voice':
              messagePreview = message.isSent ? '🎤 Áudio enviado' : '🎤 Áudio recebido';
              break;
            default:
              messagePreview = message.content || 'Nova mensagem';
          }
        } else {
          messagePreview = message.content || 'Nova mensagem';
        }

        const formattedContacts = contactsResponse.data.map(contact => {
          const existingContact = currentContactsMap.get(contact.id);
          if (contact.id === contactId) {
            return {
              ...contact,
              profilePicture: getAvatarUrl(contact.name, contact.avatarUrl),
              lastMessage: messagePreview,
              lastMessageTime: new Date().toISOString()
            };
          }
          return {
            ...contact,
            profilePicture: getAvatarUrl(contact.name, contact.avatarUrl),
            lastMessage: existingContact?.lastMessage || 'Nenhuma mensagem',
            lastMessageTime: existingContact?.lastMessageTime || contact.createdAt
          };
        });

        const sortedContacts = formattedContacts.sort((a, b) => {
          const dateA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const dateB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return dateB - dateA;
        });

        setContacts(sortedContacts);
      } catch (error) {
        console.error('Erro ao atualizar contatos:', error);
      }
    };

    updateContacts();
  }, [selectedContact, contacts]);

  // Atualizar inicialização do WebSocket
  useEffect(() => {
    const sectorId = SessionService.getSectorId();
    if (!sectorId) return;

    console.log('Inicializando WebSocket para o setor:', sectorId);
    
    const ws = new WebSocketService();
    webSocketRef.current = ws;
    
    ws.connect(sectorId.toString());
    ws.addMessageHandler(messageHandler);
    
    return () => {
      console.log('Desconectando WebSocket');
      if (webSocketRef.current) {
        webSocketRef.current.removeMessageHandler(messageHandler);
        webSocketRef.current.disconnect();
        webSocketRef.current = null;
      }
    };
  }, [messageHandler, selectedContact]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const sectorId = SessionService.getSectorId();
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
    } catch (error) {
      console.error('Erro ao buscar dados iniciais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [selectedSectorId]);

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

      setContacts(prevContacts => prevContacts.map(contact => 
        contact.id === selectedContact.id
          ? { ...contact, assignedTo: selectedUserId }
          : contact
      ));

      showToast('Contato transferido com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao transferir contato:', error);
      showToast('Erro ao transferir contato', 'error');
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

      setContacts(prevContacts => prevContacts.map(contact => 
        contact.id === selectedContact.id
          ? { ...contact, tagId: selectedTagId || null }
          : contact
      ));

      showToast(selectedTagId ? 'Tag alterada com sucesso' : 'Tag removida com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao alterar tag:', error);
      showToast('Erro ao alterar tag', 'error');
    } finally {
      setIsTagLoading(false);
      setShowTagModal(false);
      setSelectedTagId(null);
    }
  };

  return (
    <div className="chat-new-container dark-mode">
      {/* Sidebar de contatos */}
      <div className={`chat-new-sidebar ${!showSidebar ? 'hidden' : ''}`}>
        <div className="chat-new-search">
          <input
            type="text"
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="chat-new-contacts">
          {renderContacts()}
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
                  <img 
                    src={selectedContact.profilePicture} 
                    alt={selectedContact.name}
                    style={selectedContact.tagId ? {
                      borderColor: tags.find(t => t.id === selectedContact.tagId)?.color
                    } : undefined}
                  />
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
                      {selectedContact.tagId && (
                        <span 
                          className="chat-new-header-tag"
                          style={{
                            backgroundColor: tags.find(t => t.id === selectedContact.tagId)?.color,
                            color: '#fff'
                          }}
                        >
                          {tags.find(t => t.id === selectedContact.tagId)?.name}
                        </span>
                      )}
                      {selectedContact.assignedTo && (
                        <span className="chat-new-header-assigned">
                          <UserIcon />
                          <span>{users.find(u => u.id === selectedContact.assignedTo)?.name}</span>
                        </span>
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
                        setShowTagModal(true);
                        setShowMenu(false);
                      }}
                    >
                      <FiTag />
                      Alterar tag
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="chat-new-messages">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
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
                        title="Gravar áudio"
                        onClick={() => setIsRecording(true)}
                        disabled={!selectedSectorId}
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
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
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
    </div>
  );
};

export default ChatNew; 