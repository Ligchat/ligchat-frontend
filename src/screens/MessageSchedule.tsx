import React, { useEffect, useState } from 'react';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  PictureOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  DatePicker,
  Select,
  message as antdMessage,
  Skeleton,
  Collapse,
  Space,
  Upload,
  Tooltip, // Importar Tooltip
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import Picker from '@emoji-mart/react';
import {
  createMessageScheduling,
  CreateMessageSchedulingDTO,
  deleteMessageScheduling,
  getMessageSchedulings,
  updateMessageScheduling,
} from '../services/MessageSchedulingsService';
import { getTags } from '../services/LabelService';
import SessionService from '../services/SessionService';
import LoadingOverlay from '../components/LoadingOverlay';
import { getFlows } from '../services/FlowService';
import { getSector } from '../services/SectorService';

declare var gapi: any;
declare var google: any; // Declare 'google' for the new GIS library

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

interface Message {
  id?: number;
  title: string;
  date: number | null;
  description: string;
  labels: string[];
  flowId: any | null;
  imageName?: string;
  fileName?: string;
  imageAttachment?: string;
  fileAttachment?: string;
  imageMimeType?: string;
  fileMimeType?: string;
  emojis?: string[];
  // Removemos googleEventId e meetLink
}

interface Tag {
  id: number;
  name: string;
}

const SCOPES = 'https://www.googleapis.com/auth/calendar';

