import React, { useState, useEffect } from 'react';
import {
  Card, Button, Input, Row, Col, Drawer, Modal, Skeleton,
} from 'antd';
import {
  DeleteOutlined, EditOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  createSector, updateSector, deleteSector, getSectors,
} from '../services/SectorService';
import SessionService from '../services/SessionService';
import LoadingOverlay from '../components/LoadingOverlay';
import axios from 'axios';
import { validateMetaCredentials } from '../services/MetaValidationService';

const { TextArea } = Input;

interface Sector {
  id?: number;
  name: string;
  userBusinessId?: number;
  phoneNumberId: string;
  accessToken: string;
  description: string;
  googleClientId?: string;
  googleApiKey?: string;
}

const SectorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [newSector, setNewSector] = useState<boolean>(false);
  const [sectorData, setSectorData] = useState<Sector>({
    name: '',
    phoneNumberId: '',
    accessToken: '',
    description: '',
    googleClientId: '',
    googleApiKey: '',
  });
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const [currentSector, setCurrentSector] = useState<Sector | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSectors();
  }, []);

  // Função auxiliar para fazer a chamada à API do Google
  const makeGoogleApiRequest = async (googleClientId: string, googleApiKey: string) => {
    try {
      // Exemplo de chamada genérica à API do Google
      const response = await axios.get('https://www.googleapis.com/someapi/v1/resource', {
        params: {
          key: googleApiKey,
          client_id: googleClientId,
          // Outros parâmetros necessários pela API específica
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao chamar a API do Google:', error);
      throw error;
    }
  };

  const fetchSectors = async () => {
    try {
      setIsLoading(true);
      const token = SessionService.getSession('authToken');
      const response: any = await getSectors(token);
      const fetchedSectors: Sector[] = response?.data || [];
      setSectors(fetchedSectors);
    } catch (error) {
      console.error('Falha ao buscar setores', error);
      setSectors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const showDrawer = (sector: Sector) => {
    setCurrentSector(sector);
    setSectorData({
      id: sector.id,
      name: sector.name,
      phoneNumberId: sector.phoneNumberId,
      accessToken: sector.accessToken,
      description: sector.description,
      googleClientId: sector.googleClientId || '',
      googleApiKey: sector.googleApiKey || '',
    });
    setNewSector(false);
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    setCurrentSector(null);
    setSectorData({
      name: '',
      phoneNumberId: '',
      accessToken: '',
      description: '',
      googleClientId: '',
      googleApiKey: '',
    });
    setErrors({});
  };

  const handleSave = async () => {
    let validationErrors: { [key: string]: string } = {};
  
    if (!sectorData.name) {
      validationErrors.name = 'O nome do setor é obrigatório.';
    }
    if (!sectorData.phoneNumberId) {
      validationErrors.phoneNumberId = 'A identificação do telefone é obrigatória.';
    }
    if (!sectorData.accessToken) {
      validationErrors.accessToken = 'O token de acesso é obrigatório.';
    }
    if (!sectorData.description) {
      validationErrors.description = 'A descrição é obrigatória.';
    }
  
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    } else {
      setErrors({});
    }
  
    try {
      const validationResult = await validateMetaCredentials(sectorData.accessToken, sectorData.phoneNumberId);
  
      if (validationResult.message !== 'Token e phone_id são válidos.') {
        setErrors({
          ...validationErrors,
          accessToken: 'Token ou id da telefone inválido.',
        });
        return;
      }
  
      setIsLoading(true);
      const token = SessionService.getSession('authToken');
      const decodedToken = token ? SessionService.decodeToken(token) : null;
      const userBusinessId = decodedToken ? decodedToken.userId : null;
  
      if (userBusinessId) {
        const updatedSectorData: Sector = {
          ...sectorData,
          userBusinessId,
        };
  
        if (newSector) {
          await createSector(updatedSectorData);
        } else if (updatedSectorData.id) {
          await updateSector(updatedSectorData.id, updatedSectorData);
        }
  
        await fetchSectors();
        setNewSector(false);
        closeDrawer();
      } else {
        console.error('Erro ao obter userBusinessId do token.');
      }
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = async (id?: number) => {
    if (!id) return;
    Modal.confirm({
      title: 'Tem certeza que deseja excluir este setor?',
      content: 'Esta ação não pode ser desfeita.',
      onOk: async () => {
        try {
          setIsLoading(true);
          await deleteSector(id);
          setSectors((prevSectors) => prevSectors.filter((sector) => sector.id !== id));
        } catch (error) {
          console.error('Falha ao excluir setor:', error);
        } finally {
          setIsLoading(false);
        }
      },
      onCancel() {
        console.log('Cancelado');
      },
    });
  };

  const handleAddSector = () => {
    setNewSector(true);
    setSectorData({
      name: '',
      phoneNumberId: '',
      accessToken: '',
      description: '',
      googleClientId: '',
      googleApiKey: '',
    });
    setErrors({});
  };

  const handleEditSector = (sector: Sector) => {
    showDrawer(sector);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    } else {
      return text;
    }
  };

  return (
    <div className="p-8">
      {isLoading && <LoadingOverlay />}

      <h1 className="text-3xl font-bold mb-6" style={{ color: '#1890ff' }}>Gerenciar Setores</h1>
      <Row gutter={[16, 16]}>
        {sectors.map((sector) => (
          <Col xs={24} sm={12} md={8} key={sector.id}>
            <Card
              title={sector.name}
              extra={
                <div className="flex space-x-2">
                  <EditOutlined className="text-blue-500 cursor-pointer" onClick={() => handleEditSector(sector)} />
                  <DeleteOutlined className="text-red-500 cursor-pointer" onClick={() => handleDeleteClick(sector.id)} />
                </div>
              }
            >
              <Skeleton active loading={isLoading}>
                <p><strong>Descrição:</strong> {truncateText(sector.description, 50)}</p>
                <h4 style={{ color: '#1890ff', marginTop: '10px' }}>Configuração da Meta</h4>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <p><strong>Identificação do Telefone:</strong> {sector.phoneNumberId}</p>
                  <p><strong>Token de Acesso:</strong> {truncateText(sector.accessToken, 50)}</p>
                </div>
                <h4 style={{ color: '#1890ff', marginTop: '10px' }}>Configuração do Google</h4>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <p><strong>Google Client ID:</strong> {sector.googleClientId ? sector.googleClientId : 'Não definido'}</p>
                  <p><strong>Google API Key:</strong> {sector.googleApiKey ? sector.googleApiKey : 'Não definido'}</p>
                </div>
              </Skeleton>
            </Card>
          </Col>
        ))}
        {!newSector && (
          <Col xs={24} sm={12} md={8}>
            <Card
              className="flex items-center justify-center cursor-pointer shadow-md rounded-lg"
              onClick={handleAddSector}
            >
              <PlusOutlined className="text-blue-500 text-3xl" />
            </Card>
          </Col>
        )}
        {newSector && (
          <Col xs={24} sm={12} md={8}>
            <Card>
              <h3 style={{color: '#1890ff'}} className="text-lg font-semibold">Nome do Setor</h3>
              <label style={{ marginBottom: '5px', marginTop: '50px' }}>Nome do setor</label>
              <Input
                placeholder="Nome do setor"
                value={sectorData.name}
                onChange={(e) => setSectorData({ ...sectorData, name: e.target.value })}
                style={{
                  marginBottom: '10px',
                  borderColor: errors.name ? 'red' : undefined,
                  maxWidth: '100%',
                }}
                disabled={isLoading}
              />
              {errors.name && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.name}</p>}

              <label style={{ marginBottom: '5px', marginTop: '10px' }}>Descrição</label>
              <TextArea
                rows={2}
                placeholder="Descrição"
                value={sectorData.description}
                onChange={(e) => setSectorData({ ...sectorData, description: e.target.value })}
                style={{
                  marginBottom: '10px',
                  resize: 'none',
                  borderColor: errors.description ? 'red' : undefined,
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
                disabled={isLoading}
              />
              {errors.description && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.description}</p>}

              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1890ff', marginTop: '10px' }}>Configuração da Meta</h3>
              <label style={{ marginBottom: '5px', marginTop: '10px' }}>Identificação do telefone</label>
              <Input
                placeholder="Identificação do telefone"
                value={sectorData.phoneNumberId}
                onChange={(e) => setSectorData({ ...sectorData, phoneNumberId: e.target.value })}
                style={{
                  marginBottom: '10px',
                  borderColor: errors.phoneNumberId ? 'red' : undefined,
                  maxWidth: '100%',
                }}
                disabled={isLoading}
              />
              {errors.phoneNumberId && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.phoneNumberId}</p>}

              <label style={{ marginBottom: '5px', marginTop: '10px' }}>Token de acesso</label>
              <TextArea
                rows={2}
                placeholder="Token de acesso"
                value={sectorData.accessToken}
                onChange={(e) => setSectorData({ ...sectorData, accessToken: e.target.value })}
                style={{
                  marginBottom: '10px',
                  borderColor: errors.accessToken ? 'red' : undefined,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  whiteSpace: 'normal',
                }}
                disabled={isLoading}
              />
              {errors.accessToken && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.accessToken}</p>}

              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1890ff', marginTop: '10px' }}>Configuração do Google</h3>
              <label style={{ marginBottom: '5px', marginTop: '10px' }}>Google Client ID</label>
              <Input
                placeholder="Google Client ID"
                value={sectorData.googleClientId}
                onChange={(e) => setSectorData({ ...sectorData, googleClientId: e.target.value })}
                style={{
                  marginBottom: '10px',
                  borderColor: errors.googleClientId ? 'red' : undefined,
                  maxWidth: '100%',
                }}
                disabled={isLoading}
              />
              {errors.googleClientId && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.googleClientId}</p>}

              <label style={{ marginBottom: '5px', marginTop: '10px' }}>Google API Key</label>
              <Input
                placeholder="Google API Key"
                value={sectorData.googleApiKey}
                onChange={(e) => setSectorData({ ...sectorData, googleApiKey: e.target.value })}
                style={{
                  marginBottom: '10px',
                  borderColor: errors.googleApiKey ? 'red' : undefined,
                  maxWidth: '100%',
                }}
                disabled={isLoading}
              />
              {errors.googleApiKey && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.googleApiKey}</p>}

              <Button className="mt-4" type="primary" onClick={handleSave} disabled={isLoading}>
                Salvar
              </Button>
              <Button className="mt-4 ml-2" onClick={() => setNewSector(false)} disabled={isLoading}>
                Cancelar
              </Button>
            </Card>
          </Col>
        )}
      </Row>

      <Drawer
        title={currentSector?.name}
        placement="right"
        onClose={closeDrawer}
        visible={isDrawerVisible}
        width={400}
      >
        <label style={{ marginBottom: '10px', marginTop: '10px' }}>Nome do setor</label>
        <Input
          placeholder="Nome do setor"
          value={sectorData.name}
          onChange={(e) => setSectorData({ ...sectorData, name: e.target.value })}
          style={{
            marginTop: 10,
            marginBottom: '10px',
            borderColor: errors.name ? 'red' : undefined,
            maxWidth: '100%',
          }}
          disabled={isLoading}
        />
        {errors.name && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.name}</p>}

        <label style={{ marginBottom: '5px', marginTop: '10px' }}>Descrição</label>
        <TextArea
          rows={2}
          placeholder="Descrição"
          value={sectorData.description}
          onChange={(e) => setSectorData({ ...sectorData, description: e.target.value })}
          style={{
            marginTop: 10,
            marginBottom: '10px',
            resize: 'none',
            borderColor: errors.description ? 'red' : undefined,
            maxWidth: '100%',
            overflow: 'hidden',
          }}
          disabled={isLoading}
        />
        {errors.description && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.description}</p>}

        <h3 className="text-lg font-semibold mb-2" style={{ color: '#1890ff', marginTop: '10px' }}>Configuração da Meta</h3>
        <label style={{ marginBottom: '5px', marginTop: '10px' }}>Identificação do telefone</label>
        <Input
          placeholder="Identificação do telefone"
          value={sectorData.phoneNumberId}
          onChange={(e) => setSectorData({ ...sectorData, phoneNumberId: e.target.value })}
          style={{
            marginTop: 10,
            marginBottom: '10px',
            borderColor: errors.phoneNumberId ? 'red' : undefined,
            maxWidth: '100%',
          }}
          disabled={isLoading}
        />
        {errors.phoneNumberId && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.phoneNumberId}</p>}

        <label style={{ marginBottom: '5px', marginTop: '10px' }}>Token de acesso</label>
        <TextArea
          rows={5}
          placeholder="Token de acesso"
          value={sectorData.accessToken}
          onChange={(e) => setSectorData({ ...sectorData, accessToken: e.target.value })}
          style={{
            marginTop: 10,
            marginBottom: '10px',
            borderColor: errors.accessToken ? 'red' : undefined,
            maxWidth: '100%',
            whiteSpace: 'normal',
          }}
          disabled={isLoading}
        />
        {errors.accessToken && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.accessToken}</p>}

        <h3 className="text-lg font-semibold mb-2" style={{ color: '#1890ff', marginTop: '10px' }}>Configuração do Google</h3>
        <label style={{ marginBottom: '5px', marginTop: '10px' }}>Google Client ID</label>
        <Input
          placeholder="Google Client ID"
          value={sectorData.googleClientId}
          onChange={(e) => setSectorData({ ...sectorData, googleClientId: e.target.value })}
          style={{
            marginTop: 10,
            marginBottom: '10px',
            borderColor: errors.googleClientId ? 'red' : undefined,
            maxWidth: '100%',
          }}
          disabled={isLoading}
        />
        {errors.googleClientId && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.googleClientId}</p>}

        <label style={{ marginBottom: '5px', marginTop: '10px' }}>Google API Key</label>
        <Input
          placeholder="Google API Key"
          value={sectorData.googleApiKey}
          onChange={(e) => setSectorData({ ...sectorData, googleApiKey: e.target.value })}
          style={{
            marginTop: 10,
            marginBottom: '10px',
            borderColor: errors.googleApiKey ? 'red' : undefined,
            maxWidth: '100%',
          }}
          disabled={isLoading}
        />
        {errors.googleApiKey && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.googleApiKey}</p>}

        <Button className="mt-4" type="primary" onClick={handleSave} disabled={isLoading}>
          Salvar
        </Button>
        <Button className="mt-4 ml-2" onClick={closeDrawer} disabled={isLoading}>
          Cancelar
        </Button>
      </Drawer>
    </div>
  );
};

export default SectorsPage;
