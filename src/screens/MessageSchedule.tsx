import React, { useEffect, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, PaperClipOutlined, PictureOutlined, SmileOutlined } from '@ant-design/icons';
import { Card, Row, Col, Button, Input, DatePicker, Select, message as antdMessage, Skeleton, Collapse, Space, Upload } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import Picker from '@emoji-mart/react';
import { createMessageScheduling, CreateMessageSchedulingDTO, deleteMessageScheduling, getMessageSchedulings, updateMessageScheduling } from '../services/MessageSchedulingsService';
import { getTags } from '../services/LabelService';
import SessionService from '../services/SessionService';
import LoadingOverlay from '../components/LoadingOverlay';
import { getFlows } from '../services/FlowService';

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
}

interface Tag {
  id: number;
  name: string;
}

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
  });
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const sectorId = SessionService.getSession('selectedSector');
    setSelectedSector(sectorId);
    fetchMessages();
    fetchTags();
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const response: any = await getFlows(SessionService.getSessionForSector(), 0, SessionService.getSession('authToken'));
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
          date: dayjs(msg.sendDate, 'DD/MM/YYYY HH:mm').valueOf(), // Converte para timestamp
          description: msg.messageText,
          labels: msg.tagIds ? msg.tagIds.split(',') : [],
          flowId: msg.flowId,
          imageName: msg.imageName,
          fileName: msg.fileName,
          imageAttachment: msg.imageAttachment,
          fileAttachment: msg.fileAttachment,
          imageMimeType: msg.imageMimeType,
          fileMimeType: msg.fileMimeType,
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
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  const handleSave = async () => {
    try {
      const sectorId = SessionService.getSession('selectedSector');

      if (!newMessage.date) {
        throw new Error('Data inválida');
      }

      const formattedDate = dayjs(newMessage.date).format('DD-MM-YYYY HH:mm:ss'); // Formato para o backend

      const messageData: CreateMessageSchedulingDTO = {
        name: newMessage.title,
        messageText: newMessage.description,
        sendDate: formattedDate, // Envia a data formatada para o backend
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

      antdMessage.success('Mensagem salva com sucesso!');
      fetchMessages();
      closeDrawer();
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      antdMessage.error('Erro ao salvar mensagem. Por favor, verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (index: number) => {
    const messageId = messages[index].id;
    if (!messageId) return;

    try {
      await deleteMessageScheduling(messageId);
      antdMessage.success('Mensagem excluída com sucesso!');
      fetchMessages();
    } catch (error) {
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
        date: message.date, // Já está como timestamp
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
      });
    }
    setIsDrawerVisible(true);
  };
  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date && date.isValid()) {
      setNewMessage({ ...newMessage, date: date.valueOf() }); // Armazena como timestamp
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
    const randomId = Math.random().toString(36).substring(2, 15);
    const meetLink = `https://meet.google.com/${randomId}`;
    antdMessage.info(`Link do Google Meet gerado: ${meetLink}`);
    setNewMessage((prevMessage) => ({
      ...prevMessage,
      description: `${prevMessage.description}\nLink do Google Meet: ${meetLink}`,
    }));
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
      antdMessage.error('Erro ao ler o arquivo. Por favor, tente novamente.');
    };
  
    reader.readAsDataURL(file);
    return false; // Prevents automatic upload
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
      antdMessage.error('Erro ao ler a imagem. Por favor, tente novamente.');
    };
  
    reader.readAsDataURL(file);
    return false; // Prevents automatic upload
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

      <h1 className="text-3xl font-bold mb-6">Agendamento de mensagem</h1>
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
                        <DeleteOutlined className="text-red-500 cursor-pointer" onClick={() => setConfirmDeleteIndex(index)} />
                      </div>
                    </div>
                    <p className="text-gray-500 mb-2">{dayjs(message.date).format('DD/MM/YYYY HH:mm')}</p>
                    <p className="mb-4">{truncateText(message.description, 50)}</p>
                    <div>
                      <h3 className="text-sm font-bold">Etiquetas</h3>
                      <Collapse className="mt-2">
                        <Panel header="Ver etiquetas" key="1">
                          <div className="flex flex-wrap gap-2">
                            {message.labels.map((label, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-500 text-sm px-2 py-1 rounded-lg">
                                {tags.find((tag) => tag.id === Number(label))?.name || 'Etiqueta desconhecida'}
                              </span>
                            ))}
                          </div>
                        </Panel>
                      </Collapse>
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
          <h2 className="text-lg font-bold mb-4">{currentMessageIndex !== null ? 'Editar mensagem' : 'Adicionar nova mensagem'}</h2>
          <Input
            value={newMessage.title}
            onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
            placeholder="Título da mensagem"
            className="mb-4"
          />
          <DatePicker
            format="DD/MM/YYYY HH:mm"
            showTime={{ format: 'HH:mm' }}
            value={newMessage.date ? dayjs(newMessage.date) : null} // Converte o timestamp para um objeto dayjs
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
                {/* Contêiner dos ícones */}
                <div className="flex items-center space-x-4">
                  <Upload showUploadList={false} beforeUpload={(file) => { handleAddAttachment(file); return false; }}>
                    <PaperClipOutlined className="text-2xl cursor-pointer" title="Adicionar anexo" />
                  </Upload>
                  <Upload showUploadList={false} beforeUpload={(file) => { handleAddImage(file); return false; }}>
                    <PictureOutlined className="text-2xl cursor-pointer" title="Adicionar imagem" />
                  </Upload>
                  <SmileOutlined
                    className="text-2xl cursor-pointer"
                    title="Adicionar emoji"
                    onClick={() => setIsEmojiPickerVisible((prev) => !prev)}
                  />
                </div>

                {/* Contêiner do Select com tamanho fixo */}
                <div className="ml-4">
                  <Select
                    style={{ width: '200px' }} // Definindo largura fixa de 200px
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

                {/* Emoji Picker */}
                <div style={{ position: 'relative' }}>
                  {isEmojiPickerVisible && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 1000 }}>
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
          <Button type="default" onClick={generateGoogleMeetLink} className="mb-4">
            Gerar link do Google Meet
          </Button>

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