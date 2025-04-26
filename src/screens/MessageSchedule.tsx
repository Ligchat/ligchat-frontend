import React, { useEffect, useState, useRef } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Picker from '@emoji-mart/react';
import {
  createMessageScheduling,
  CreateMessageSchedulingDTO,
  deleteMessageScheduling,
  getMessageSchedulings,
  updateMessageScheduling,
  getMessageScheduling
} from '../services/MessageSchedulingsService';
import { getTags, Tag } from '../services/LabelService';
import { getContacts, Contact } from '../services/ContactService';
import SessionService from '../services/SessionService';
import './MessageSchedule.css';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';

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
}

export const MessageSchedule: React.FC<MessageScheduleProps & {
  initialData?: {
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
  const [messageText, setMessageText] = useState('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<dayjs.Dayjs | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [isSavingAudio, setIsSavingAudio] = useState(false);
  const audioChunks = useRef<Blob[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setMessageText(initialData.messageText);
      setSelectedDate(initialData.selectedDate);
      setSelectedTime(initialData.selectedTime);
      setSelectedContactId(initialData.selectedContactId);
      setAttachments(initialData.attachments);
    }
  }, [visible, initialData]);

  const removeToast = (id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const sectorId = SessionService.getSectorId();
        if (!sectorId) {
          addToast('Nenhum setor selecionado', 'error');
          return;
        }
        const response = await getContacts(sectorId);
        setContacts(response.data || []);
      } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        addToast('Erro ao carregar contatos', 'error');
      }
    };

    if (visible) {
      fetchContacts();
    }
  }, [visible, addToast]);

  useEffect(() => {
    if (contactId) {
      setSelectedContactId(contactId);
    }
  }, [contactId]);

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

  const handleSave = async () => {
    if (!selectedDate || !selectedTime) {
      addToast('Selecione data e hora para o agendamento', 'error');
      return;
    }

    if (!messageText && attachments.length === 0) {
      addToast('Adicione uma mensagem ou anexo', 'error');
      return;
    }

    if (!selectedContactId) {
      addToast('Selecione um contato', 'error');
      return;
    }

    const sectorId = SessionService.getSectorId();
    if (!sectorId) {
      addToast('Nenhum setor selecionado', 'error');
      return;
    }

    const scheduledAt = selectedDate
      .hour(selectedTime.hour())
      .minute(selectedTime.minute())
      .second(0)
      .format('YYYY-MM-DD HH:mm:ss');

    try {
      setIsSaving(true);
      const attachmentsForBackend = attachments.map(attachment => ({
        type: attachment.fileType as 'image' | 'audio' | 'file',
        data: attachment.data,
        name: attachment.name,
        mimeType: attachment.mimeType
      }));

      const messageData: CreateMessageSchedulingDTO = {
        name: messageText.substring(0, 50),
        messageText: messageText,
        sendDate: scheduledAt, 
        contactId: selectedContactId,
        sectorId: sectorId,
        status: true,
        tagIds: '',
        attachments: attachmentsForBackend
      };

      await createMessageScheduling(messageData);

      addToast('Mensagem agendada com sucesso', 'success');
      setMessageText('');
      setSelectedDate(null);
      setSelectedTime(null);
      setAttachments([]);
      onSave();
      onClose();
    } catch (error) {
      addToast('Erro ao agendar mensagem', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderDrawer = () => {
    if (!visible) return null;

    return (
      <div className="drawer">
        <div className="ms-drawer-overlay" onClick={onClose}></div>
        <div className="drawer-content">
          <div className="drawer-header">
            <h2>Agendar Mensagem</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="drawer-body">
            <div className="form-group">
              <label>Contato</label>
              <select 
                className="form-input"
                value={selectedContactId || ''}
                onChange={(e) => setSelectedContactId(Number(e.target.value))}
              >
                <option value="">Selecione um contato</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              className="message-textarea"
              rows={4}
              placeholder="Digite sua mensagem..."
              value={messageText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageText(e.target.value)}
            />

            <div className="attachment-tools">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'image')}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <button 
                  className="tool-button"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Icons.Picture />
                  <span>Imagem</span>
                </button>
              </div>

              <div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => handleFileSelect(e, 'document')}
                  style={{ display: 'none' }}
                  id="document-upload"
                />
                <button 
                  className="tool-button"
                  onClick={() => document.getElementById('document-upload')?.click()}
                >
                  <Icons.Paperclip />
                  <span>Documento</span>
                </button>
              </div>

              <button
                className={`tool-button ${isRecording ? 'recording' : ''}`}
                onClick={handleAudioRecording}
              >
                <Icons.Mic />
                <span>{isRecording ? 'Parar' : 'Áudio'}</span>
              </button>

              {recordedAudio && (
                <button
                  className={`tool-button ${isSavingAudio ? 'loading' : ''}`}
                  onClick={handleSaveAudio}
                  disabled={isSavingAudio}
                >
                  {isSavingAudio ? (
                    <div className="button-spinner" />
                  ) : (
                    'Salvar Áudio'
                  )}
                </button>
              )}
            </div>

            {renderAttachmentsPreview()}

            <div className="form-group">
              <label>Data</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate ? selectedDate.format('YYYY-MM-DD') : ''}
                onChange={(e) => setSelectedDate(dayjs(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Hora</label>
              <input
                type="time"
                className="form-input"
                value={selectedTime ? selectedTime.format('HH:mm') : ''}
                onChange={(e) => setSelectedTime(dayjs(`2000-01-01 ${e.target.value}`))}
              />
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="tool-button secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`tool-button ${isSaving ? 'loading' : ''}`}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="button-spinner" />
                ) : (
                  'Agendar'
                )}
              </button>
            </div>
          </div>
        </div>
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
            contact: defaultContact,
            attachments: msg.attachments || []
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

      const attachmentsForBackend = attachments.map(attachment => ({
        type: attachment.fileType as 'image' | 'audio' | 'file',
        data: attachment.data,
        name: attachment.name,
        mimeType: attachment.mimeType
      }));

      const messageData: CreateMessageSchedulingDTO = {
        name: newMessage.title,
        messageText: newMessage.description,
        sendDate: new Date(newMessage.date!).toISOString(),
        contactId: newMessage.contactId!,
        sectorId: sectorId,
        status: true,
        tagIds: '',
        attachments: attachmentsForBackend
      };

      if (currentMessageIndex !== null && newMessage.id) {
        await updateMessageScheduling(newMessage.id, messageData);
        addToast('Mensagem atualizada com sucesso', 'success');
      } else {
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

  const showDrawer = async (index: number | null = null) => {
    if (index !== null) {
      const message = messages[index];
      setCurrentMessageIndex(index);
      setIsLoading(true);
      try {
        const data = await getMessageScheduling(message.id!);
        const dateObj = dayjs(data.sendDate);
        setNewMessage({
          id: data.id,
          title: data.name,
          date: dateObj.valueOf(),
          description: data.messageText,
          labels: data.tagIds ? data.tagIds.split(',') : [],
          contactId: data.contactId ?? data.contact_id ?? null,
          contact: contacts.find(c => c.id === (data.contactId ?? data.contact_id)) || {} as Contact,
        });
        setAttachments(
          (data.attachments || []).map((att: any) => ({
            fileType: att.type === 'image' ? 'image' : att.type === 'audio' ? 'audio' : 'file',
            data: att.s3Url || '',
            name: att.fileName,
            preview: att.type === 'image' ? att.s3Url : undefined,
            mimeType: att.type === 'image' ? 'image/*' : att.type === 'audio' ? 'audio/wav' : 'application/pdf'
          }))
        );
        setIsDrawerVisible(true); 
        setDrawerInitialData({
          messageText: data.messageText,
          selectedDate: dateObj,
          selectedTime: dateObj,
          selectedContactId: data.contactId ?? data.contact_id,
          attachments: (data.attachments || []).map((att: any) => ({
            fileType: att.type === 'image' ? 'image' : att.type === 'audio' ? 'audio' : 'file',
            data: att.s3Url || '',
            name: att.fileName,
            preview: att.type === 'image' ? att.s3Url : undefined,
            mimeType: att.type === 'image' ? 'image/*' : att.type === 'audio' ? 'audio/wav' : 'application/pdf'
          }))
        });
      } catch (error) {
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

export default MessageScheduleScreen;
