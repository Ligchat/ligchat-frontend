import React, { useEffect, useState, useRef } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import Picker from '@emoji-mart/react';
import {
  createMessageScheduling,
  deleteMessageScheduling,
  getMessageSchedulings,
  updateMessageScheduling,
  getMessageScheduling
} from '../services/MessageSchedulingsService';
import { getTags, Tag } from '../services/LabelService';
import { getContacts, Contact } from '../services/ContactService';
import SessionService from '../services/SessionService';
import './MessageSchedule.css';
import Toast, { ToastContainer } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

dayjs.extend(customParseFormat);

// Definindo explicitamente a interface CreateMessageSchedulingDTO para corrigir o erro de tipo
interface CreateMessageSchedulingDTO {
  name: string;
  messageText: string;
  sendDate: string;
  contactId: number;
  sectorId: number;
  status: boolean;
  tagIds: string;
  attachments: {
    type: 'image' | 'audio' | 'file';
    data: string;
    name: string;
    mimeType: string;
  }[];
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const google = window.google;
const gapi = window.gapi;

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject('Failed to convert blob to base64');
      }
    };
    reader.onerror = error => reject(error);
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject('Failed to convert file to base64');
      }
    };
    reader.onerror = error => reject(error);
  });
};

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
  Clock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
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
  Mic: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
};

interface Message {
  id?: number;
  title: string;
  date: number | null;
  description: string;
  labels: string[];
  contactId: number | null;
  contact: Contact;
  attachments?: BackendAttachment[];
}

const SCOPES = 'https://www.googleapis.com/auth/calendar';

interface MessageScheduleProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  contactId: number;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface BackendAttachment {
  type: string;
  data: string;
  name: string;
  preview?: string;
  duration?: number;
}

interface Attachment {
  fileType: 'image' | 'audio' | 'file';
  data: string;
  name: string;
  preview?: string;
  duration?: number;
  mimeType: string;
  s3Url?: string;
}

