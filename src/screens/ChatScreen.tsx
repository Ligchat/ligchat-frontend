import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Input,
  Button,
  Avatar,
  List,
  Typography,
  message as antdMessage,
  Drawer,
  Upload,
  Modal,
  List as AntList,
  Skeleton,
  Divider,
  Tag, // Importando o componente Tag do Ant Design
  Select,
  Card,
  Radio,
  Menu
} from 'antd';
import './AudioMessage.css'; // Importa o CSS customizado
import {
  UserOutlined,
  SendOutlined,
  PictureOutlined,
  PaperClipOutlined,
  AudioOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { getMessagesByContactId, getWhatsAppContacts, WhatsAppContact, updateWhatsAppContact } from '../services/WhatsappContactService'; // Importar a função de atualização
import { sendMessage, sendFile, SendMessageDto, MessageType } from '../services/MessageService';
import SessionService from '../services/SessionService';
import LoadingOverlay from '../components/LoadingOverlay';
import { getTags } from '../services/LabelService';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { VideoCameraOutlined } from '@ant-design/icons';
import Dropdown from 'antd/es/dropdown/dropdown';
import { getSector } from '../services/SectorService';
import { OAuth2Service } from '../services/OAuth2Service';

const { Header, Sider, Content } = Layout;
const { TextArea, Search } = Input;
const { Title, Text } = Typography;

export interface Tag {
  id: number;
  name: string;
  description: string;
  sectorId: number;
}

const ChatPage: React.FC = () => {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socket = useRef<WebSocket | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const sessionId = SessionService.getSessionForSector();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecordingModalVisible, setIsRecordingModalVisible] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<any>(null);
  const [status, setStatus] = useState(1);
  const [filteredContacts, setFilteredContacts] = useState<WhatsAppContact[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');


  const [filesWithUid, setFilesWithUid] = useState<{ file: File; uid: string; }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Estado de carregamento

  // State for editing contact information
  const [editableField, setEditableField] = useState<string | null>(null);
  const [currentValues, setCurrentValues] = useState<any>({
    address: '',
    phoneNumber: '',
    email: '',
    annotations: '',
    tagIds: [], // Para gerenciar as tags
  });



  
  useEffect(() => {
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const contactsData = await getWhatsAppContacts(sessionId);
      setContacts(contactsData);
      setFilteredContacts(contactsData);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
    } finally {
      setIsLoading(false);
    }
  };
  fetchContacts();
  },[]);


  useEffect(() => {
    socket.current = new WebSocket(`wss://7723-177-84-243-109.ngrok-free.app?sectorId=${sessionId}`);

    socket.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log('Message from server: ', newMessage);

      if (newMessage?.IsSent != null && newMessage?.IsSent === false) {
        const formattedMessage: MessageType = {
          id: newMessage.Id,
          content: newMessage.Content,
          isSent: newMessage.IsSent,
          mediaType: newMessage.MediaType,
          mediaUrl: newMessage.MediaUrl,
          contactId: newMessage.ContactID,
          sectorId: sessionId,
        };

        setMessages((prevMessages) => [...prevMessages, formattedMessage]);
      }
    };

    socket.current.onerror = (error) => {
      const timestamp = new Date().toISOString();
      const state = socket.current?.readyState;
      console.error(`[${timestamp}] WebSocket error: `, error, `Current state: ${state}`);
    };

    socket.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }, [selectedContact]);

  const handleStatusChange = async (value: number) => {
    setStatus(value); // Atualiza o estado local
  
    if (selectedContact) {
      const updatedContact = {
        ...selectedContact,
        status: value, // Atualiza o status no objeto do contato
      };
  
      try {
        await updateWhatsAppContact(updatedContact);
  
        // Atualiza a lista de contatos para refletir a alteração
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.id === updatedContact.id ? updatedContact : contact
          )
        );
  
        // Atualiza o contato selecionado para refletir a alteração
        setSelectedContact(updatedContact);
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    }
  };


  useEffect(() => {
  const fetchTags = async () => {
    try {
        setIsLoading(true);
        const response: any = await getTags();
        setTags(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
        console.error('Erro ao buscar etiquetas:', error);
        setTags([]);
    } finally {
        setIsLoading(false);
    }
  };
  fetchTags()
  },[]);

useEffect(() => {
  handleFilterContacts();
}, [searchTerm, selectedFilter, contacts]);

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchTerm(e.target.value);
};

