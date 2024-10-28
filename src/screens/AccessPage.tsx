import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Switch, Row, Col, Modal, Input, Skeleton } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { createUser, updateUser, UserCreate, getAllUsers, deleteUser } from '../services/UserService';
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
  phoneWhatsapp:string;
  isAdmin?: boolean;
  status: boolean; // Adiciona a propriedade status
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
    phoneWhatsapp:'',
    enabled: true,
    isDeleting: false,
    isAdmin: false,
    status: true, // Incluir status por padrão como ativo
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAvatarLoading, setIsAvatarLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const tokenFromSession = SessionService.getSession('authToken');
        const response: any = await getSectors(tokenFromSession);
        setSectors(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch sectors', error);
      }
    };

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const users: any = await getAllUsers();
        const updatedPeople = users.data.map((user: any) => {
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            enabled: user.enabled,
            phoneWhatsapp: user.phoneWhatsapp,
            isDeleting: false,
            isAdmin: user.isAdmin || false,
            status: user.status !== undefined ? user.status : true, // Certifique-se de que status é booleano
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

    fetchSectors();
    fetchUsers();
  }, []);

  const refreshUsers = async () => {
    try {
      setIsLoading(true);
      const users: any = await getAllUsers();
      const updatedPeople = users.data.map((user: any) => {
        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          enabled: user.enabled,
          isDeleting: false,
          isAdmin: user.isAdmin || false,
          status: user.status !== undefined ? user.status : true, // Certifique-se de que status é booleano
        };
      });
      setPeople(updatedPeople);
    } catch (error) {
      console.error('Failed to refresh users', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson({ ...person });
    setIsAdmin(person.isAdmin || false);
  };

  const handleSavePerson = async () => {
    if (editingPerson) {
      try {
        setIsLoading(true);
        const updatedUser: UserCreate = {
          name: editingPerson.name,
          email: editingPerson.email,
          phoneWhatsapp: editingPerson.phoneWhatsapp,
          isAdmin: isAdmin,
          status: editingPerson.status, // Incluir o status aqui
        };

        await updateUser(Number(editingPerson.id), updatedUser);
        setEditingPerson(null);
        await refreshUsers(); // Atualiza a lista de usuários após a edição
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
      await refreshUsers(); // Atualiza a lista de usuários após a exclusão
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
  };

  const handleAddPerson = async () => {
    try {
      setIsLoading(true);
      const newUser: UserCreate = {
        name: newPerson.name,
        email: newPerson.email,
        phoneWhatsapp: '',
        isAdmin: isAdmin,
        status: newPerson.status, // Adiciona status ao novo usuário
      };

      await createUser(newUser);
      setIsAddModalVisible(false);
      setNewPerson({
        id: '',
        name: '',
        email: '',
        phoneWhatsapp:'',
        enabled: true,
        isDeleting: false,
        isAdmin: false,
        status: true, // Reseta status para o valor padrão
      });
      setIsAdmin(false);
      await refreshUsers(); // Atualiza a lista de usuários após a adição
    } catch (error) {
      console.error('Failed to create user', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      {isLoading && <LoadingOverlay />}

      <h1 className="text-3xl font-bold mb-6">Acessos</h1>
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
                  notFoundContent="Nenhum acesso encontrado"
                    value={isAdmin ? "Administrador" : "Colaborador"}
                    className="mb-4 w-full" // Setar width 100%
                    onChange={(value) => setIsAdmin(value === 'Administrador')}
                    disabled={isLoading}
                  >
                    <Option value="Colaborador">Colaborador</Option>
                    <Option value="Administrador">Administrador</Option>
                  </Select>
                  <Switch
                    checked={editingPerson.status} // Controla o estado ativo/inativo
                    onChange={(checked) => setEditingPerson({ ...editingPerson, status: checked })} // Atualiza status ao mudar
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
                      <Switch
                        checked={person.status} // Exibe se o usuário está ativo ou inativo
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
        notFoundContent="Nenhum acesso encontrado"
          defaultValue="Colaborador"
          className="mb-4 w-full" // Setar width 100%
          onChange={(value) => setIsAdmin(value === 'Administrador')}
          disabled={isLoading}
        >
          <Option value="Colaborador">Colaborador</Option>
          <Option value="Administrador">Administrador</Option>
        </Select>
        <Switch
          checked={newPerson.status} // Controla o estado ativo/inativo ao adicionar um novo usuário
          onChange={(checked) => setNewPerson({ ...newPerson, status: checked })} // Atualiza o status ao mudar
          checkedChildren="Ativo"
          unCheckedChildren="Inativo"
          className="mb-4"
        />
      </Modal>
    </div>
  );
};

export default AccessPage;