// Componente de calendário customizado - movido para fora do escopo principal
const CustomCalendar: React.FC<{
  selectedDate: dayjs.Dayjs | null;
  onChange: (date: dayjs.Dayjs) => void;
  onClose?: () => void;
}> = ({ selectedDate, onChange }) => {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? selectedDate.month() : dayjs().month()
  );
  const [currentYear, setCurrentYear] = useState(
    selectedDate ? selectedDate.year() : dayjs().year()
  );
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const daysInMonth = dayjs().year(currentYear).month(currentMonth).daysInMonth();
  const firstDayOfMonth = dayjs().year(currentYear).month(currentMonth).startOf('month').day();
  
  const daysGrid = Array.from({ length: 42 }, (_, i) => {
    const adjustedIndex = i - firstDayOfMonth + 1;
    return adjustedIndex > 0 && adjustedIndex <= daysInMonth ? adjustedIndex : null;
  });

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    if (day !== null) {
      const newDate = dayjs().year(currentYear).month(currentMonth).date(day);
      onChange(newDate);
    }
  };

  const isToday = (day: number): boolean => {
    const today = dayjs();
    return (
      day === today.date() &&
      currentMonth === today.month() &&
      currentYear === today.year()
    );
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.date() &&
      currentMonth === selectedDate.month() &&
      currentYear === selectedDate.year()
    );
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="custom-calendar">
      <div className="calendar-header">
        <button className="calendar-nav-button" onClick={prevMonth}>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="calendar-month-year">
          {monthNames[currentMonth]} {currentYear}
        </div>
        <button className="calendar-nav-button" onClick={nextMonth}>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      
      <div className="calendar-weekdays">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, index) => (
          <div key={index} className="calendar-weekday">{day}</div>
        ))}
      </div>
      
      <div className="calendar-days">
        {daysGrid.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${day === null ? 'empty' : ''} ${
              day !== null && isToday(day) ? 'today' : ''
            } ${day !== null && isSelected(day) ? 'selected' : ''} ${
              day !== null && hoveredDay === day && !isSelected(day) ? 'hovered' : ''
            }`}
            onClick={() => day !== null && handleDateClick(day)}
            onMouseEnter={() => day !== null && setHoveredDay(day)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente de seleção de hora - movido para fora do escopo principal
const TimeSelector: React.FC<{
  selectedTime: dayjs.Dayjs | null;
  onChange: (time: dayjs.Dayjs) => void;
  onClose?: () => void;
}> = ({ selectedTime, onChange, onClose }) => {
  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  
  const [hours, setHours] = useState<number>(selectedTime ? selectedTime.hour() : new Date().getHours());
  const [minutes, setMinutes] = useState<number>(
    selectedTime ? 
    selectedTime.minute() - (selectedTime.minute() % 5) : 
    Math.floor(new Date().getMinutes() / 5) * 5
  );
  
  useEffect(() => {
    // Atualiza automaticamente o tempo selecionado quando os valores de hora e minuto mudam
    const newTime = dayjs().hour(hours).minute(minutes);
    onChange(newTime);
  }, [hours, minutes, onChange]);

  const handleHourClick = (hour: number) => {
    setHours(hour);
  };
  
  const handleMinuteClick = (minute: number) => {
    setMinutes(minute);
  };
  
  return (
    <div className="time-selector">
      <div className="time-selector-header">
        <div className="selected-time">
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
        </div>
      </div>
      
      <div className="time-selector-body">
        <div className="time-selector-column">
          <div className="time-selector-label">Horas</div>
          <div className="time-selector-items hours">
            {hoursArray.map((hour) => (
              <div
                key={hour}
                className={`time-item ${hours === hour ? 'selected' : ''}`}
                onClick={() => handleHourClick(hour)}
              >
                {String(hour).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        
        <div className="time-selector-column">
          <div className="time-selector-label">Minutos</div>
          <div className="time-selector-items minutes">
            {minutesArray.map((minute) => (
              <div
                key={minute}
                className={`time-item ${minutes === minute ? 'selected' : ''}`}
                onClick={() => handleMinuteClick(minute)}
              >
                {String(minute).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageSchedule: React.FC<MessageScheduleProps & {
  initialData?: {
    id?: number
    messageText: string;
    selectedDate: dayjs.Dayjs | null;
    selectedTime: dayjs.Dayjs | null;
    selectedContactId: number | null;
    attachments: Attachment[];
  }
}> = ({
  visible,
  onClose,
  onSave,
  contactId,
  addToast,
  initialData
}) => {
  const [messageText, setMessageText] = useState<string>(initialData?.messageText || '');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(initialData?.selectedDate || null);
  const [selectedTime, setSelectedTime] = useState<dayjs.Dayjs | null>(initialData?.selectedTime || null);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(initialData?.selectedContactId || contactId);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  
  // Refs para os inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Estados para dropdowns
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showTimeSelector, setShowTimeSelector] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const timeSelectorRef = useRef<HTMLDivElement>(null);
  
  // Novo estado para modal unificado de data e hora
  const [showDateTimeModal, setShowDateTimeModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  
  // Função para adicionar toasts
  const addLocalToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove toast after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Buscar contatos
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        const token = SessionService.getToken();
        const sectorId = SessionService.getSectorId();
        
        if (!token || !sectorId) {
          return;
        }
        
        const fetchedContacts = await getContacts(sectorId);
        
        if (Array.isArray(fetchedContacts)) {
          setContacts(fetchedContacts);
        } else if (fetchedContacts && 'data' in fetchedContacts) {
          setContacts(fetchedContacts.data);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    if (visible) {
      fetchContacts();
    }
  }, [visible]);

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current && 
        !calendarRef.current.contains(event.target as Node) && 
        showCalendar
      ) {
        setShowCalendar(false);
      }
      
      if (
        timeSelectorRef.current && 
        !timeSelectorRef.current.contains(event.target as Node) && 
        showTimeSelector
      ) {
        setShowTimeSelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, showTimeSelector]);
  
  // Timer para gravação de áudio
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);
  
  // Iniciar gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];
      
      recorder.ondataavailable = e => {
        audioChunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
        setAudioBlob(audioBlob);
        
        // Encerrar stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      addLocalToast('Erro ao acessar microfone', 'error');
    }
  };

  // Parar gravação de áudio
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Iniciar ou parar gravação
  const handleAudioRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Manipular seleção de arquivos
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const file = files[0];
      const base64 = await fileToBase64(file);
      
      if (type === 'image') {
        setAttachments(prev => [
          ...prev,
          {
            fileType: 'image',
            data: base64,
        name: file.name,
        mimeType: file.type
          }
        ]);
      } else {
        setAttachments(prev => [
          ...prev,
          {
            fileType: 'file',
            data: base64,
            name: file.name,
            mimeType: file.type
          }
        ]);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      addLocalToast('Erro ao processar arquivo', 'error');
    }
    
    event.target.value = '';
  };

  // Salvar áudio gravado
  const handleSaveAudio = async () => {
    if (!audioBlob) return;
    
    try {
      const base64 = await blobToBase64(audioBlob);
      
      setAttachments(prev => [
        ...prev,
        {
        fileType: 'audio',
          data: base64,
          name: `audio_${new Date().toISOString()}.mp3`,
          duration: recordingTime,
          mimeType: 'audio/mpeg'
        }
      ]);
      
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Erro ao salvar áudio:', error);
      addLocalToast('Erro ao salvar áudio', 'error');
    }
  };
  
  // Remover anexo
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Renderizar preview de anexos
  const renderAttachmentsPreview = () => {
    if (attachments.length === 0) {
      return (
        <div className="no-attachments">
          Nenhum anexo adicionado
        </div>
      );
    }

    return (
            <div className="attachment-list">
        {attachments.map((attachment, index) => {
          if (attachment.fileType === 'image') {
            return (
                <div key={index} className="attachment-item">
                <img 
                  src={attachment.s3Url || `data:${attachment.mimeType};base64,${attachment.data}`}
                  alt={attachment.name} 
                />
                <button 
                  className="remove-attachment"
                  onClick={() => removeAttachment(index)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  </button>
                </div>
            );
          } else if (attachment.fileType === 'audio') {
            return (
                <div key={index} className="attachment-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
                <span>
                  {attachment.name.substring(0, 20)}
                  {attachment.name.length > 20 ? '...' : ''}
                </span>
                {attachment.s3Url && (
                  <audio 
                    ref={audioRef}
                    src={attachment.s3Url}
                    style={{ display: 'none' }} 
                  />
                )}
                <button 
                  className="remove-attachment"
                  onClick={() => removeAttachment(index)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  </button>
                </div>
            );
          } else {
            return (
                <div key={index} className="attachment-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
                <span>
                  {attachment.name.substring(0, 20)}
                  {attachment.name.length > 20 ? '...' : ''}
                </span>
                <button 
                  className="remove-attachment"
                  onClick={() => removeAttachment(index)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  </button>
                </div>
            );
          }
        })}
      </div>
    );
  };

  // Salvar agendamento
  const handleSave = async () => {
    try {
      if (!selectedDate || !selectedTime) {
        addLocalToast('Selecione data e hora para o agendamento', 'error');
        return;
      }
      if (!messageText.trim() && attachments.length === 0) {
        addLocalToast('Adicione uma mensagem ou anexo', 'error');
        return;
      }
      if (contacts.length === 0) {
        addLocalToast('Não há contatos disponíveis neste setor', 'error');
        return;
      }
      if (!selectedContactId) {
        addLocalToast('Selecione um contato', 'error');
        return;
      }
      setIsSaving(true);
      const combinedDate = selectedDate
        .hour(selectedTime.hour())
        .minute(selectedTime.minute())
        .second(0);
      const token = SessionService.getToken();
      const sectorId = SessionService.getSectorId();
      if (!token || !sectorId) {
        addLocalToast('Erro de autenticação', 'error');
        setIsSaving(false);
        return;
      }
      const dto: CreateMessageSchedulingDTO = {
        name: `Agendamento para ${contacts.find(c => c.id === selectedContactId)?.name || 'Contato'}`,
        messageText,
        sendDate: combinedDate.format('YYYY-MM-DD HH:mm:ss'),
        contactId: selectedContactId,
        sectorId: Number(sectorId),
        status: true,
        tagIds: '',
        attachments: attachments.map(att => ({
          type: att.fileType,
          data: att.data,
          name: att.name,
          mimeType: att.mimeType
        }))
      };
      if (initialData?.id) {
        await updateMessageScheduling(initialData.id, dto);
        addToast('Agendamento atualizado com sucesso', 'success');
      } else {
        await createMessageScheduling(dto);
        addToast('Mensagem agendada com sucesso', 'success');
      }
      setMessageText('');
      setSelectedDate(null);
      setSelectedTime(null);
      setAttachments([]);
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao agendar mensagem:', error);
      addLocalToast('Erro ao agendar mensagem', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Manipular mudança de data
  const handleDateChange = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
  };
  
  // Manipular mudança de hora
  const handleTimeChange = (time: dayjs.Dayjs) => {
    setSelectedTime(time);
  };
  
  // Abrir modal unificado de data e hora
  const openDateTimeModal = (initialTab: 'date' | 'time' = 'date') => {
    setShowDateTimeModal(true);
    setActiveTab(initialTab);
  };

  // Mudar para a aba de hora
  const switchToTimeTab = () => {
    setActiveTab('time');
  };

  // Fechar o modal de data/hora
  const closeDateTimeModal = () => {
    setShowDateTimeModal(false);
  };
  
  // Renderizar o drawer
  const renderDrawer = () => {
    if (!visible) return null;

    return (
      <div className="drawer">
        <div className="drawer-content">
          <div className="drawer-header">
            <h2>Agendar Mensagem</h2>
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="drawer-body">
            <div className="form-group">
              <label>Data e Hora</label>
              <div className="datetime-inputs">
                <div className="date-picker-container">
                  <div 
                    className="date-input-wrapper"
                    onClick={() => openDateTimeModal('date')}
                  >
                    <div className="date-input-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <span className="date-input">
                      {selectedDate ? selectedDate.format('DD/MM/YYYY') : 'Selecionar data'}
                    </span>
                  </div>
                </div>
                
                <div className="time-picker-container">
                  <div 
                    className="time-input-wrapper"
                    onClick={() => openDateTimeModal('time')}
                  >
                    <div className="time-input-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <span className="time-input">
                      {selectedTime ? selectedTime.format('HH:mm') : 'Selecionar hora'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>Contato</label>
              <select 
                className="form-select"
                value={selectedContactId || ''}
                onChange={(e) => setSelectedContactId(e.target.value ? Number(e.target.value) : null)}
                disabled={isLoading || contacts.length === 0}
              >
                <option value="">Selecione um contato</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Mensagem</label>
            <textarea
              className="message-textarea"
              placeholder="Digite sua mensagem..."
              value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
            />
            </div>

            <div className="form-group">
              <label>Anexos</label>
            <div className="attachment-tools">
                <button 
                  type="button"
                  className={`tool-button ${isRecording ? 'recording' : ''}`}
                  onClick={handleAudioRecording}
                >
                  {isRecording ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="22"></line>
                    </svg>
                  )}
                  {isRecording ? `Gravando: ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}` : 'Gravar áudio'}
                </button>
                
                <button 
                  type="button"
                  className="tool-button"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  Imagem
                </button>

              <button
                  type="button"
                  className="tool-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <line x1="10" y1="9" x2="8" y2="9"></line>
                  </svg>
                  Documento
              </button>

                {audioBlob && (
                <button
                    type="button"
                    className="tool-button"
                  onClick={handleSaveAudio}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Salvar áudio
                </button>
              )}
            </div>

              <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'image')}
              />
              
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'document')}
              />
              
              {renderAttachmentsPreview()}
            </div>
            </div>

            <div className="drawer-footer">
              <button
              className="btn btn-secondary"
                onClick={onClose}
              disabled={isSaving}
              >
                Cancelar
              </button>
              <button
              className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
              {isSaving ? 'Salvando...' : 'Agendar'}
            </button>
          </div>
        </div>
        
        {/* Modal unificado para data e hora */}
        {showDateTimeModal && (
          <div className="datetime-overlay" onClick={closeDateTimeModal}>
            <div className="unified-datetime-modal" onClick={(e) => e.stopPropagation()}>
              <div className="unified-datetime-header">
                <h3 className="unified-datetime-title">
                  {activeTab === 'date' ? 'Selecionar Data' : 'Selecionar Horário'}
                </h3>
                <button 
                  className="unified-datetime-close"
                  onClick={closeDateTimeModal}
                >
                  ×
                </button>
              </div>
              
              <div className="unified-datetime-tabs">
                <button 
                  className={`unified-datetime-tab ${activeTab === 'date' ? 'active' : ''}`}
                  onClick={() => setActiveTab('date')}
                >
                  Data
                </button>
                <button 
                  className={`unified-datetime-tab ${activeTab === 'time' ? 'active' : ''}`}
                  onClick={() => setActiveTab('time')}
                >
                  Horário
                </button>
              </div>
              
              <div className="unified-datetime-content">
                {activeTab === 'date' && (
                  <CustomCalendar 
                    selectedDate={selectedDate}
                    onChange={(date) => {
                      handleDateChange(date);
                      // Troca automaticamente para a aba de hora após selecionar a data
                      setActiveTab('time');
                    }}
                  />
                )}
                
                {activeTab === 'time' && (
                  <TimeSelector 
                    selectedTime={selectedTime || dayjs()}
                    onChange={handleTimeChange}
                  />
                )}
              </div>
              
              <div className="unified-datetime-actions">
                <button 
                  className="unified-datetime-cancel"
                  onClick={closeDateTimeModal}
                >
                  Cancelar
                </button>
                <button 
                  className="unified-datetime-confirm"
                  onClick={closeDateTimeModal}
                >
                  Confirmar
              </button>
            </div>
          </div>
          </div>
        )}
        
        <ToastContainer>
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </ToastContainer>
      </div>
    );
  };

  return renderDrawer();
};

const MessageScheduleScreen: React.FC = () => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [flows, setFlows] = useState([]);
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<Message>({
    title: '',
    date: null,
    description: '',
    labels: [],
    contactId: null,
    contact: {} as Contact
  });
  const [dateInputValue, setDateInputValue] = useState('');
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [isSavingAudio, setIsSavingAudio] = useState(false);
  const [drawerInitialData, setDrawerInitialData] = useState<any>(undefined);
  const navigate = useNavigate();

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(current => [...current, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  };

  const renderDrawer = () => {
    if (!isDrawerVisible) return null;
    return (
      <MessageSchedule
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onSave={() => {
          setIsDrawerVisible(false);
          fetchInitialData();
        }}
        contactId={newMessage.contactId || 0}
        addToast={addToast}
        initialData={drawerInitialData}
      />
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioBlob);
        setAudioURL(url);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      addToast('Erro ao iniciar gravação', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleAudioRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64Data = await fileToBase64(file);
      const newAttachment: Attachment = {
        fileType: type === 'document' ? 'file' : type,
        data: base64Data,
        name: file.name,
        preview: type === 'image' ? URL.createObjectURL(file) : undefined,
        mimeType: file.type
      };

      setAttachments(prev => [...prev, newAttachment]);
    } catch (error) {
      console.error('Error processing file:', error);
      addToast('Erro ao processar arquivo', 'error');
    }
  };

  const handleSaveAudio = async () => {
    if (!recordedAudio) return;

    try {
      setIsSavingAudio(true);
      const base64Audio = await blobToBase64(recordedAudio);
      const newAttachment: Attachment = {
        fileType: 'audio',
        data: base64Audio,
        name: 'recorded_audio.wav',
        mimeType: 'audio/wav'
      };

      setAttachments(prev => [...prev, newAttachment]);
      setRecordedAudio(null);
      setAudioURL(null);
    } catch (error) {
      console.error('Error saving audio:', error);
      addToast('Erro ao salvar áudio', 'error');
    } finally {
      setIsSavingAudio(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const renderAttachmentsPreview = () => {
    if (!attachments.length) {
      return <div className="no-attachments">Nenhum anexo adicionado</div>;
    }

    const images = attachments.filter(att => att.fileType === 'image');
    const audios = attachments.filter(att => att.fileType === 'audio');
    const documents = attachments.filter(att => att.fileType === 'file');

    return (
      <div className="attachments-preview">
        {images.length > 0 && (
          <div className="attachment-section">
            <h4>Imagens ({images.length})</h4>
            <div className="attachment-list">
              {images.map((att, index) => (
                <div key={index} className="attachment-item">
                  <span className="attachment-name">{att.name}</span>
                  <button onClick={() => removeAttachment(attachments.indexOf(att))} className="remove-attachment">
                    <Icons.Delete />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {audios.length > 0 && (
          <div className="attachment-section">
            <h4>Áudios ({audios.length})</h4>
            <div className="attachment-list">
              {audios.map((att, index) => (
                <div key={index} className="attachment-item">
                  <span className="attachment-name">{att.name}</span>
                  <button onClick={() => removeAttachment(attachments.indexOf(att))} className="remove-attachment">
                    <Icons.Delete />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {documents.length > 0 && (
          <div className="attachment-section">
            <h4>Documentos ({documents.length})</h4>
            <div className="attachment-list">
              {documents.map((att, index) => (
                <div key={index} className="attachment-item">
                  <span className="attachment-name">{att.name}</span>
                  <button onClick={() => removeAttachment(attachments.indexOf(att))} className="remove-attachment">
                    <Icons.Delete />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const sectorId = SessionService.getSectorId();
      setSelectedSector(sectorId);

      if (!sectorId) {
        console.log('Nenhum setor selecionado, limpando dados');
        setMessages([]);
        setTags([]);
        setContacts([]);
        return;
      }

      console.log('Buscando dados para o setor:', sectorId);

      // Buscar tags e contatos primeiro
      const [tagsResponse, contactsResponse] = await Promise.all([
        getTags(sectorId).catch(error => {
          console.error('Erro ao buscar tags:', error);
          return { data: [] };
        }),
        getContacts(sectorId).catch(error => {
          return { data: [] };
        })
      ]);

      // Definir tags e contatos
      console.log('Tags encontradas:', tagsResponse.data?.length || 0);
      console.log('Contatos encontrados:', contactsResponse.data?.length || 0);
      
      if (Array.isArray(tagsResponse.data)) {
        setTags(tagsResponse.data);
      } else {
        console.error('Resposta de tags não é um array:', tagsResponse);
        setTags([]);
      }
      
      if (Array.isArray(contactsResponse.data)) {
        setContacts(contactsResponse.data);
      } else {
        console.error('Resposta de contatos não é um array:', contactsResponse);
        setContacts([]);
      }

      // Buscar mensagens agendadas
      try {
        console.log('Buscando mensagens agendadas');
        const messagesResponse = await getMessageSchedulings();
        
        // Se tiver mensagens, mapear para o formato do componente
        if (Array.isArray(messagesResponse)) {
          console.log(`Encontradas ${messagesResponse.length} mensagens agendadas`);
          
        const formattedMessages = messagesResponse.map(msg => {
            const messageContact = contactsResponse.data?.find(c => c.id === (msg.contactId || msg.contact_id));
          
          // Log para depuração
          console.log('Agendamento recebido:', msg);
          const dateObj = dayjs(msg.sendDate, 'DD/MM/YYYY HH:mm:ss');
          console.log('Parsing sendDate:', msg.sendDate, '->', dateObj.format(), 'isValid:', dateObj.isValid());

          return {
            id: msg.id,
              title: msg.name || "Sem título",
            date: dateObj.isValid() ? dateObj.valueOf() : null,
              description: msg.messageText || "",
            labels: msg.tagIds ? msg.tagIds.split(',') : [],
              contactId: msg.contactId || msg.contact_id || null,
              contact: messageContact || (contactsResponse.data?.[0] || {}),
            attachments: msg.attachments || []
          };
        });

        setMessages(formattedMessages);
        } else {
          console.error('Resposta de mensagens não é um array:', messagesResponse);
          setMessages([]);
        }
      } catch (error: any) {
        // Se for 404, significa que não há mensagens ainda
        if (error?.response?.status === 404) {
          console.log('Nenhuma mensagem agendada encontrada (404)');
          setMessages([]);
        } else {
          // Se for outro erro, logar e mostrar array vazio
          console.error('Erro ao buscar mensagens:', error);
          addToast('Erro ao carregar mensagens agendadas', 'error');
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      addToast('Erro ao carregar dados', 'error');
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

  const showDrawer = async (index: number | null = null) => {
    if (index !== null) {
      const message = messages[index];
      setCurrentMessageIndex(index);
      setIsLoading(true);
      try {
        const data = await getMessageScheduling(message.id!);
        console.log("Dados recebidos do agendamento:", data);
        
        const dateObj = dayjs(data.sendDate, 'DD/MM/YYYY HH:mm:ss');
        console.log('Abrindo drawer - sendDate:', data.sendDate, '->', dateObj.format(), 'isValid:', dateObj.isValid());
        setNewMessage({
          id: data.id,
          title: data.name,
          date: dateObj.isValid() ? dateObj.valueOf() : null,
          description: data.messageText,
          labels: data.tagIds ? data.tagIds.split(',') : [],
          contactId: data.contactId ?? data.contact_id ?? null,
          contact: contacts.find(c => c.id === (data.contactId ?? data.contact_id)) || {} as Contact,
        });
        
        // Mapear anexos para o formato esperado pelo componente
        const mappedAttachments = (data.attachments || []).map((att: any) => ({
          fileType: att.type as 'image' | 'audio' | 'file',
          data: att.s3Url || '',   // Usar a URL do S3 diretamente
            name: att.fileName,
          preview: att.s3Url,      // Usar a URL do S3 como preview para todos os tipos
          s3Url: att.s3Url,        // Manter a URL original do S3
          mimeType: 
            att.type === 'image' ? (att.fileName.endsWith('.png') ? 'image/png' : 'image/jpeg') : 
            att.type === 'audio' ? 'audio/mpeg' : 
            att.fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
        }));
        
        setAttachments(mappedAttachments);
        setIsDrawerVisible(true); 
        
        // Configurar os dados iniciais para o drawer
        setDrawerInitialData({
          id: data.id,
          messageText: data.messageText,
          selectedDate: dateObj,
          selectedTime: dateObj,
          selectedContactId: data.contactId ?? data.contact_id,
          attachments: mappedAttachments
        });
      } catch (error) {
        console.error("Erro ao buscar dados do agendamento:", error);
        addToast('Erro ao carregar dados do agendamento', 'error');
        
        setNewMessage({
          id: message.id,
          title: message.title,
          date: message.date,
          description: message.description,
          labels: message.labels,
          contactId: message.contactId,
          contact: message.contact,
        });
        setAttachments([]);
        setDrawerInitialData(undefined);
        setIsDrawerVisible(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      setNewMessage({
        title: '',
        date: null,
        description: '',
        labels: [],
        contactId: null,
        contact: {} as Contact
      });
      setAttachments([]);
      setDrawerInitialData(undefined);
      setIsDrawerVisible(true);
    }
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

  const removeTag = () => {
    setNewMessage(prev => ({
      ...prev,
      labels: []
    }));
  };

  const toggleTagSelection = (tagId: string) => {
    setNewMessage(prev => ({
      ...prev,
      labels: [tagId]
    }));
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
      <div className="message-schedule-card">
        <div className="message-schedule-card-header">
          <h3 className="message-schedule-card-title">{message.title}</h3>
          <div className="message-schedule-card-actions">
            <button 
              className="message-schedule-action-button edit"
              onClick={() => showDrawer(index)}
            >
              <Icons.Edit />
            </button>
            <button 
              className="message-schedule-action-button delete"
              onClick={() => setConfirmDeleteIndex(index)}
            >
              <Icons.Delete />
            </button>
          </div>
        </div>
        
        <div className="message-schedule-card-recipient">
          <span className="message-schedule-recipient-name">{message.contact.name}</span>
        </div>

        <div className="message-schedule-card-date">
          <Icons.Calendar />
          {dayjs(message.date).format('DD/MM/YYYY HH:mm')}
        </div>
        
        <p className="message-schedule-card-description">
          {message.description}
        </p>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-schedule-attachments">
            {message.attachments.filter(att => att.type === 'image').length > 0 && (
              <div className="attachment-count">
                <Icons.Picture />
                <span>{message.attachments.filter(att => att.type === 'image').length}</span>
              </div>
            )}
            {message.attachments.filter(att => att.type === 'audio').length > 0 && (
              <div className="attachment-count">
                <Icons.Mic />
                <span>{message.attachments.filter(att => att.type === 'audio').length}</span>
              </div>
            )}
            {message.attachments.filter(att => att.type === 'file').length > 0 && (
              <div className="attachment-count">
                <Icons.Paperclip />
                <span>{message.attachments.filter(att => att.type === 'file').length}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="message-schedule-screen">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="message-schedule-header">
        <div className="message-schedule-header-content">
          <h1>Agendamento de mensagem</h1>
          <p className="message-schedule-header-description">
            Gerencie suas mensagens agendadas
          </p>
        </div>
      </div>

      <div className="message-schedule-content">
        {!selectedSector ? (
          <div className="no-sector-text">
            Nenhum setor selecionado
          </div>
        ) : (
          <div className="message-schedule-grid">
            {messages.map((message, index) => (
              <div key={message.id || index}>
                {renderMessageCard(message, index)}
              </div>
            ))}
            <div 
              className="message-schedule-add-card"
              onClick={() => showDrawer(null)}
            >
              <Icons.Plus />
            </div>
          </div>
        )}
      </div>

      {renderDrawer()}

      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </div>
  );
};

export default MessageScheduleScreen;
