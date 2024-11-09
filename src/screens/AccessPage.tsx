import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Switch, Row, Col, Modal, Input, Skeleton } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { createUser, updateUser, getAllUsers, deleteUser } from '../services/UserService';
import { getSectors, Sector } from '../services/SectorService';
import SessionService from '../services/SessionService';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '../components/LoadingOverlay';

const { Option } = Select;

interface Person {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  isDeleting: boolean;
  phoneWhatsapp: string;
  isAdmin?: boolean;
  status: boolean;
  sectors: string[];
}

const AccessPage: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [newPerson, setNewPerson] = useState<Person>({
    id: '',
    name: '',
    email: '',
    phoneWhatsapp: '',
    enabled: true,
    isDeleting: false,
    isAdmin: false,
    status: true,
    sectors: [],
  });
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAvatarLoading, setIsAvatarLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const token = SessionService.getSession('authToken');
  const decodedToken = token ? SessionService.decodeToken(token) : null;
  const userId = Number(decodedToken.userId);
  const [invitedBy, setInvitedBy] = useState<number>(userId); // Estado para armazenar o ID do convidador

  const fetchSectors = async () => {
    try {
      setIsLoading(true);
      const tokenFromSession = SessionService.getSession('authToken');
      const response: any = await getSectors(tokenFromSession);
      const sectorsData = Array.isArray(response.data) ? response.data : [];
      setSectors(sectorsData);
    } catch (error) {
      console.error('Failed to fetch sectors', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUsers = async (sectorsList: Sector[]) => {
    try {
      setIsLoading(true);
      const users: any = await getAllUsers(userId);
      const updatedPeople = users.data.map((user: any) => {
        const userSectors = user.sectors.length > 0
          ? user.sectors
              .map((sectorId: string) => {
                const sector = sectorsList.find((s) => s.id === Number(sectorId));
                return sector ? sector.name : null;
              })
              .filter((sectorName: string | null) => sectorName !== null)
              .join(", ")
          : "Não definido";
  
        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          enabled: user.enabled,
          phoneWhatsapp: user.phoneWhatsapp,
          isDeleting: false,
          isAdmin: user.isAdmin || false,
          status: user.status !== undefined ? user.status : true,
          sectors: userSectors,
        };
      });
      setPeople(updatedPeople);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
      setIsAvatarLoading(false);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);
  
  useEffect(() => {
    if (sectors.length > 0) {
      fetchUsers(sectors);
    }
  }, [sectors]);

  const refreshUsers = async () => {
    try {
      setIsLoading(true);
      await fetchUsers(sectors);
    } catch (error) {
      console.error('Failed to refresh users', error);
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleEditPerson = (person: Person) => {
    setEditingPerson({ ...person });
    setIsAdmin(person.isAdmin || false);
    setSelectedSectors(person.sectors || []);
  };

  const handleSavePerson = async () => {
    if (editingPerson) {
      try {
        setIsLoading(true);

        const sectorsToUpdate = Array.isArray(selectedSectors) ? selectedSectors.map((sectorId) => {
          const sector = sectors.find((s) => s.id === Number(sectorId)); // Convert sectorId to number
          return {
            Id: sector?.id,
            IsShared: true,  // Define whether the sector is shared
          };
        }) : [];

        const updatedUser: any = {
          name: editingPerson.name,
          email: editingPerson.email,
          avatarUrl: '',  // Assuming you have a logic for avatar
          phoneWhatsapp: editingPerson.phoneWhatsapp,
          isAdmin: isAdmin,
          status: editingPerson.status,
          sectors: sectorsToUpdate,  // Now sending an array of SectorDTO
          invitedBy: invitedBy,
        };

        await updateUser(Number(editingPerson.id), updatedUser);
        setEditingPerson(null);
        setSelectedSectors([]);
        await refreshUsers();
      } catch (error) {
        console.error('Failed to update user', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeletePerson = async (personId: string) => {
    try {
      setIsLoading(true);
      await deleteUser(personId);
      await refreshUsers();
    } catch (error) {
      console.error('Failed to delete user', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeleteMode = (personId: string, isDeleting: boolean) => {
    const updatedPeople = people.map((person) =>
      person.id === personId ? { ...person, isDeleting } : person
    );
    setPeople(updatedPeople);
  };

  const handleCancelEdit = () => {
    setEditingPerson(null);
    setSelectedSectors([]);
  };

  const handleAddPerson = async () => {
    try {
      setIsLoading(true);

      // Criar um array de objetos com id e is_shared para enviar
      const sectorsToUpdate = selectedSectors.map((sectorId) => {
        const sector = sectors.find((s) => s.id === Number(sectorId)); // Convert sectorId to number
        return {
          Id: sector?.id,
          IsShared: true,  // Define whether the sector is shared
        };
      });

      const newUser: any = {
        name: newPerson.name,
        email: newPerson.email,
        avatarUrl: '',  // Assuming you have a logic for avatar
        phoneWhatsapp: '',
        isAdmin: isAdmin,
        status: newPerson.status,
        sectors: sectorsToUpdate,  // Now sending an array of SectorDTO
        invitedBy: invitedBy, // Pass the ID of the inviter if available
      };

      await createUser(newUser);
      setIsAddModalVisible(false);
      setNewPerson({
        id: '',
        name: '',
        email: '',
        phoneWhatsapp: '',
        enabled: true,
        isDeleting: false,
        isAdmin: false,
        status: true,
        sectors: [],
      });
      setSelectedSectors([]);
      setIsAdmin(false);
      await refreshUsers();
    } catch (error) {
      console.error('Failed to create user', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      {isLoading && <LoadingOverlay />}

      <h1 style={{color: '#1890ff'}} className="text-3xl font-bold mb-6">Acessos</h1>
      <Row gutter={[16, 16]}>
        {people.map((person) => (
          <Col xs={24} sm={12} md={8} key={person.id}>
            <Card
              title={person.isDeleting ? null : person.name}
              extra={
                editingPerson?.id === person.id ? (
                  <div className="flex space-x-2">
                    <Button type="primary" onClick={handleSavePerson} disabled={isLoading}>
                      Salvar
                    </Button>
                    <Button onClick={handleCancelEdit} disabled={isLoading}>Cancelar</Button>
                  </div>
                ) : !person.isDeleting ? (
                  <div className="flex space-x-2">
                    <EditOutlined onClick={() => handleEditPerson(person)} className="text-blue-500 cursor-pointer" />
                    <DeleteOutlined onClick={() => toggleDeleteMode(person.id, true)} className="text-red-500 cursor-pointer" />
                  </div>
                ) : null
              }
              className="shadow-md rounded-lg"
            >
              {person.isDeleting ? (
                <div className="text-center bg-yellow-400 p-4 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Deseja mesmo excluir?</h3>
                  <p className="mb-4">Essa ação é irreversível.</p>
                  <div className="flex justify-around">
                    <Button onClick={() => toggleDeleteMode(person.id, false)} className="border-blue-500 text-blue-500">
                      Não
                    </Button>
                    <Button type="primary" onClick={() => handleDeletePerson(person.id)} disabled={isLoading}>
                      Sim
                    </Button>
                  </div>
                </div>
              ) : editingPerson?.id === person.id ? (
                <>
                  <Input
                    placeholder="Nome do Usuário"
                    value={editingPerson.name}
                    onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                    className="mb-4"
                    disabled={isLoading}
                  />
                  <Input
                    placeholder="Email"
                    value={editingPerson.email}
                    onChange={(e) => setEditingPerson({ ...editingPerson, email: e.target.value })}
                    className="mb-4"
                    disabled={isLoading}
                  />
                  <Select
                    mode="multiple"
                    placeholder="Selecione os setores"
                    className="mb-4 w-full"
                    onChange={setSelectedSectors}
                    disabled={isLoading}
                    value={selectedSectors}
                  >
                    {sectors.map((sector) => (
                      <Option key={sector.id} value={sector.id}>
                        {sector.name}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    notFoundContent="Nenhum acesso encontrado"
                    value={isAdmin ? "Administrador" : "Colaborador"}
                    className="mb-4 w-full"
                    onChange={(value) => setIsAdmin(value === 'Administrador')}
                    disabled={isLoading}
                  >
                    <Option value="Colaborador">Colaborador</Option>
                    <Option value="Administrador">Administrador</Option>
                  </Select>
                  <Switch
                    checked={editingPerson.status}
                    onChange={(checked) => setEditingPerson({ ...editingPerson, status: checked })}
                    disabled={isLoading}
                    checkedChildren="Ativo"
                    unCheckedChildren="Inativo"
                    className="mb-4"
                  />
                </>
              ) : (
                <>
                  {isAvatarLoading ? (
                    <Skeleton active />
                  ) : (
                    <>
                      <p className="text-gray-500">
                        <strong>Email:</strong> {person.email}
                      </p>
                      <p className="text-gray-500">
                        <strong>Nível de Acesso:</strong> {person.isAdmin ? "Administrador" : "Colaborador"}
                      </p>
                      <p className="text-gray-500">
                      <strong>Setores:</strong> {person.sectors}
                      </p>
                      <Switch
                        checked={person.status}
                        disabled
                        checkedChildren="Ativo"
                        unCheckedChildren="Inativo"
                      />
                    </>
                  )}
                </>
              )}
            </Card>
          </Col>
        ))}

        <Col xs={24} sm={12} md={8}>
          <Card
            className="flex items-center justify-center cursor-pointer shadow-md rounded-lg"
            onClick={() => setIsAddModalVisible(true)}
          >
            <PlusOutlined className="text-blue-500 text-3xl" />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Adicionar Novo Usuário"
        visible={isAddModalVisible}
        onOk={handleAddPerson}
        onCancel={() => setIsAddModalVisible(false)}
        okText="Adicionar"
        cancelText="Cancelar"
        confirmLoading={isLoading}
      >
        <Input
          placeholder="Nome do Usuário"
          value={newPerson.name}
          onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
          className="mb-4"
          disabled={isLoading}
        />
        <Input
          placeholder="Email"
          value={newPerson.email}
          onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
          className="mb-4"
          disabled={isLoading}
        />
        <Select
          mode="multiple"
          placeholder="Selecione os setores"
          className="mb-4 w-full"
          onChange={setSelectedSectors}
          disabled={isLoading}
          value={selectedSectors}
        >
          {sectors.map((sector) => (
            <Option key={sector.id} value={sector.id}>
              {sector.name}
            </Option>
          ))}
        </Select>
        <Select
          notFoundContent="Nenhum acesso encontrado"
          defaultValue="Colaborador"
          className="mb-4 w-full"
          onChange={(value) => setIsAdmin(value === 'Administrador')}
          disabled={isLoading}
        >
          <Option value="Colaborador">Colaborador</Option>
          <Option value="Administrador">Administrador</Option>
        </Select>
        <Switch
          checked={newPerson.status}
          onChange={(checked) => setNewPerson({ ...newPerson, status: checked })}
          checkedChildren="Ativo"
          unCheckedChildren="Inativo"
          className="mb-4"
        />
      </Modal>
    </div>
  );
};

export default AccessPage;
