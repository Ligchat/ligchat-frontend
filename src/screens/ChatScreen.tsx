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
  Skeleton,
  Divider,
  Select,
  Card,
  Menu,
  Dropdown,
} from 'antd';
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
import {
  getMessagesByContactId,
  getWhatsAppContacts,
  updateWhatsAppContact,
  WhatsAppContact,
} from '../services/WhatsappContactService';
import {
  sendMessage,
  sendFile,
  SendMessageDto,
  MessageType,
} from '../services/MessageService';
import SessionService from '../services/SessionService';
import LoadingOverlay from '../components/LoadingOverlay';
import { getTags } from '../services/LabelService';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './AudioMessage.css';
import './ChatPage.css'; // Adicione este arquivo CSS
import { useMediaQuery } from 'react-responsive';
import { validateMetaCredentials } from '../services/MetaValidationService';
import { getSector } from '../services/SectorService';
import { getAllUsers } from '../services/UserService';
import { updateResponsible, UpdateResponsibleRequestDTO } from '../services/ContactService';

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isContactsVisible, setIsContactsVisible] = useState(true);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<any>(null);
  const [status, setStatus] = useState(1);
  const [filteredContacts, setFilteredContacts] = useState<WhatsAppContact[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSendCancelOptions, setShowSendCancelOptions] = useState(false);
  const [filesWithUid, setFilesWithUid] = useState<{ file: File; uid: string; }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editableField, setEditableField] = useState<string | null>(null);
  const [isMetaValid, setIsMetaValid] = useState<boolean>(true);
  const [filterResponsibleUser, setFilterResponsibleUser] = useState<string | null>(null);
  const [currentValues, setCurrentValues] = useState<any>({
    address: '',
    phoneNumber: '',
    email: '',
    annotations: '',
    tagIds: [],
  });
  const [responsibleUser, setResponsibleUser] = useState<string | null>(null);
  const token = SessionService.getSession('authToken');
  const decodedToken = token ? SessionService.decodeToken(token) : null;
  const userId = Number(decodedToken?.userId);
  const [invitedBy, setInvitedBy] = useState<number>(userId);
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response: any = await getAllUsers(invitedBy);
      const updatedUsers = response.data.map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
      }));
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários', error);
      antdMessage.error('Erro ao carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterByUser = (userId: string | null) => {
    if (!userId) {
      setFilteredContacts(contacts); // Mostra todos os contatos
    } else {
      const updatedContacts = contacts.filter((contact: any) => contact.responsibleId?.toString() === userId);
      setFilteredContacts(updatedContacts);
    }
  };


  const handleResponsibleChange = async (value: string) => {
    setResponsibleUser(value);

    if (selectedContact) {
      try {

        const updateRequest: UpdateResponsibleRequestDTO = {
          responsibleId: parseInt(value, 10),
        };
        await updateResponsible(selectedContact.id, updateRequest);

        const updatedContact = {
          ...selectedContact,
          responsible: value,
        };

        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.id === updatedContact.id ? updatedContact : contact
          )
        );

        setSelectedContact(updatedContact);
        antdMessage.success('Responsável atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar responsável:', error);
        antdMessage.error('Erro ao atualizar responsável.');
      }
    }
  };


  const isMobile = useMediaQuery({ maxWidth: 768 });


  const validateMetaOnContactSelection = async (accessToken: string, phoneNumberId: string) => {
    const validationResult = await validateMetaCredentials(accessToken, phoneNumberId);

    if (validationResult.message !== 'Token e phone_id são válidos.') {
      setIsMetaValid(false);
      return;
    } else {
      setIsMetaValid(true);
      return;
    }
  };


  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        const contactsData = await getWhatsAppContacts(sessionId);
        fetchUsers();
        setContacts(contactsData);
        setFilteredContacts(contactsData);
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const toggleContactsVisibility = () => {
    setIsContactsVisible(!isContactsVisible);
  };

  useEffect(() => {
    socket.current = new WebSocket(`wss://whatsapp.ligchat.com/?sectorId=${sessionId}`);

    socket.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.current.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      console.log('Message from server: ', receivedData);

      if (receivedData.Action === 'UpdateContactStatus') {
        // Atualize o status do contato
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.id === receivedData.ContactId
              ? { ...contact, isViewed: receivedData.IsViewed }
              : contact
          )
        );

        // Atualiza o contato selecionado, se for o mesmo
        if (selectedContact && selectedContact.id === receivedData.ContactId) {
          setSelectedContact((prevContact) => ({
            ...prevContact!,
            isViewed: receivedData.IsViewed,
          }));
        }
      } else if (receivedData.Action === 'NewMessage') {
        // Adicione a nova mensagem à lista de mensagens
        const newMessage: MessageType = {
          id: receivedData.Id,
          content: receivedData.Content,
          isSent: receivedData.IsSent,
          mediaType: receivedData.MediaType,
          mediaUrl: receivedData.MediaUrl,
          contactID: receivedData.ContactID,
          sectorId: sessionId,
          isRead: receivedData.IsRead || false,
        };

        // Adicione a mensagem à lista de mensagens, se ela não existir
        setMessages((prevMessages) => {
          const exists = prevMessages.some((msg) => msg.id === newMessage.id);
          if (!exists) {
            return [...prevMessages, newMessage];
          }
          return prevMessages;
        });

        // Role a visualização para a mensagem mais recente
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        // Atualize a lista de contatos para refletir a nova mensagem recebida
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.id === receivedData.ContactID
              ? { ...contact, isViewed: false }
              : contact
          )
        );
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

    return () => {
      socket.current?.close();
    };
  }, [sessionId]);




  const handleStatusChange = async (value: number) => {
    setStatus(value);

    if (selectedContact) {
      const updatedContact = {
        ...selectedContact,
        status: value,
      };

      try {
        await updateWhatsAppContact(updatedContact);

        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.id === updatedContact.id ? updatedContact : contact
          )
        );

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
    fetchTags();
  }, []);

  useEffect(() => {
    handleFilterContacts();
  }, [searchTerm, selectedFilter, contacts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    handleFilterContacts(filter);
  };

  const handleSelectConversation = async (contact: WhatsAppContact) => {
    setSelectedContact(contact);
    setShowChat(true);
    setIsLoading(true);

    const sector: any = await getSector(sessionId)

    if (contact.responsibleId) {
      setResponsibleUser(contact.responsibleId.toString());
    } else {
      setResponsibleUser(null);
    }

    await validateMetaOnContactSelection(sector.data.accessToken, sector.data.phoneNumberId);

    try {
      const messagesData: any = await getMessagesByContactId(contact.id);
      setMessages(messagesData);

      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleFilterContacts = (filter?: string) => {
    let updatedContacts = [...contacts];

    if (searchTerm) {
      updatedContacts = updatedContacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phoneNumber.includes(searchTerm)
      );
    }

    const activeFilter = filter || selectedFilter;

    if (activeFilter === 'responded') {
      updatedContacts = updatedContacts.filter((contact) => contact.isViewed === true);
    } else if (activeFilter === 'not_responded') {
      updatedContacts = updatedContacts.filter((contact) => contact.isViewed === false);
    }

    setFilteredContacts(updatedContacts);
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

      const temporaryMessage: MessageType = {
        id: Date.now(),
        content: messageInput,
        isSent: true,
        sectorId: newMessage.sectorId,
        contactID: newMessage.contactId,
        isRead: true,
      };

      setMessages((prevMessages) => [...prevMessages, temporaryMessage]);
      setMessageInput('');

      try {
        await sendMessage(newMessage);

        // Atualizar isViewed para true
        if (selectedContact) {
          await updateWhatsAppContact({ ...selectedContact, isViewed: true });

          // Atualiza a lista de contatos para refletir a mudança na interface
          setContacts((prevContacts) =>
            prevContacts.map((contact) =>
              contact.id === selectedContact.id ? { ...contact, isViewed: true } : contact
            )
          );
        }

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === temporaryMessage.id
              ? { ...msg, isSent: true }
              : msg
          )
        );

        socket.current?.send(JSON.stringify(newMessage));
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
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
          const response: any = await sendFile(fileData);

          const messageToAdd: MessageType = {
            id: Date.now(),
            content: isImage ? '' : file.name,
            isSent: response.media.isSent,
            mediaType: response.media.mediaType,
            mediaUrl: response.media.mediaUrl,
            sectorId: response.media.sectorId,
            contactID: response.media.contactId,
            isRead: true,
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

    if (isImage) {
      setIsImageModalVisible(false);
    } else {
      setIsAttachmentModalVisible(false);
    }
    setFilesWithUid([]);
  };
  const handleShowImageModal = () => {
    setFilesToUpload([]);
    setFilesWithUid([]);
    setUploadKey((prevKey) => prevKey + 1);
    setIsImageModalVisible(true);
  };

  const handleShowAttachmentModal = () => {
    setFilesToUpload([]);
    setFilesWithUid([]);
    setUploadKey((prevKey) => prevKey + 1);
    setIsAttachmentModalVisible(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalVisible(false);
    setFilesToUpload([]);
    setFilesWithUid([]);
    setUploadKey((prevKey) => prevKey + 1);
  };

  const handleCloseAttachmentModal = () => {
    setIsAttachmentModalVisible(false);
    setFilesToUpload([]);
    setFilesWithUid([]);
    setUploadKey((prevKey) => prevKey + 1);
  };

  const renderSelectedFiles = () => {
    if (filesToUpload.length === 0) {
      return null;
    }
    return filesToUpload.map((file, index) => (
      <List.Item key={index}>
        <List.Item.Meta
          title={file.name}
          description={file.type}
        />
        <Button
          icon={<EyeOutlined />}
          onClick={() => handlePreviewImage(file)}
        >
          Visualizar
        </Button>
      </List.Item>
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
        onOk() { },
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
    const tagIdsString = value.join(',');
    setCurrentValues({ ...currentValues, tagIds: tagIdsString });
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
        tagIds: currentValues.tagIds,
      };
  
      try {
        await updateWhatsAppContact(updatedContact);
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.id === updatedContact.id ? updatedContact : contact
          )
        );
        setSelectedContact(updatedContact);
  
        antdMessage.success('Contato atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar contato:', error);
        antdMessage.error('Erro ao atualizar contato.');
      } finally {
        setEditableField(null);
        setIsDrawerVisible(false);
      }
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
        setRecordedAudio(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        setShowSendCancelOptions(true);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erro ao iniciar a gravação:", error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleCancelRecording = () => {
    setShowSendCancelOptions(false);
    setRecordedAudio(null);
    setAudioUrl(null);
  };

  const handleSendRecording = async () => {
    if (recordedAudio && selectedContact) {
      setIsSending(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64File = reader.result as string;
        const mimeType = recordedAudio.type.split(';')[0];
        const fileName = `audio_recording.${mimeType.split('/')[1]}`;

        const fileData = {
          base64File: base64File.split(',')[1],
          mediaType: mimeType,
          fileName,
          caption: '',
          recipient: selectedContact.phoneNumber,
          contactId: selectedContact.id,
          sectorId: SessionService.getSessionForSector(),
        };

        try {
          const response: any = await sendFile(fileData);
          const messageToAdd: MessageType = {
            id: Date.now(),
            content: response.media.content || null,
            isSent: response.media.isSent,
            mediaType: response.media.mediaType,
            mediaUrl: response.media.mediaUrl,
            sectorId: response.media.sectorId,
            contactID: response.media.contactId,
            isRead: true,
          };

          setMessages((prevMessages) => [...prevMessages, messageToAdd]);
          antdMessage.success('Áudio enviado com sucesso!');
        } catch (error) {
          console.error('Erro ao enviar áudio:', error);
        } finally {
          setIsSending(false);
          setRecordedAudio(null);
          setAudioUrl(null);
          setShowSendCancelOptions(false);
        }
      };
      reader.readAsDataURL(recordedAudio);
    }
  };

  const getSelectStyle = () => {
    switch (status) {
      case 1:
        return { color: 'green' };
      case 2:
        return { color: 'red' };
      case 3:
        return { color: 'blue' };
      default:
        return {};
    }
  };

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
      {isLoading && <LoadingOverlay />}

      <Sider
        width={350}
        collapsedWidth={0} // Oculta o Sider quando colapsado
        breakpoint="sm" // Colapsa em telas pequenas
        onBreakpoint={(broken) => {
          setShowChat(!broken); // Mostra o chat automaticamente ao colapsar
        }}
        style={{
          padding: 20,
          backgroundColor: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
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
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            <Select
              value={selectedFilter}
              onChange={handleFilterChange}
              style={{ width: '100%' }}
              placeholder="Filtrar por status"
            >
              <Select.Option value="all2">Todos</Select.Option>
              <Select.Option value="responded">Respondido</Select.Option>
              <Select.Option value="not_responded">Não Respondido</Select.Option>
            </Select>
          </div>



          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            <Select
              value={filterResponsibleUser || null} // Mostra o filtro selecionado
              onChange={(value) => {
                setFilterResponsibleUser(value); // Atualiza apenas o filtro
                handleFilterByUser(value); // Filtra os contatos
              }}
              style={{ width: '100%' }}
              placeholder="Filtrar por responsável"
              allowClear
              options={[
                { value: null, label: 'Responsável' }, // Opção para mostrar todos os contatos
                ...users.map((user) => ({
                  value: user.id.toString(),
                  label: user.name,
                })),
              ]}
            />
          </div>

        </div>


        <List
          itemLayout="horizontal"
          locale={{ emptyText: 'Nenhum contato encontrado' }}
          dataSource={filteredContacts}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleSelectConversation(item)}
              className="contact-list-item"
              style={{
                cursor: 'pointer',
                marginBottom: '8px',
                borderRadius: '4px',
                padding: 15,
                backgroundColor: item.isViewed ? '#E6FFED' : '#FFF7E6', // Verde para "Respondido", amarelo para "Não Respondido"
              }}
            >
              <List.Item.Meta
                avatar={<Avatar src={item.profilePictureUrl} icon={<UserOutlined />} />}
                title={item.name}
                description={item.isViewed ? 'Respondido' : 'Não Respondido'}
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
          <Header
            style={{
              backgroundColor: '#fff',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '2px solid #f0f0f0',
              borderRight: '2px solid #f0f0f0',
              borderBottom: '2px solid #f0f0f0',
              borderLeft: '2px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar icon={<UserOutlined />} />
              <Title level={5} style={{ margin: '0 10px' }}>
                {selectedContact ? selectedContact.name : 'Nome do Contato'}
              </Title>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Select
  style={{ width: 200 }}
  placeholder="Atribuir responsável"
  value={responsibleUser || null} // Exibe o responsável atribuído no chat
  onChange={handleResponsibleChange}
  options={[
    { value: userId.toString(), label: 'Atribuir eu mesmo' }, // Apenas "Atribuir eu mesmo" usa o userId
    ...users
      .filter((user) => user.id !== userId.toString()) // Exclui o usuário atual da lista
      .map((user) => ({
        value: user.id,
        label: user.name,
      })),
  ]}
/>


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

              <Button style={{ marginLeft: '10px' }} onClick={handleShowDrawer} type="primary">
                Mais informações
              </Button>
            </div>
          </Header>


          <Content
            style={{
              padding: '24px',
              backgroundColor: '#fff',
              overflowY: 'auto',
              flex: 1,
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
            }}
          >
            {isMetaValid ? (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {isLoading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
                    Conversa não iniciada
                  </div>
                ) : (
                  messages.map((message: any) => (
                    <div key={message.id} style={{ marginBottom: '16px', alignItems: 'center', textAlign: message.isSent ? 'right' : 'left', display: 'flex', justifyContent: message.isSent ? 'flex-end' : 'flex-start' }}>
                      {!message.isSent && (
                        <Avatar src={selectedContact?.profilePictureUrl} icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                      )}
                      <div style={{
                        backgroundColor: message?.isSent ? '#1890ff' : '#fff',
                        border: message?.mediaType?.includes("audio") ? 'none' : '1px solid #d9d9d9',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        maxWidth: '45%',
                        padding: '8px',
                        boxShadow: message.isSent ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                      }}>
                        {message?.mediaType && message?.mediaType?.includes("image") && message.mediaUrl ? (
                          <img
                            src={message.mediaUrl}
                            alt="Image"
                            style={{ maxWidth: '200px', maxHeight: '200px', cursor: 'pointer', borderRadius: '8px' }}
                            onClick={() => handleImageClick(message.mediaUrl)}
                          />
                        ) : null}

                        {message?.mediaType && message?.mediaType.includes("audio") && message.mediaUrl ? (
                          <AudioMessage audioUrl={message.mediaUrl} />
                        ) : null}

                        {(message?.mediaType && (message?.mediaType?.includes("document") || message?.mediaType?.includes("application"))) && message?.mediaUrl ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: message.isSent ? '#1890ff' : '#fff',
                              borderRadius: '8px',
                              padding: '8px',
                            }}
                          >
                            <a
                              href={message.mediaUrl}
                              download
                              style={{
                                cursor: 'pointer',
                                marginLeft: '8px',
                                textDecoration: 'underline',
                                color: message.isSent ? 'white' : 'black', // Texto preto para recebidos
                                maxWidth: '150px', // Ajuste conforme necessário
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'inline-block',
                              }}
                              title={message.mediaUrl.split('/').pop()} // Tooltip para mostrar o nome completo
                            >
                              <span>{message.mediaUrl.split('/').pop()}</span>
                            </a>
                          </div>
                        ) : null}



                        {message.content && (
                          <span style={{ color: message.isSent ? 'white' : 'black' }}>
                            {message.content}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
                <h3>Credenciais inválidas da Meta</h3>
                <p>Não é possível interagir com este chat devido a credenciais inválidas. Verifique as configurações do setor.</p>
              </div>
            )}
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
                  disabled={!isMetaValid}
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
                  disabled={!isMetaValid}
                  onClick={handleShowAttachmentModal}
                  style={{
                    padding: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <div style={{ position: 'relative' }}>
                  {!showSendCancelOptions ? (
                    <Button
                      type="link"
                      icon={<AudioOutlined />}
                      onMouseDown={handleStartRecording}
                      disabled={!isMetaValid}
                      onMouseUp={handleStopRecording}
                      style={{
                        color: isRecording ? 'red' : '',
                        padding: '8px',
                        backgroundColor: '#fff',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                      onTouchStart={handleStartRecording}
                      onTouchEnd={handleStopRecording}
                    />
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        type="default"
                        onClick={handleCancelRecording}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="primary"
                        style={{ backgroundColor: 'primary', borderColor: 'primary', color: 'white' }}
                        onClick={handleSendRecording}
                      >
                        Enviar Áudio
                      </Button>
                    </div>
                  )}
                </div>

                {isSending && (
                  <div className="loading-overlay">
                    <LoadingOverlay />
                  </div>
                )}
                <Button
                  type="link"
                  disabled={!isMetaValid}
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
                key={uploadKey}
                multiple
                showUploadList={false}
                accept="image/png,image/jpeg,image/bmp"
                onChange={handleImageUploadChange}
                beforeUpload={() => false}
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
            <List
              style={{ marginTop: '16px' }}
              bordered
              locale={{ emptyText: 'Nenhum arquivo encontrado' }}
              dataSource={filesWithUid}
              renderItem={(fileObj) => (
                <List.Item key={fileObj.uid}>
                  <List.Item.Meta title={fileObj.file.name} description={fileObj.file.type} />
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => handlePreviewImage(fileObj.file)}
                  >
                    Visualizar
                  </Button>
                </List.Item>
              )}
            />
          </Modal>

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
                return false;
              }}
              showUploadList={false}
              accept="*/*"
              onChange={handleAttachmentUploadChange}
            >
              <Button icon={<PaperClipOutlined />}>Selecionar Anexos</Button>
            </Upload>
            <List
              locale={{ emptyText: 'Nenhum arquivo encontrado' }}
              style={{ marginTop: '16px' }}
              bordered
              dataSource={filesToUpload.map((file, index) => ({
                key: index,
                name: file.name,
                type: file.type,
              }))}
              renderItem={renderSelectedFiles}
            />
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

            {/* Seção de Tags */}
            <Text>
              <strong style={{ marginRight: 8 }}>Tags:</strong>
              <Select
                mode="multiple"
                notFoundContent="Nenhuma etiqueta encontrada"
                style={{ width: '100%', marginBottom: '12px' }}
                placeholder="Selecione as tags"
                value={(typeof currentValues.tagIds === 'string' ? currentValues.tagIds.split(',') : []).map((id: any) => parseInt(id)).filter((id: any) => !isNaN(id))}
                onChange={handleTagIdsChange}
              >
                {tags.map((tag) => (
                  <Select.Option key={tag.id} value={tag.id}>
                    {tag.name}
                  </Select.Option>
                ))}
              </Select>
            </Text>

            {/* Informações do Contato */}
            <Card
              bodyStyle={{ padding: '0' }}
              style={{
                marginTop: 20,
                marginBottom: '12px',
                position: 'relative',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                padding: 0,
              }}
              bordered={false}
            >
              <div style={{ padding: '16px', position: 'relative', margin: 0 }}>
                <strong
                  style={{
                    color: '#1E88E5',
                    fontSize: '16px',
                    display: 'block',
                    marginBottom: 20,
                  }}
                >
                  Informações:
                </strong>
                {/* Endereço */}
                <Text>
                  <strong style={{ marginRight: 8, color: '#9CA3AF' }}>Mora em:</strong>
                  {editableField === 'address' ? (
                    <Input
                      value={currentValues.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      style={{ width: '60%', marginLeft: 8 }}
                    />
                  ) : (
                    <>
                      {currentValues.address}
                      <EditOutlined
                        onClick={() => handleFieldEdit('address')}
                        style={{ marginLeft: 8, cursor: 'pointer' }}
                      />
                    </>
                  )}
                </Text>
                <br />

                {/* Telefone */}
                <Text>
                  <strong style={{ marginRight: 8, color: '#9CA3AF' }}>Telefone:</strong>
                  {editableField === 'phoneNumber' ? (
                    <Input
                      value={currentValues.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      style={{ width: '60%', marginLeft: 8 }}
                    />
                  ) : (
                    <>
                      {currentValues.phoneNumber}
                      <EditOutlined
                        onClick={() => handleFieldEdit('phoneNumber')}
                        style={{ marginLeft: 8, cursor: 'pointer' }}
                      />
                    </>
                  )}
                </Text>
                <br />

                {/* E-mail */}
                <Text>
                  <strong style={{ marginRight: 8, color: '#9CA3AF' }}>E-mail:</strong>
                  {editableField === 'email' ? (
                    <Input
                      value={currentValues.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      style={{ width: '60%', marginLeft: 8 }}
                    />
                  ) : (
                    <>
                      {currentValues.email}
                      <EditOutlined
                        onClick={() => handleFieldEdit('email')}
                        style={{ marginLeft: 8, cursor: 'pointer' }}
                      />
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

            {/* Botão "Atualizar" */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button
                type="primary"
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                onClick={() => {
                  handleSave();
                  handleCloseDrawer();
                }}
              >
                Atualizar
              </Button>
            </div>
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