const handleFilterChange = (filter: string) => {
  setSelectedFilter(filter);
};

const handleFilterContacts = () => {
  let updatedContacts = [...contacts];

  // Filtra por termo de pesquisa
  if (searchTerm) {
    updatedContacts = updatedContacts.filter((contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phoneNumber.includes(searchTerm)
    );
  }

  // Filtra por tipo (lidas, não lidas, todas)
  if (selectedFilter === 'unread') {
    updatedContacts = updatedContacts.filter((contact) => !contact.isRead);
  } else if (selectedFilter === 'read') {
    updatedContacts = updatedContacts.filter((contact) => contact.isRead);
  }

  setFilteredContacts(updatedContacts);
};

const handleSelectConversation = async (contact: WhatsAppContact) => {
  setSelectedContact(contact);
  setShowChat(true);
  setIsLoading(true); // Inicia o carregamento das mensagens

  try {
    const messagesData: any = await getMessagesByContactId(contact.id);
    setMessages(messagesData);
    setStatus(contact.status); // Atualiza o estado do status com o valor do contato
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
  } finally {
    setIsLoading(false); // Finaliza o carregamento
  }
};

  const handleSendMessage = async () => {
    if (messageInput.trim() !== '' && selectedContact) {
      const newMessage: SendMessageDto = {
        content: messageInput,
        mediaType: undefined,
        mediaUrl: undefined,
        sectorId: SessionService.getSessionForSector(),
        recipient: selectedContact.phoneNumber,
        contactId: selectedContact.id,
      };

      setIsSending(true);

      try {
        await sendMessage(newMessage);
        const messageToAdd: MessageType = {
          id: Date.now(),
          content: messageInput,
          isSent: true,
          sectorId: newMessage.sectorId,
          contactId: newMessage.contactId,
        };

        // Enviar a mensagem pelo WebSocket
        socket.current?.send(JSON.stringify(messageToAdd));

        setMessages((prevMessages) => [...prevMessages, messageToAdd]);
        setMessageInput('');
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleImageClick = (url: any) => {
    setPreviewImageUrl(url);
    setIsImagePreviewVisible(true);
  };

  const handleCloseImagePreview = () => {
    setIsImagePreviewVisible(false);
    setPreviewImageUrl(null);
  };

  const handleImageUploadChange = (info: any) => {
    const newFiles: { file: File; uid: string; }[] = info.fileList.map((file: any) => ({
      file: file.originFileObj ? file.originFileObj : file,
      uid: file.uid || Date.now().toString(),
    }));

    setFilesWithUid((prevFiles) => {
      const fileNames = new Set(prevFiles.map((fileObj) => fileObj.file.name));
      const uniqueFiles = newFiles.filter((fileObj) => !fileNames.has(fileObj.file.name));
      return [...prevFiles, ...uniqueFiles];
    });
  };

  const handleAttachmentUploadChange = (info: any) => {
    const newFiles: { file: File; uid: string; }[] = info.fileList.map((file: any) => ({
      file: file.originFileObj,
      uid: file.uid || Date.now().toString(),
    }));

    setFilesWithUid(newFiles);
    setFilesToUpload(newFiles.map((fileObj) => fileObj.file));
  };

  const handleUploadConfirm = async (isImage: boolean) => {
    for (const fileObj of filesWithUid) {
      const file = fileObj.file;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64File = reader.result as string;
        const mimeType = file.type;
  
        const fileData: any = {
          base64File: base64File.split(',')[1],
          mediaType: mimeType,
          fileName: file.name,
          caption: '',
          recipient: selectedContact?.phoneNumber,
          contactId: selectedContact?.id,
          sectorId: SessionService.getSessionForSector(),
        };
  
        setIsSending(true);
  
        try {
         const response:any =  await sendFile(fileData);
  
          const messageToAdd: MessageType = {
            id: Date.now(),
            content: isImage ? '' : file.name, 
            isSent: response.media.isSent,
            mediaType: response.media.mediaType,
            mediaUrl: response.media.mediaUrl, 
            sectorId: response.media.sectorId,
            contactId: response.media.contactId,
          };
  
          socket.current?.send(JSON.stringify(messageToAdd));
  
          setMessages((prevMessages) => [...prevMessages, messageToAdd]); 
          antdMessage.success('Arquivo enviado com sucesso!');
        } catch (error) {
          console.error('Erro ao enviar arquivo:', error);
        } finally {
          setIsSending(false);
        }
      };
      reader.readAsDataURL(file);
    }
  
    // Fechar os modais e limpar seleção de arquivos
    if (isImage) {
      setIsImageModalVisible(false);
    } else {
      setIsAttachmentModalVisible(false);
    }
    setFilesWithUid([]);
  };
  const handleShowImageModal = () => {
    setFilesToUpload([]); // Limpa a seleção anterior
    setFilesWithUid([]); // Limpa os arquivos com UID
    setUploadKey((prevKey) => prevKey + 1); // Atualiza a chave do upload para forçar a recriação do componente
    setIsImageModalVisible(true);
  };

  const handleShowAttachmentModal = () => {
    setFilesToUpload([]);
    setFilesWithUid([]); // Limpa os arquivos com UID
    setUploadKey((prevKey) => prevKey + 1); // Atualiza a chave do upload para forçar a recriação do componente
    setIsAttachmentModalVisible(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalVisible(false);
    setFilesToUpload([]);
    setFilesWithUid([]); // Limpa os arquivos com UID
    setUploadKey((prevKey) => prevKey + 1); // Atualiza a chave do upload para forçar a recriação do componente
  };

  const handleCloseAttachmentModal = () => {
    setIsAttachmentModalVisible(false);
    setFilesToUpload([]);
    setFilesWithUid([]); // Limpa os arquivos com UID
    setUploadKey((prevKey) => prevKey + 1); // Atualiza a chave do upload para forçar a recriação do componente
  };

  const renderSelectedFiles = () => {
    if (filesToUpload.length === 0) {
      return null; // Retorna null se não houver arquivos
    }
    return filesToUpload.map((file, index) => (
      <AntList.Item key={index}>
        <AntList.Item.Meta
          title={file.name}
          description={file.type}
        />
        <Button 
          icon={<EyeOutlined />} 
          onClick={() => handlePreviewImage(file)} // Chama a função para visualizar a imagem
        >
          Visualizar
        </Button>
      </AntList.Item>
    ));
  };

  const handlePreviewImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      Modal.info({
        title: 'Visualizar Imagem',
        content: (
          <img 
            src={reader.result as string} 
            alt={file.name} 
            style={{ width: '100%', height: 'auto' }} 
          />
        ),
        onOk() {},
      });
    };
    reader.readAsDataURL(file);
  };

  const handleShowDrawer = () => {
    setIsDrawerVisible(true);
    if (selectedContact) {
      setCurrentValues({
        phoneNumber: selectedContact.phoneNumber,
        address: selectedContact.address || '',
        email: selectedContact.email || '',
        annotations: selectedContact.annotations || '',
        tagIds: selectedContact.tagIds || '',
      });
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleFieldEdit = (field: string) => {
    setEditableField(field);
  };

  const handleInputChange = (field: string, value: string) => {
    setCurrentValues({ ...currentValues, [field]: value });
  };

  const handleTagIdsChange = (value: number[]) => {
    const tagIdsString = value.join(','); // Converte a lista de IDs em uma string separada por vírgulas
    setCurrentValues({ ...currentValues, tagIds: tagIdsString }); // Atualiza a string de tagIds
    handleSave()
  };

  const handleSave = async () => {
    if (selectedContact) {
      const updatedContact = {
        ...selectedContact,
        id: selectedContact.id,
        phoneNumber: currentValues.phoneNumber,
        address: currentValues.address,
        email: currentValues.email,
        annotations: currentValues.annotations,
        tagIds: currentValues.tagIds, // Atualiza a lista de tagIds
      };

      try {
        // Chama a função para atualizar o contato
        await updateWhatsAppContact(updatedContact);
        antdMessage.success('Contato atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar contato:', error);
      }

      setEditableField(null); // Fechar o campo de entrada após salvar
    }
  };

  // Funções de Gravação de Áudio
  const handleStartRecording = async () => {
    try {
      let mimeType = 'audio/ogg; codecs=opus';

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm; codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          return;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        setRecordedAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Erro ao acessar o microfone', err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendRecording = async () => {
    if (recordedAudio && selectedContact) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64File = reader.result as string; // Mantém o formato completo em base64
        const mimeType = recordedAudio.type.split(';')[0];
        const extension = mimeType.split('/')[1];
        const fileName = `audio_recording.${extension}`;
  
        const fileData = {
          base64File: base64File.split(',')[1], // Envia apenas o conteúdo do base64
          mediaType: mimeType,
          fileName,
          caption: '',
          recipient: selectedContact.phoneNumber,
          contactId: selectedContact.id,
          sectorId: SessionService.getSessionForSector(),
        };
  
        setIsSending(true);
  
        try {
          // Chama a função para enviar o arquivo e armazena a resposta
          const response:any = await sendFile(fileData);
  
          // Cria a mensagem com o `mediaUrl` retornado pela API
          const messageToAdd: MessageType = {
            id: Date.now(),
            content: response.media.content || null, // Conteúdo pode ser nulo para mensagens de áudio
            isSent: response.media.isSent,
            mediaType: response.media.mediaType,
            mediaUrl: response.media.mediaUrl, // Utiliza o URL do S3 retornado pelo backend
            sectorId: response.media.sectorId,
            contactId: response.media.contactId,
          };
  
          setMessages((prevMessages) => [...prevMessages, messageToAdd]);
          antdMessage.success('Áudio enviado com sucesso!');
        } catch (error) {
          console.error('Erro ao enviar áudio:', error);
        } finally {
          setIsSending(false);
          setRecordedAudio(null);
          setAudioUrl(null);
          setIsRecordingModalVisible(false);
        }
      };
      reader.readAsDataURL(recordedAudio);
    }
  };
  
  const getSelectStyle = () => {
    switch (status) {
      case 1:
        return { color: 'green' }; // Em Atendimento
      case 2:
        return { color: 'red' }; // Inativo
      case 3:
        return { color: 'blue' }; // Concluído
      default:
        return {};
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordedAudio(null);
    setAudioUrl(null);
    setIsRecordingModalVisible(false);
  };

  // Scroll to the bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filterMenu = (
    <Menu>
      {tags.map(tag => (
        <Menu.Item key={tag.id}>
          <span onClick={() => handleFilterChange(tag.name)}>{tag.name}</span>
        </Menu.Item>
      ))}
    </Menu>
  );


  return (
    <Layout style={{ height: '80vh', backgroundColor: '#f4f4f4' }}>
      {isLoading && <LoadingOverlay />} {/* Exibe o loading overlay */}

      <Sider width={350} style={{ padding: 20, backgroundColor: '#fff', borderRight: '5px solid #f0f0f0', borderBottom: '2px solid #f0f0f0', borderTop: '2px solid #f0f0f0', borderLeft: '2px solid #f0f0f0', borderRadius: '20px 0 0 20px' }}>
      <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
  <Search
    placeholder="Pesquisar conversas"
    value={searchTerm}
    onChange={handleSearchChange}
    style={{ width: '80%' }}
    allowClear
  />
</div>

<div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
  <div style={{ display: 'flex', gap: '8px' }}>
    <Button
      type={selectedFilter === 'unread' ? 'primary' : 'default'}
      onClick={() => handleFilterChange('unread')}
    >
      Não lidas
    </Button>
    <Button
      type={selectedFilter === 'read' ? 'primary' : 'default'}
      onClick={() => handleFilterChange('read')}
    >
      Lidas
    </Button>
  </div>

  <Dropdown overlay={filterMenu} trigger={['click']}>
    <Button>
      Etiqueta <DownOutlined />
    </Button>
  </Dropdown>
</div>



        {/* Lista de contatos filtrados */}
        <List
          itemLayout="horizontal"
          locale={{ emptyText: 'Nenhum contato encontrado' }}
          dataSource={filteredContacts}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleSelectConversation(item)}
              className="contact-list-item"
              style={{ cursor: 'pointer', marginBottom: '8px', borderRadius: '4px', padding: 15 }}
            >
              <List.Item.Meta
                avatar={<Avatar src={item.profilePictureUrl} icon={<UserOutlined />} />}
                title={item.name}
                description={item.isRead ? 'Lida' : 'Não lida'}
              />
            </List.Item>
          )}
        />
      </Sider>

      {showChat && selectedContact && (
        <Layout style={{
          borderBottom: '2px solid #f0f0f0',
          borderRight: '2px solid #f0f0f0'
        }}>
      <Header style={{
        backgroundColor: '#fff',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between', // Espaçamento entre os itens
        borderTop: '2px solid #f0f0f0',
        borderRight: '2px solid #f0f0f0',
        borderBottom: '2px solid #f0f0f0',
        borderLeft: '2px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} />
          <Title level={5} style={{ margin: '0 10px' }}>
  {selectedContact ? selectedContact.name : 'Nome do Contato'}
</Title>
        </div>

        <Select
        notFoundContent="Nenhum atendimento encontrado"
  value={status}
  onChange={handleStatusChange}
  className={
    status === 1 ? 'select-status-1' :
    status === 2 ? 'select-status-2' :
    status === 3 ? 'select-status-3' : ''
  }
  style={{ width: 200, textAlign: 'center' }}
>
  <Select.Option value={1}>Em Atendimento</Select.Option>
  <Select.Option value={2}>Inativo</Select.Option>
  <Select.Option value={3}>Concluído</Select.Option>
</Select>


        <Button style={{ marginLeft: '10px' }} onClick={handleShowDrawer} type="primary">Mais informações</Button>
      </Header>

      <Content style={{ padding: '24px', backgroundColor: '#fff', overflowY: 'auto', flex: 1, border: '1px solid #d9d9d9', borderRadius: '4px' }}>
  <div style={{ flex: 1, overflowY: 'auto' }}>
    {isLoading ? (
      <Skeleton active paragraph={{ rows: 3 }} />
    ) : (
      messages.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          Conversa não iniciada
        </div>
      ) : (
        messages.map((message:any) => (
          <div key={message.id} style={{ marginBottom: '16px', alignItems:'center', textAlign: message.isSent ? 'right' : 'left', display: 'flex', justifyContent: message.isSent ? 'flex-end' : 'flex-start' }}>
            {!message.isSent && (
              <Avatar src={selectedContact?.profilePictureUrl} icon={<UserOutlined />} style={{ marginRight: '8px' }} />
            )}
            <div style={{
              backgroundColor: message.isSent ? '#1890ff' : '#fff',
              border: message.mediaType.includes("audio") ? 'none' : '1px solid #d9d9d9',
              borderRadius: '8px',
              display: 'flex',
              justifyContent:'center',
              alignItems:'center',
              maxWidth: '45%',
              padding: '8px',
              boxShadow: message.isSent ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
            }}>
              {message.mediaType && message.mediaType.includes("image") && message.mediaUrl ? (
                <img
                  src={message.mediaUrl}
                  alt="Image"
                  style={{ maxWidth: '200px', maxHeight: '200px', cursor: 'pointer', borderRadius: '8px' }}
                  onClick={() => handleImageClick(message.mediaUrl)}
                />
              ) : null}

              {message.mediaType && message.mediaType.includes("audio") && message.mediaUrl ? (
                <AudioMessage audioUrl={message.mediaUrl} />
              ) : null}

              {/* Renderização de documentos */}
              {(message.mediaType && (message.mediaType.includes("document") || message.mediaType.includes("application"))) && message.mediaUrl ? (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <a
      href={message.mediaUrl}
      download
      style={{ cursor: 'pointer', marginLeft: '8px', textDecoration: 'underline', color:'white' }}
    >
    <span>{message.mediaUrl.split('/').pop()}</span>
    </a>
  </div>
) : null}


              {/* Para mensagens de texto normais */}
              {message.content && (
  <span style={{ color: message.isSent ? 'white' : 'black' }}>
    {message.content}
  </span>
)}
            </div>
          </div>
        ))
      )
    )}
    <Modal
      visible={isImagePreviewVisible}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={() => window.open(previewImageUrl, '_blank')}>
          Download
        </Button>
      ]}
      onCancel={handleCloseImagePreview}
    >
      <img src={previewImageUrl} alt="Image Preview" style={{ width: '100%' }} />
    </Modal>

    <div ref={chatEndRef} />
  </div>
</Content>


          <div style={{ padding: '16px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <TextArea
                rows={3}
                placeholder="Escreva uma mensagem"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{
                  borderRadius: '8px',
                  resize: 'none',
                  width: '100%',
                  paddingBottom: '50px'
                }}
              />

              {/* Icons inside the input */}
              <div style={{
                position: 'absolute',
                right: '10px',
                bottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Button
                  type="link"
                  icon={<PictureOutlined />}
                  onClick={handleShowImageModal}
                  style={{
                    padding: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Button
                  type="link"
                  icon={<PaperClipOutlined />}
                  onClick={handleShowAttachmentModal}
                  style={{
                    padding: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Button
                  type="link"
                  icon={<AudioOutlined />}
                  onClick={() => {
                    setIsRecordingModalVisible(true);
                    handleStartRecording();
                  }}
                  style={{
                    padding: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Button
                  type="link"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  style={{
                    padding: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Modal para selecionar imagens */}
          <Modal
            title="Selecionar Imagens"
            visible={isImageModalVisible}
            onCancel={handleCloseImageModal}
            okText="Enviar"
            cancelText="Cancelar"
            footer={[
              <Button key="back" onClick={handleCloseImageModal}>
                Cancelar
              </Button>,
              <Button key="submit" type="primary" onClick={() => handleUploadConfirm(true)} disabled={filesWithUid.length === 0}>
                Enviar
              </Button>
            ]}
          >
            <div style={{ marginBottom: '16px' }}>
              <Upload
                key={uploadKey} // Usa a chave para recriar o componente
                multiple
                showUploadList={false}
                accept="image/png,image/jpeg,image/bmp"
                onChange={handleImageUploadChange}
                beforeUpload={() => false} // Evita o upload automático
                fileList={filesWithUid.map((fileObj) => ({
                  uid: fileObj.uid,
                  name: fileObj.file.name,
                  status: 'done',
                  url: URL.createObjectURL(fileObj.file),
                }))}
              >
                <Button icon={<PictureOutlined />}>Selecionar Imagens</Button>
              </Upload>
            </div>
            <AntList
              style={{ marginTop: '16px' }}
              bordered
              locale={{ emptyText: 'Nenhum arquivo encontrado' }}
              dataSource={filesWithUid}
              renderItem={(fileObj) => (
                <AntList.Item key={fileObj.uid}>
                  <AntList.Item.Meta title={fileObj.file.name} description={fileObj.file.type} />
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => handlePreviewImage(fileObj.file)}
                  >
                    Visualizar
                  </Button>
                </AntList.Item>
              )}
            />
          </Modal>

          {/* Modal para Upload de Anexos */}
          <Modal
            title="Selecionar Anexos"
            visible={isAttachmentModalVisible}
            onOk={() => handleUploadConfirm(false)}
            onCancel={handleCloseAttachmentModal}
            okText="Enviar"
            cancelText="Cancelar"
            footer={[
              <Button key="back" onClick={handleCloseAttachmentModal}>
                Cancelar
              </Button>,
              <Button key="submit" type="primary" onClick={() => handleUploadConfirm(false)} disabled={filesToUpload.length === 0}>
                Enviar
              </Button>
            ]}
          >
            <Upload
              multiple
              beforeUpload={(file) => {
                setFilesToUpload((prevFiles) => [...prevFiles, file]);
                return false; // Não faz upload automaticamente
              }}
              showUploadList={false}
              accept="*/*"
              onChange={handleAttachmentUploadChange}
            >
              <Button icon={<PaperClipOutlined />}>Selecionar Anexos</Button>
            </Upload>
            <AntList
            locale={{ emptyText: 'Nenhum arquivo encontrado' }}
              style={{ marginTop: '16px' }}
              bordered
              dataSource={filesToUpload.map((file, index) => ({
                key: index,
                name: file.name,
                type: file.type,
              }))} // Mostra a lista de arquivos selecionados
              renderItem={renderSelectedFiles} // Chama a função para renderizar os arquivos selecionados
            />
          </Modal>

          {/* Modal para Gravação de Áudio */}
          <Modal
            title="Gravando Áudio"
            visible={isRecordingModalVisible}
            onCancel={handleCancelRecording}
            footer={null}
          >
            <div style={{ textAlign: 'center' }}>
              {isRecording ? (
                <>
                  <p>Gravando...</p>
                  <Button onClick={handleStopRecording}>Parar</Button>
                </>
              ) : recordedAudio ? (
                <>
                  <audio controls src={audioUrl || undefined} />
                  <div style={{ marginTop: '16px' }}>
                    <Button type="primary" onClick={handleSendRecording}>Enviar</Button>
                    <Button style={{ marginLeft: '8px' }} onClick={handleCancelRecording}>Cancelar</Button>
                  </div>
                </>
              ) : (
                <p>Clique no botão abaixo para começar a gravar.</p>
              )}
            </div>
          </Modal>

          <Drawer
  title="Editar Contato"
  placement="right"
  closable
  onClose={handleCloseDrawer}
  visible={isDrawerVisible}
  width={400}
>
  <Title level={4}>{selectedContact?.name}</Title>
  <Divider />

  <Text>
    <strong style={{ marginRight: 8 }}>Tags:</strong>
    <Select
  mode="multiple"
notFoundContent="Nenhuma etiqueta encontrada"
  style={{ width: '100%', marginBottom: '12px' }}
  placeholder="Selecione as tags"
  value={(typeof currentValues.tagIds === 'string' ? currentValues.tagIds.split(',') : []).map((id:any) => parseInt(id)).filter((id:any) => !isNaN(id))}
  onChange={handleTagIdsChange}
>
  {tags.map(tag => (
    <Select.Option key={tag.id} value={tag.id}>
      {tag.name}
    </Select.Option>
  ))}
</Select>

  </Text>

  <Card
    bodyStyle={{ padding: "0" }}
    style={{ marginTop: 20, marginBottom: '12px', position: 'relative', borderRadius: '8px', border: '1px solid #e0e0e0', padding: 0 }} 
    bordered={false}
  >
    <div style={{ padding: '16px', position: 'relative', margin: 0 }}>
      <strong style={{ color: '#1E88E5', fontSize: '16px', display: 'block', marginBottom: 20}}>Informações:</strong>
      <Text>
        <strong style={{ marginRight: 8,color:'#9CA3AF' }}>Mora em:</strong>
        {editableField === 'address' ? (
          <Input
            value={currentValues.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            onBlur={handleSave}
            style={{ width: '60%', marginLeft: 8 }}
          />
        ) : (
          <>
            {currentValues.address}
            <EditOutlined onClick={() => handleFieldEdit('address')} style={{ marginLeft: 8, cursor: 'pointer' }} />
          </>
        )}
      </Text>
      <br />

      <Text>
        <strong style={{ marginRight: 8,color:'#9CA3AF' }}>Telefone:</strong>
        {editableField === 'phoneNumber' ? (
          <Input
            value={currentValues.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            onBlur={handleSave}
            style={{ width: '60%', marginLeft: 8 }}
          />
        ) : (
          <>
            {currentValues.phoneNumber}
            <EditOutlined onClick={() => handleFieldEdit('phoneNumber')} style={{ marginLeft: 8, cursor: 'pointer' }} />
          </>
        )}
      </Text>
      <br />

      <Text>
        <strong style={{ marginRight: 8,color:'#9CA3AF' }}>E-mail:</strong>
        {editableField === 'email' ? (
          <Input
            value={currentValues.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={handleSave}
            style={{ width: '60%', marginLeft: 8 }}
          />
        ) : (
          <>
            {currentValues.email}
            <EditOutlined onClick={() => handleFieldEdit('email')} style={{ marginLeft: 8, cursor: 'pointer' }} />
          </>
        )}
      </Text>
      <br />
    </div>
  </Card>

  <Card
    bodyStyle={{ padding: "0" }}
    style={{ marginTop: 20, marginBottom: '12px', position: 'relative', borderRadius: '8px', border: '1px solid #e0e0e0', padding: 0 }}
    bordered={false}
  >
    <div style={{ padding: '16px', position: 'relative', margin: 0 }}>
      <strong style={{ color: '#1E88E5', fontSize: '16px', display: 'block' }}>Anotações:</strong>
      <EditOutlined
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          cursor: 'pointer',
          borderRadius: '50%',
          backgroundColor: '#f0f0f0',
          padding: '4px',
          color: '#1E88E5',
        }}
        onClick={() => handleFieldEdit('annotations')}
      />
      {editableField === 'annotations' ? (
        <Input.TextArea
          value={currentValues.annotations}
          onChange={(e) => handleInputChange('annotations', e.target.value)}
          onBlur={handleSave}
          style={{ width: '100%', marginTop: 8, padding: 0 }}
          rows={4}
        />
      ) : (
        <div style={{ marginTop: 8, color: '#757575' }}>
          {currentValues.annotations || "Faça as suas anotações aqui."}
        </div>
      )}
    </div>
  </Card>

  <br />
  <Divider />
</Drawer>


        </Layout>
      )}
    </Layout>
  );
};

const AudioMessage: React.FC<{ audioUrl: string }> = ({ audioUrl }) => {
  return (
    <div className="audio-message-container">
      <AudioPlayer
        src={audioUrl}
        showJumpControls={false}
        customAdditionalControls={[]}
        layout="horizontal"
        customVolumeControls={[]}
        autoPlayAfterSrcChange={false}
        className="audio-player-custom"
      />
    </div>
  );
};




export default ChatPage;
