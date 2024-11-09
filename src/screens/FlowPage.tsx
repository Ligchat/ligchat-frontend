import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Dropdown,
  Menu,
  Switch,
  Modal,
  Select,
  Form,
  message,
  Spin,
  Skeleton,
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  FolderOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../services/FolderService';
import SessionService from '../services/SessionService';
import { getSectors, Sector } from '../services/SectorService';
import { getFlows, createFlow, Flow, deleteFlow, updateFlow } from '../services/FlowService';
import LoadingOverlay from '../components/LoadingOverlay';

const { Option } = Select;

interface FolderWithEditing extends Folder {
  isEditing: boolean;
}

const FlowPage: React.FC = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<FolderWithEditing[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [noFoldersFound, setNoFoldersFound] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<number | undefined>(SessionService.getSession('selectedSector'));
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sectorId, setSectorId] = useState<number | undefined>(undefined);

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [isAddFlowModalVisible, setIsAddFlowModalVisible] = useState<boolean>(false);
  const [newFlowName, setNewFlowName] = useState<string>('');
  const [selectedFlowFolder, setSelectedFlowFolder] = useState<number | undefined>(undefined);
  const [editingFolder, setEditingFolder] = useState<FolderWithEditing | null>(null);
  const [editFolderName, setEditFolderName] = useState<string>('');
  const [editFolderSector, setEditFolderSector] = useState<number | undefined>(undefined);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isEditFlowModalVisible, setIsEditFlowModalVisible] = useState<boolean>(false);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [editFlowName, setEditFlowName] = useState<string>('');
  const [editFlowFolder, setEditFlowFolder] = useState<number | undefined>(undefined);

  useEffect(() => {
    const tokenFromSession = SessionService.getSession('authToken');
    const sectorIdFromSession: any = SessionService.getSession('selectedSector');
    setSectorId(sectorIdFromSession);
    setSelectedSector(sectorIdFromSession);
    setToken(tokenFromSession);
    
    if (tokenFromSession) {
      fetchFolders(tokenFromSession, sectorIdFromSession);
      fetchSectors(tokenFromSession);
    }
  }, [navigate]);

  const fetchFolders = async (token: string, sectorId: any) => {
    if (!sectorId) {
      console.error('sectorId não está definido');
      return;
    }
    try {
      setLoadingData(true);
      const response: any = await getFolders(token, sectorId);
      setFolders(response.data.map((folder: any) => ({ ...folder, isEditing: false })));
      setNoFoldersFound(false);
    } catch (error: any) {
      console.error('Erro ao buscar pastas:', error);
      if (error.response && error.response.status === 404) {
        setFolders([]);
        setNoFoldersFound(true);
      }
    } finally {
      setLoadingData(false);
    }
  };

  const fetchSectors = async (token: string) => {
    try {
      const response: any = await getSectors(token);
      setSectors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setSectors([]);
    }
  };

  const fetchFlows = async (folderId: number) => {
    if (!token) {
      return;
    }
    try {
      const fetchedFlows: any = await getFlows(sectorId, folderId, token);
      setFlows(Array.isArray(fetchedFlows.data) ? fetchedFlows.data : []);
    } catch (error: any) {
      setFlows([]);
    } finally {
    }
  };

  const handleFolderClick = (folderId: number) => {
    setSelectedFolderId(folderId);
    fetchFlows(folderId);
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!token) return;
    try {
      await deleteFlow(flowId, token);
      setFlows((prev) => prev.filter((flow) => flow.id !== flowId));
      message.success('Fluxo deletado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir fluxo:', error);
    }
  };

  const handleSaveFolder = async () => {
    if (!token || !editingFolder) return;
    try {
      await updateFolder(editingFolder.id, { name: editFolderName, sectorId: editFolderSector }, token);
      fetchFolders(token, sectorId); 
      message.success('Pasta atualizada com sucesso!');
      setEditingFolder(null);
      setIsEditModalVisible(false);
    } catch (error: any) {
      console.error('Erro ao salvar pasta:', error);
    }
  };

  const handleEditFolder = (folder: FolderWithEditing) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderSector(folder.sectorId);
    setIsEditModalVisible(true);
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!token) return;
    try {
      await deleteFolder(folderId, token);
      setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
      message.success('Pasta deletada com sucesso!');
      if (selectedFolderId === folderId) {
        setFlows([]);
        setSelectedFolderId(null);
      }
    } catch (error: any) {
      console.error('Erro ao excluir pasta:', error);
    }
  };

  const handleAddFolder = () => {
    setIsAddModalVisible(true);
  };

  const handleCreateFolder = async () => {
    if (!token) return;
    if (!newFolderName.trim()) {
      return;
    }
    if (selectedSector === undefined) {
      return;
    }
    try {
      const newFolder = await createFolder(
        { name: newFolderName, sectorId: selectedSector },
        token
      );
      message.success('Pasta criada com sucesso!');
      setNewFolderName('');
      setIsAddModalVisible(false);
      fetchFolders(token, selectedSector);
    } catch (error: any) {
      console.error('Erro ao criar pasta:', error);
    }
  };

  const handleAddFlow = () => {
    setIsAddFlowModalVisible(true);
  };

  const handleCreateFlow = async () => {
    if (!token) return;
    if (!newFlowName.trim()) {
      return;
    }
    if (selectedFlowFolder === undefined) {
      return;
    }
    try {
      const newFlow = await createFlow(
        { name: newFlowName, folderId: selectedFlowFolder },
      );
      message.success('Fluxo criado com sucesso!');
      setNewFlowName('');
      setSelectedFlowFolder(undefined);
      setIsAddFlowModalVisible(false);
      setSelectedFolderId(selectedFlowFolder)
      fetchFlows(selectedFlowFolder);
    } catch (error: any) {
      console.error('Erro ao criar fluxo:', error);
    }
  };

  const folderMenu = (folder: FolderWithEditing) => (
    <Menu>
      <Menu.Item key="1" onClick={() => setIsDeleting(folder.id)}>
        Deletar
      </Menu.Item>
      <Menu.Item key="2">Mover para</Menu.Item>
      <Menu.Item key="3" onClick={() => handleEditFolder(folder)}>
        Renomear
      </Menu.Item>
    </Menu>
  );

  const handleEditFlow = (flow: Flow) => {
    setEditingFlow(flow);
    setEditFlowName(flow.name);
    setEditFlowFolder(flow.folderId);
    setIsEditFlowModalVisible(true);
  };

  const handleEditFlowPath = (flow: Flow) => {
    navigate(`/flow/edit/${flow.id}`);
  };

  const handleSaveFlow = async () => {
    if (!token || !editingFlow) return;
    if (!editFlowName.trim()) {
      return;
    }
    if (editFlowFolder === undefined) {
      return;
    }
    try {
      await updateFlow(
        editingFlow.id,
        { name: editFlowName, folderId: editFlowFolder },
        token
      );
      setEditingFlow(null);
      setIsEditFlowModalVisible(false);
      fetchFlows(editFlowFolder);
    } catch (error: any) {
      console.error('Erro ao atualizar fluxo:', error);
    }
  };

  const handleToggleFlow = (id: string): void => {
    setFlows((prev) => {
      if (!prev || !Array.isArray(prev)) {
        console.warn("O estado 'flows' não é um array:", prev);
        return prev;
      }

      return prev.map((flow) =>
        flow.id === id ? { ...flow, isActive: !flow.isActive } : flow
      );
    });
  };

  const handleCancelEdit = () => {
    setEditingFlow(null);
    setIsEditFlowModalVisible(false);
  };

  return (
    <div className="p-4 md:p-8">
      {loadingData && <LoadingOverlay />}
      <h1 style={{color: '#1890ff'}} className="text-2xl md:text-3xl font-bold mb-10">Fluxos</h1>
      {loadingData ? ( 
      selectedSector == null ? (
        <div className="flex justify-center items-center h-64 text-lg text-gray-500">
          Nenhum setor selecionado
        </div>
      ) : (
        <></>
      )
    ) : (
        <>
          {selectedSector != null && (
            <>
              <h4 style={{color: '#1890ff'}} className="text-xl font-semibold mb-4">Pastas</h4>

              {noFoldersFound ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-center">Nenhuma pasta encontrada</p>
                  <Button
                    type="dashed"
                    className="w-48 h-10 flex items-center justify-center mt-4"
                    onClick={handleAddFolder}
                  >
                    <PlusOutlined /> Nova pasta
                  </Button>
                </div>
              ) : (
                <Row gutter={[16, 16]} className="mb-6">
                  {folders.length === 0 ? ( // Exibir Skeleton enquanto as pastas estão carregando
                    Array.from({ length: 4 }).map((_, index) => (
                      <Col key={index} xs={24} sm={12} md={6} lg={4}>
                        <Skeleton active />
                      </Col>
                    ))
                  ) : (
                    folders.map((folder) => (
                      <Col key={folder.id} xs={24} sm={12} md={6} lg={4}>
                        <Card
                          className={`h-full cursor-pointer ${selectedFolderId === folder.id ? '' : ''}`}
                          bodyStyle={{ padding: 0 }}
                          title={
                            <div
                              className="flex items-center space-x-2"
                              onClick={() => handleFolderClick(folder.id)}
                            >
                              <FolderOutlined className="text-xl" />
                              <span className="text-sm md:text-base">{folder.name}</span>
                            </div>
                          }
                          actions={[<Dropdown overlay={folderMenu(folder)} key="action"><EllipsisOutlined /></Dropdown>]}
                        />
                      </Col>
                    ))
                  )}
                  <Col xs={24} sm={12} md={6} lg={4}>
                    <Button
                      type="dashed"
                      className="w-full h-full flex flex-col items-center justify-center"
                      onClick={handleAddFolder}
                    >
                      <PlusOutlined className="text-3xl mb-2" /> Nova pasta
                    </Button>
                  </Col>
                </Row>
              )}
            </>
          )}

          {selectedSector != null && (
            <>
              <h2 style={{color: '#1890ff'}} className="text-xl font-semibold mb-4">Detalhes dos Fluxos</h2>

              {flows.length === 0 && selectedFolderId !== null ? (
  <div>
    <p>Nenhum fluxo encontrado para esta pasta.</p>
    <Col xs={24} sm={12} md={8}>
      <Card
        className="flex items-center justify-center cursor-pointer shadow-md rounded-lg h-full"
        onClick={handleAddFlow}
      >
        <PlusOutlined className="text-blue-500 text-3xl" />
      </Card>
    </Col>
  </div>
) : (
                <Row gutter={[16, 16]}>
                  {Array.isArray(flows) && flows.length > 0 ? (
                    flows.map((flow: any) => (
                      <Col key={flow.id} xs={24} sm={12} md={8}>
                        <Card
                          title={
                            <div className="flex items-center justify-between">
                              <EditOutlined
                                className="text-blue-500 cursor-pointer mr-2"
                                onClick={() => handleEditFlow(flow)}
                              />
                              <span className="flex-grow text-center">{flow.name}</span>
                              <Switch
                                checked={flow.isActive}
                                onChange={() => handleToggleFlow(flow.id)}
                              />
                            </div>
                          }
                          extra={null}
                          className={`shadow-md rounded-lg ${!flow.isActive ? 'bg-gray-100' : ''}`}
                        >
                          {flow.isEditing ? (
                            <div className="flex justify-between mt-4">
                              <Button
                                type="primary"
                                onClick={() => handleSaveFlow()}
                                icon={<SaveOutlined />}
                              >
                                Salvar
                              </Button>
                              <Button onClick={() => handleCancelEdit()}>Cancelar</Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-gray-500">Última versão: {flow.version}</p>
                              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                                <Button icon={<EditOutlined />}>Duplicar</Button>
                                <Button icon={<EditOutlined />}>Enviar para</Button>
                              </div>
                              <div className="flex space-x-4">
                                <div>
                                  <p>Execuções</p>
                                  <p>{flow.exec ? flow.exec : 0}</p>
                                </div>
                                <div>
                                  <p>CTR%</p>
                                  <p>{flow.ctr ? flow.ctr : 0.00}%</p>
                                </div>
                              </div>
                              <div className="mt-4 flex justify-between">
                                <Button
                                  type="primary"
                                  onClick={() => handleEditFlowPath(flow)}
                                >
                                  Editar fluxo
                                </Button>
                                <Button
                                  danger
                                  onClick={() => handleDeleteFlow(flow.id)}
                                  icon={<DeleteOutlined />}
                                >
                                  Excluir fluxo
                                </Button>
                              </div>
                            </>
                          )}
                        </Card>
                      </Col>
                    ))
                  ) : null}
                  <Col xs={24} sm={12} md={8}>
                    <Card
                      className="flex items-center justify-center cursor-pointer shadow-md rounded-lg h-full"
                      onClick={handleAddFlow}
                    >
                      <PlusOutlined className="text-blue-500 text-3xl" />
                    </Card>
                  </Col>
                </Row>
              )}
            </>
          )}

          {selectedSector == null && (
            <div className="flex justify-center items-center h-64 text-lg text-gray-500">
              Nenhum setor selecionado
            </div>
          )}
        </>
      )}

      {/* Modal para editar fluxo */}
      <Modal
        title="Editar Fluxo"
        visible={isEditFlowModalVisible}
        onOk={handleSaveFlow}
        onCancel={handleCancelEdit}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form layout="vertical">
          <Form.Item label="Nome do Fluxo" required>
            <Input
              placeholder="Digite o novo nome do fluxo"
              value={editFlowName}
              onChange={(e) => setEditFlowName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Pasta do Fluxo" required>
            <Select
            notFoundContent="Nenhuma pasta encontrada"
              placeholder="Selecione a pasta"
              value={editFlowFolder}
              onChange={(value) => setEditFlowFolder(value)}
              loading={folders.length === 0}
            >
              {folders.map((folder) => (
                <Option key={folder.id} value={folder.id}>
                  {folder.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para adicionar nova pasta */}
      <Modal
        title="Adicionar Nova Pasta"
        visible={isAddModalVisible}
        onOk={handleCreateFolder}
        onCancel={() => setIsAddModalVisible(false)}
        okText="Criar"
        cancelText="Cancelar"
      >
        <Form layout="vertical">
          <Form.Item label="Nome da Pasta" required>
            <Input
              placeholder="Digite o nome da pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para adicionar novo fluxo */}
      <Modal
        title="Adicionar Novo Fluxo"
        visible={isAddFlowModalVisible}
        onOk={handleCreateFlow}
        onCancel={() => setIsAddFlowModalVisible(false)}
        okText="Criar"
        cancelText="Cancelar"
      >
        <Form layout="vertical">
          <Form.Item label="Nome do Fluxo" required>
            <Input
              placeholder="Digite o nome do fluxo"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Pasta do Fluxo" required>
            <Select
            notFoundContent="Nenhuma pasta encontrada"
              placeholder="Selecione a pasta"
              value={selectedFlowFolder}
              onChange={(value) => setSelectedFlowFolder(value)}
              loading={folders.length === 0}
            >
              {folders.map((folder) => (
                <Option key={folder.id} value={folder.id}>
                  {folder.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para editar pasta */}
      <Modal
        title="Editar Pasta"
        visible={isEditModalVisible}
        onOk={handleSaveFolder}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingFolder(null);
        }}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form layout="vertical">
          <Form.Item label="Nome da Pasta" required>
            <Input
              placeholder="Digite o novo nome da pasta"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Setor" required>
            <Select
            notFoundContent="Nenhum setor encontrado"
              placeholder="Selecione o setor"
              value={editFolderSector}
              onChange={(value) => setEditFolderSector(value)}
              loading={sectors.length === 0}
            >
              {sectors.map((sector) => (
                <Option key={sector.id} value={sector.id}>
                  {sector.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        title={null}
        visible={isDeleting !== null}
        onCancel={() => setIsDeleting(null)}
        footer={null}
        centered
        className="custom-modal"
      >
        <div className="text-center">
          <p className="text-xl font-bold text-white">Deseja mesmo excluir?</p>
          <p className="text-md text-white mb-4">Essa ação é irreversível.</p>
          <div className="flex justify-center space-x-4">
            <Button
              type="primary"
              className="bg-white text-yellow-500 px-6 py-2 rounded-md"
              onClick={() => {
                if (isDeleting !== null) {
                  handleDeleteFolder(isDeleting);
                  setIsDeleting(null);
                }
              }}
            >
              Sim
            </Button>
            <Button onClick={() => setIsDeleting(null)}>Não</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FlowPage;