const MessageSchedule: React.FC = () => {
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
    flowId: null,
    imageName: '',
    fileName: '',
    imageAttachment: '',
    fileAttachment: '',
    imageMimeType: '',
    fileMimeType: '',
    emojis: [],
    // Removemos googleEventId e meetLink
  });
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isGeneratingMeetLink, setIsGeneratingMeetLink] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleApiKey, setGoogleApiKey] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(true); // Novo estado

  useEffect(() => {
    const fetchSectorDetails = async () => {
      const sectorId = SessionService.getSession('selectedSector');
      setSelectedSector(sectorId);
      if (sectorId !== null) {
        try {
          const sector: any = await getSector(sectorId);
          setGoogleClientId(sector.data.googleClientId || null);
          setGoogleApiKey(sector.data.googleApiKey || null);
          if (!sector.data.googleApiKey) {
            setIsApiKeyValid(false);
          }
        } catch (error) {
          console.error('Erro ao buscar detalhes do setor:', error);
          setIsApiKeyValid(false);
        }
      }
      fetchMessages();
      fetchTags();
      fetchFlows();
    };

    fetchSectorDetails();
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleApiKey) {
      if (googleApiKey === null || googleApiKey === undefined) {
        setIsApiKeyValid(false);
      }
      return;
    }

    // Load the GIS script
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: SCOPES,
        callback: '', // Will be set later
      });
      setTokenClient(client);
    };
    document.body.appendChild(gisScript);

    // Load the GAPI client library
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
      gapi.load('client', () => initGapiClient(googleApiKey));
    };
    document.body.appendChild(gapiScript);

    // Cleanup scripts on unmount or credential change
    return () => {
      if (document.body.contains(gisScript)) {
        document.body.removeChild(gisScript);
      }
      if (document.body.contains(gapiScript)) {
        document.body.removeChild(gapiScript);
      }
    };
  }, [googleClientId, googleApiKey]);

  const initGapiClient = async (apiKey: string) => {
    try {
      await gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      });
      setIsApiKeyValid(true); // Chave válida
    } catch (error) {
      console.error('Erro ao inicializar o cliente GAPI:', error);
      setIsApiKeyValid(false); // Chave inválida
    }
  };

  const handleAuthClick = () => {
    if (!tokenClient) {
      console.error('Token client not initialized');
      return;
    }

    tokenClient.callback = (resp: any) => {
      if (resp.error !== undefined) {
        console.error('Error during authentication:', resp.error);
        if (resp.error === 'popup_closed_by_user') {
        } else {
        }
      } else {
        setIsAuthenticated(true);
      }
    };

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const handleSignoutClick = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token, () => {
        gapi.client.setToken(null);
        setIsAuthenticated(false);
      });
    }
  };

  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const response: any = await getFlows(
        SessionService.getSessionForSector(),
        0,
        SessionService.getSession('authToken')
      );
      setFlows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar fluxos:', error);
      setFlows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response: any = await getMessageSchedulings();
      setMessages(
        response.map((msg: any) => ({
          id: msg.id,
          title: msg.name,
          date: dayjs(msg.sendDate, 'DD/MM/YYYY HH:mm').valueOf(),
          description: msg.messageText,
          labels: msg.tagIds ? msg.tagIds.split(',') : [],
          flowId: msg.flowId,
          imageName: msg.imageName,
          fileName: msg.fileName,
          imageAttachment: msg.imageAttachment,
          fileAttachment: msg.fileAttachment,
          imageMimeType: msg.imageMimeType,
          fileMimeType: msg.fileMimeType,
          emojis: msg.emojis || [],
          // Removemos googleEventId e meetLink
        }))
      );
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response: any = await getTags();
      setTags(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar etiquetas:', error);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateText = (text: string, limit: number) => {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  const handleSave = async () => {
    try {
      const sectorId = SessionService.getSession('selectedSector');

      if (!newMessage.date) {
        throw new Error('Data inválida');
      }

      const formattedDate = dayjs(newMessage.date).format('DD-MM-YYYY HH:mm:ss');

      const messageData: CreateMessageSchedulingDTO = {
        name: newMessage.title,
        messageText: newMessage.description,
        sendDate: formattedDate,
        flowId: newMessage.flowId!,
        sectorId: sectorId,
        tagIds: newMessage.labels.join(','),
        imageName: newMessage.imageName,
        fileName: newMessage.fileName,
        imageAttachment: newMessage.imageAttachment,
        fileAttachment: newMessage.fileAttachment,
        imageMimeType: newMessage.imageMimeType,
        fileMimeType: newMessage.fileMimeType,
        status: true,
      };

      if (currentMessageIndex !== null && newMessage.id) {
        await updateMessageScheduling(newMessage.id, messageData);
      } else {
        await createMessageScheduling(messageData);
      }

      fetchMessages();
      closeDrawer();
    } catch (error: any) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const handleDelete = async (index: number) => {
    const messageId = messages[index].id;
    if (!messageId) return;

    try {
      await deleteMessageScheduling(messageId);
      fetchMessages();
    } catch (error: any) {
      console.error('Erro ao excluir mensagem:', error);
    } finally {
      setConfirmDeleteIndex(null);
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
        flowId: message.flowId,
        imageName: message.imageName,
        fileName: message.fileName,
        imageAttachment: message.imageAttachment,
        fileAttachment: message.fileAttachment,
        imageMimeType: message.imageMimeType,
        fileMimeType: message.fileMimeType,
        emojis: message.emojis || [],
        // Removemos googleEventId e meetLink
      });
    } else {
      setNewMessage({
        title: '',
        date: null,
        description: '',
        labels: [],
        flowId: null,
        imageName: '',
        fileName: '',
        imageAttachment: '',
        fileAttachment: '',
        imageMimeType: '',
        fileMimeType: '',
        emojis: [],
        // Removemos googleEventId e meetLink
      });
    }
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date && date.isValid()) {
      setNewMessage({ ...newMessage, date: date.valueOf() });
    } else {
      setNewMessage({ ...newMessage, date: null });
    }
  };

  const handleLabelsChange = (selectedLabels: string[]) => {
    setNewMessage({ ...newMessage, labels: selectedLabels });
  };

  const handleFlowChange = (flowId: number) => {
    setNewMessage({
      ...newMessage,
      flowId,
      description: '',
      imageName: '',
      fileName: '',
      imageAttachment: '',
      fileAttachment: '',
      imageMimeType: '',
      fileMimeType: '',
    });
  };

  const generateGoogleMeetLink = () => {
    if (!newMessage.date) {
      return;
    }

    if (!isAuthenticated) {
      handleAuthClick();
      return;
    }

    setIsGeneratingMeetLink(true);

    const event = {
      summary: newMessage.title || 'Evento do Agendamento de Mensagem',
      description: newMessage.description || '',
      start: {
        dateTime: dayjs(newMessage.date).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: dayjs(newMessage.date).add(1, 'hour').toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      conferenceData: {
        createRequest: {
          requestId: `meet_${Date.now()}`,
        },
      },
    };

    gapi.client.calendar.events
      .insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
      })
      .then(
        (response: any) => {
          const event = response.result;
          const meetLink = event.conferenceData.entryPoints[0].uri;
          setNewMessage((prevMessage) => ({
            ...prevMessage,
            description: `${prevMessage.description}\n\tLink do Google Meet: ${meetLink}`,
          }));
          setIsGeneratingMeetLink(false);
        },
        (error: any) => {
          console.error('Erro ao criar evento no Google Calendar:', error);
          setIsGeneratingMeetLink(false);
        }
      );
  };

  const handleAddAttachment = (file: any) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1] || '';

      setNewMessage((prevMessage) => ({
        ...prevMessage,
        fileName: file.name,
        fileMimeType: file.type,
        fileAttachment: base64String,
      }));
    };

    reader.onerror = () => {
    };

    reader.readAsDataURL(file);
    return false;
  };

  const handleAddImage = (file: any) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1] || '';

      setNewMessage((prevMessage) => ({
        ...prevMessage,
        imageName: file.name,
        imageMimeType: file.type,
        imageAttachment: base64String,
      }));
    };

    reader.onerror = () => {
    };

    reader.readAsDataURL(file);
    return false;
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage({
      ...newMessage,
      description: e.target.value,
    });
  };

  return (
    <div className="relative p-8">
      {isLoading && <LoadingOverlay />}

      <h1 style={{color: '#1890ff'}} className="text-3xl font-bold mb-6">Agendamento de mensagem</h1>
      {selectedSector === null && (
        <div className="flex justify-center items-center h-64 text-lg text-gray-500">
          Nenhum setor selecionado
        </div>
      )}
      <Row gutter={[24, 24]}>
        {isLoading ? (
          <Col span={24}>
            <Skeleton active />
          </Col>
        ) : (
          messages.map((message, index) => (
            <Col xs={24} sm={12} md={8} key={index} style={{ display: 'flex' }}>
              <Card className="shadow-md border rounded-lg flex-grow">
                {confirmDeleteIndex === index ? (
                  <div className="flex flex-col items-center justify-center h-full bg-yellow-400 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-center mb-4">Deseja mesmo excluir?</h2>
                    <p className="text-white mb-4">Essa ação é irreversível.</p>
                    <div className="flex justify-center space-x-4">
                      <Button
                        onClick={() => setConfirmDeleteIndex(null)}
                        className="border-white text-white"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        Não
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => handleDelete(index)}
                        style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
                      >
                        Sim
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg font-bold">{message.title}</h2>
                      <div className="flex space-x-2">
                        <EditOutlined className="text-blue-500 cursor-pointer" onClick={() => showDrawer(index)} />
                        <DeleteOutlined
                          className="text-red-500 cursor-pointer"
                          onClick={() => setConfirmDeleteIndex(index)}
                        />
                      </div>
                    </div>
                    <p className="text-gray-500 mb-2">{dayjs(message.date).format('DD/MM/YYYY HH:mm')}</p>
                    <p className="mb-4">{truncateText(message.description, 50)}</p>
                    <div>
                      <h3 className="text-sm font-bold">Etiquetas</h3>
                      <Collapse
                        className="mt-2"
                        items={[
                          {
                            key: '1',
                            label: 'Ver etiquetas',
                            children: (
                              <div className="flex flex-wrap gap-2">
                                {message.labels.map((label, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-blue-100 text-blue-500 text-sm px-2 py-1 rounded-lg"
                                  >
                                    {tags.find((tag) => tag.id === Number(label))?.name || 'Etiqueta desconhecida'}
                                  </span>
                                ))}
                              </div>
                            ),
                          },
                        ]}
                      />
                    </div>
                  </>
                )}
              </Card>
            </Col>
          ))
        )}
        {selectedSector != null && (
          <Col xs={24} sm={12} md={8} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <Card
              className="flex items-center justify-center border rounded-lg cursor-pointer shadow-md flex-grow"
              onClick={() => showDrawer(null)}
            >
              <PlusOutlined className="text-blue-500 text-3xl" />
            </Card>
          </Col>
        )}
      </Row>

      {isDrawerVisible && (
        <div className="fixed top-0 right-0 w-96 bg-white shadow-lg h-full p-6 z-50 rounded-lg">
          <h2 className="text-lg font-bold mb-4">
            {currentMessageIndex !== null ? 'Editar mensagem' : 'Adicionar nova mensagem'}
          </h2>
          <Input
            value={newMessage.title}
            onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
            placeholder="Título da mensagem"
            className="mb-4"
          />
          <DatePicker
            format="DD/MM/YYYY HH:mm"
            showTime={{ format: 'HH:mm' }}
            value={newMessage.date ? dayjs(newMessage.date) : null}
            onChange={handleDateChange}
            className="w-full mb-4"
          />
          <TextArea
            value={newMessage.description}
            onChange={handleDescriptionChange}
            placeholder="Descrição da mensagem"
            rows={4}
            className="mb-4"
          />
          <Select
            mode="multiple"
            value={newMessage.labels}
            notFoundContent="Nenhuma etiqueta encontrada"
            onChange={handleLabelsChange}
            placeholder="Selecione as etiquetas"
            className="w-full mb-4"
          >
            {tags.map((tag) => (
              <Option key={tag.id} value={String(tag.id)}>
                {tag.name}
              </Option>
            ))}
          </Select>
          <div className="mb-4 w-full">
            <h3 className="text-sm font-bold mb-2">Ações adicionais</h3>
            <Space size="middle" className="w-full flex justify-between">
              <div className="flex items-center mb-4 w-full">
                <div className="flex items-center space-x-4">
                  <Upload showUploadList={false} beforeUpload={(file) => handleAddAttachment(file)}>
                    <PaperClipOutlined className="text-2xl cursor-pointer" title="Adicionar anexo" />
                  </Upload>
                  <Upload showUploadList={false} beforeUpload={(file) => handleAddImage(file)}>
                    <PictureOutlined className="text-2xl cursor-pointer" title="Adicionar imagem" />
                  </Upload>
                  <SmileOutlined
                    className="text-2xl cursor-pointer"
                    title="Adicionar emoji"
                    onClick={() => setIsEmojiPickerVisible((prev) => !prev)}
                  />
                </div>

                <div className="ml-4">
                  <Select
                    style={{ width: '200px' }}
                    placeholder="Selecione o fluxo"
                    value={newMessage.flowId !== null ? newMessage.flowId : undefined}
                    onChange={(value) => handleFlowChange(value)}
                  >
                    {flows.map((flow: any) => (
                      <Option key={flow.id} value={flow.id}>
                        {flow.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={{ position: 'relative' }}>
                  {isEmojiPickerVisible && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 8,
                        zIndex: 1000,
                      }}
                    >
                      <Picker
                        onEmojiSelect={(emoji: any) => {
                          setNewMessage((prevMessage) => ({
                            ...prevMessage,
                            description: `${prevMessage.description}${emoji.native}`,
                          }));
                          setIsEmojiPickerVisible(false);
                        }}
                        locale="pt"
                        theme="light"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Space>
          </div>
          {/* Botão "Gerar link do Google Meet" com Tooltip */}
          {!isApiKeyValid ? (
            <Tooltip title="Chave de api inválida ou não configurada">
              <Button
                type="default"
                disabled
                loading={isGeneratingMeetLink}
                onClick={generateGoogleMeetLink}
                className="mb-4"
              >
                Gerar link do Google Meet
              </Button>
            </Tooltip>
          ) : (
            <Button
              type="default"
              onClick={generateGoogleMeetLink}
              className="mb-4"
              loading={isGeneratingMeetLink}
            >
              Gerar link do Google Meet
            </Button>
          )}

          <div className="flex justify-end space-x-2">
            <Button onClick={closeDrawer}>Cancelar</Button>
            <Button type="primary" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSchedule;
