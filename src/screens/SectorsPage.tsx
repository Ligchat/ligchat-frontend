import React, { useState, useEffect } from 'react';
import {
  Card, Button, Input, Row, Col, Drawer, Modal, message, Skeleton,
} from 'antd';
import {
  DeleteOutlined, EditOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  createSector, updateSector, deleteSector, getSectors,
} from '../services/SectorService';
import SessionService from '../services/SessionService';
import OpeningHoursCard, { DayOfWeek } from './OpeningHoursCard';
import { BusinessHourInterface, createBusinessHour, getBusinessHoursBySectorId } from '../services/BusinessHourService';
import LoadingOverlay from '../components/LoadingOverlay';

const { TextArea } = Input;

interface Sector {
  id?: number;
  name: string;
  userBusinessId?: number;
  phoneNumberId: string;
  accessToken: string;
  description: string;
  openingHours?: BusinessHourInterface[];
}

interface OpeningHours {
  [key: string]: BusinessHourInterface;
}

const SectorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [editingSectorId, setEditingSectorId] = useState<number | null>(null);
  const [newSector, setNewSector] = useState<boolean>(false);
  const [sectorData, setSectorData] = useState<Sector>({
    name: '',
    phoneNumberId: '',
    accessToken: '',
    description: '',
  });
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const [isHoursDrawerVisible, setIsHoursDrawerVisible] = useState<boolean>(false);
  const [currentSector, setCurrentSector] = useState<Sector | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHours>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSectors();
  }, []);

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

  const fetchBusinessHours = async (sectorId: number) => {
    try {
      const businessHours = await getBusinessHoursBySectorId(sectorId);
  
      // Se businessHours for null ou não for um array, inicializa como um array vazio
      const validBusinessHours = Array.isArray(businessHours) ? businessHours : [];
  
      if (validBusinessHours.length === 0) {
        console.warn(`Nenhum horário encontrado para o setor ${sectorId}. Usando horários padrão.`);
      }
  
      const hoursObject: OpeningHours = {};
      const daysOfWeek: DayOfWeek[] = [
        'domingo',
        'segunda-feira',
        'terça-feira',
        'quarta-feira',
        'quinta-feira',
        'sexta-feira',
        'sábado',
      ];
  
      daysOfWeek.forEach((day) => {
        const hour = validBusinessHours.find((bh: BusinessHourInterface) => bh.dayOfWeek === day);
        if (hour) {
          hoursObject[day] = hour; // Adiciona o horário existente
        } else {
          // Mock padrão para dias que não existem no banco
          hoursObject[day] = {
            dayOfWeek: day,
            openingTime: '09:00 AM',
            closingTime: '05:00 PM',
            isOpen: false, // Todos os mocks vão estar desativados
            sectorId: sectorId,
          };
        }
      });
  
      setOpeningHours(hoursObject);
    } catch (error: unknown) {
      // Casting para ApiError
      const apiError = error as any;
  
      if (apiError.response && apiError.response.status === 404) {
        console.warn('Erro 404: Horários não encontrados para este setor.');
        // Aqui você pode definir um estado específico ou realizar alguma ação
      } else {
        console.error('Falha ao buscar horários de funcionamento', apiError);
      }
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
    });
    setNewSector(false);
    setIsDrawerVisible(true);
  };

  const showHoursDrawer = (sector: Sector) => {
    setCurrentSector(sector);
    fetchBusinessHours(sector.id || 0);
    setIsHoursDrawerVisible(true);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    setCurrentSector(null);
    setSectorData({
      name: '',
      phoneNumberId: '',
      accessToken: '',
      description: '',
    });
    setErrors({});
  };

  const closeHoursDrawer = () => {
    setIsHoursDrawerVisible(false);
    setOpeningHours({});
  };

  const handleTimeChange = (day: DayOfWeek, type: 'open' | 'close', time: string) => {
    const updatedHours = {
      ...openingHours,
      [day]: {
        ...openingHours[day],
        ...(type === 'open' ? { openingTime: time } : { closingTime: time }),
        dayOfWeek: day,
        sectorId: currentSector?.id || 0,
        isOpen: openingHours[day]?.isOpen || false,
      },
    };
    setOpeningHours(updatedHours);
    saveBusinessHour(updatedHours[day]);
  };

  const handleSwitchChange = (day: DayOfWeek, checked: boolean) => {
    const updatedHours = {
      ...openingHours,
      [day]: {
        ...openingHours[day],
        isOpen: checked,
        dayOfWeek: day,
        sectorId: currentSector?.id || 0,
        openingTime: openingHours[day]?.openingTime || '09:00 AM',
        closingTime: openingHours[day]?.closingTime || '05:00 PM',
      },
    };
    setOpeningHours(updatedHours);
    saveBusinessHour(updatedHours[day]);
  };

  const saveBusinessHour = async (businessHour: BusinessHourInterface) => {
    try {
      await createBusinessHour(businessHour);
    } catch (error) {
      console.error('Erro ao salvar horário de funcionamento:', error);
    }
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
        setEditingSectorId(null);
        setNewSector(false);
        setSectorData({
          name: '',
          phoneNumberId: '',
          accessToken: '',
          description: '',
        });
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
    });
    setErrors({});
  };

  const handleEditSector = (sector: Sector) => {
    showDrawer(sector);
  };
  return (
    <div className="p-8">
      {isLoading && <LoadingOverlay />}

      <h1 className="text-3xl font-bold mb-6">Gerenciar Setores</h1>
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
                <p><strong>Descrição:</strong> {sector.description}</p>
                <p><strong>Identificação do Telefone:</strong> {sector.phoneNumberId}</p>
                <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><strong>Token de Acesso:</strong> {sector.accessToken}</p>
              </Skeleton>
              <Button className="bg-blue-500 text-white w-full" onClick={() => showHoursDrawer(sector)} disabled={isLoading}>
                Horário de funcionamento
              </Button>
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
              <h3 className="text-lg font-semibold mb-2">Nome do Setor</h3>
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

              <h3 className="text-lg font-semibold mb-2">Configuração da Meta</h3>
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
        <h3 className="text-lg font-semibold mb-2">Nome do Setor</h3>
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

        <h3 className="text-lg font-semibold mb-2">Configuração da Meta</h3>
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

        <TextArea
          rows={5}
          placeholder="Token de acesso"
          value={sectorData.accessToken}
          onChange={(e) => setSectorData({ ...sectorData, accessToken: e.target.value })}
          style={{
            marginBottom: '10px',
            borderColor: errors.accessToken ? 'red' : undefined,
            maxWidth: '100%',
            whiteSpace: 'normal',
          }}
          disabled={isLoading}
        />
        {errors.accessToken && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.accessToken}</p>}

        <Button className="mt-4" type="primary" onClick={handleSave} disabled={isLoading}>
          Salvar
        </Button>
        <Button className="mt-4 ml-2" onClick={closeDrawer} disabled={isLoading}>
          Cancelar
        </Button>
      </Drawer>

      <Drawer
        title={`Horário de Funcionamento - ${currentSector?.name}`}
        placement="right"
        onClose={closeHoursDrawer}
        visible={isHoursDrawerVisible}
        width={400}
      >
        {openingHours && (
          <Row gutter={[16, 16]}>
            {Object.keys(openingHours).map((day) => (
              <OpeningHoursCard
                key={day}
                day={day as DayOfWeek}
                times={openingHours[day]}
                onTimeChange={handleTimeChange}
                onSwitchChange={handleSwitchChange}
              />
            ))}
          </Row>
        )}
      </Drawer>
    </div>
  );
};

export default SectorsPage;
