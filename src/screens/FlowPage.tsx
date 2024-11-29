// @ts-nocheck
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
  Empty,
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  FolderOutlined,
  EllipsisOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  FileAddOutlined,
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
  const [selectedSector, setSelectedSector] = useState<number | undefined>(
    SessionService.getSession('selectedSector')
  );
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
      setLoadingData(false);
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
    setSelectedFlowFolder(folderId);
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
      await updateFolder(
        editingFolder.id,
        { name: editFolderName, sectorId: editFolderSector },
        token
      );
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
      const newFlow = await createFlow({ name: newFlowName, folderId: selectedFlowFolder });
      message.success('Fluxo criado com sucesso!');
      setNewFlowName('');
      setSelectedFlowFolder(undefined);
      setIsAddFlowModalVisible(false);
      setSelectedFolderId(selectedFlowFolder);
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
      <h1 className="text-2xl md:text-3xl font-bold mb-10 text-center text-primary">
        Fluxos
      </h1>
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
  <h4 className="text-xl font-semibold mb-4 text-primary">Pastas</h4>

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
    <div className="flex flex-wrap mb-6">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className={`folder-card ${
            selectedFolderId === folder.id ? 'selected' : ''
          }`}
          onClick={() => handleFolderClick(folder.id)}
        >
          <Card
            hoverable
            className="folder-card-content"
            bodyStyle={{ padding: '16px' }}
            actions={[
              <Dropdown overlay={folderMenu(folder)} key="action">
                <EllipsisOutlined />
              </Dropdown>,
            ]}
          >
            <div className="folder-icon">
              {selectedFolderId === folder.id ? (
                <FolderOpenOutlined style={{ fontSize: '48px' }} />
              ) : (
                <FolderOutlined style={{ fontSize: '48px' }} />
              )}
            </div>
            <div
              className="folder-name"
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1890ff', // Azul para o nome da pasta
                textAlign: 'center',
              }}
            >
              {folder.name}
            </div>
          </Card>
        </div>
      ))}
      <div
        className="folder-card add-folder"
        onClick={handleAddFolder}
        style={{
          width: '150px', // Aumenta a largura
          height: '180px', // Aumenta a altura
          cursor: 'pointer',
        }}
      >
        <Card
          hoverable
          className="folder-card-content"
          bodyStyle={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
          style={{
            border: '2px dashed #1890ff', // Borda azul para destacar
          }}
        >
          <div className="folder-icon">
            <PlusOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
          </div>
          <div
            className="folder-name"
            style={{
              marginTop: '12px',
              fontSize: '18px', // Maior tamanho
              fontWeight: 'bold',
              color: '#1890ff', // Azul para o texto
              textAlign: 'center',
            }}
          >
            Nova Pasta
          </div>
        </Card>
      </div>
    </div>
  )}
</>

          )}

          {selectedSector != null && selectedFolderId !== null && (
            <>
              <h2 className="text-xl font-semibold mb-4 text-primary">Fluxos</h2>

              {flows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Empty description="Nenhum fluxo encontrado" />
                  <Button
                    type="dashed"
                    className="mt-4"
                    icon={<FileAddOutlined />}
                    onClick={handleAddFlow}
                  >
                    Novo Fluxo
                  </Button>
                </div>
              ) : (
                <Row gutter={[16, 16]}>
                  {Array.isArray(flows) &&
                    flows.map((flow: any) => (
                      <Col key={flow.id} xs={24} sm={12} md={8}>
                        <Card
                          className="flow-card"
                          actions={[
                            <EditOutlined
                              key="edit"
                              onClick={() => handleEditFlow(flow)}
                            />,
                            <DeleteOutlined
                              key="delete"
                              onClick={() => handleDeleteFlow(flow.id)}
                            />,
                          ]}
                        >
                          <div className="flow-card-header">
                            <h3>{flow.name}</h3>
                            <Switch
                              checked={flow.isActive}
                              onChange={() => handleToggleFlow(flow.id)}
                            />
                          </div>
                          <p className="text-gray-500">Versão: {flow.version}</p>
                          <div className="flow-stats">
                            <div>
                              <p>Execuções</p>
                              <p>{flow.exec ? flow.exec : 0}</p>
                            </div>
                            <div>
                              <p>CTR%</p>
                              <p>{flow.ctr ? flow.ctr : '0.00'}%</p>
                            </div>
                          </div>
                          <Button
                            type="primary"
                            block
                            onClick={() => handleEditFlowPath(flow)}
                          >
                            Editar Fluxo
                          </Button>
                        </Card>
                      </Col>
                    ))}
                  <Col xs={24} sm={12} md={8}>
                    <Card
                      hoverable
                      className="flow-card add-flow"
                      onClick={handleAddFlow}
                    >
                      <div className="add-flow-content">
                        <PlusOutlined style={{ fontSize: '48px' }} />
                        <p>Novo Fluxo</p>
                      </div>
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
        title="Confirmação"
        visible={isDeleting !== null}
        onCancel={() => setIsDeleting(null)}
        onOk={() => {
          if (isDeleting !== null) {
            handleDeleteFolder(isDeleting);
            setIsDeleting(null);
          }
        }}
        okText="Sim"
        cancelText="Não"
      >
        <p>Deseja mesmo excluir esta pasta? Essa ação é irreversível.</p>
      </Modal>

      {/* Estilos personalizados */}
      <style jsx>{`
        .text-primary {
          color: #1890ff;
        }
        .folder-card {
          width: 120px;
          margin: 8px;
          cursor: pointer;
        }
        .folder-card-content {
          text-align: center;
          border: ${selectedFolderId ? '1px solid #1890ff' : '1px solid #f0f0f0'};
        }
        .folder-card.selected .folder-card-content {
          border-color: #1890ff;
          box-shadow: 0 0 8px rgba(24, 144, 255, 0.6);
        }
        .folder-icon {
          margin-bottom: 8px;
        }
        .folder-name {
          font-weight: bold;
        }
        .folder-card.add-folder .folder-card-content {
          border-style: dashed;
        }
        .flow-card {
          border-radius: 8px;
        }
        .flow-card .flow-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .flow-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
        }
        .add-flow-content {
          text-align: center;
          padding: 32px 0;
        }
        .add-flow-content p {
          margin-top: 8px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default FlowPage;
