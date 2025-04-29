import React, { useState, useEffect, useRef } from 'react';
import { createUser, updateUser, getAllUsers, deleteUser } from '../services/UserService';
import { getSector, getSectors, Sector } from '../services/SectorService';
import SessionService from '../services/SessionService';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { ToastContainer } from '../components/Toast';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiUser, FiMail, FiToggleRight, FiToggleLeft, FiChevronDown } from 'react-icons/fi';
import './AccessPage.css';

interface ApiResponse<T> {
  message: string;
  code: string;
  data: T[];
}

interface Person {
  id: number;
  name: string;
  email: string;
  phoneWhatsapp: string;
  avatarUrl: string;
  isAdmin: boolean;
  status: boolean;
  sectors: Array<{
    id: number;
    name: string;
  }>;
  invitedBy: number | null;
  isDeleting?: boolean;
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UpdateUserRequest {
    name: string;
    email: string;
    number: string;
    isActive: boolean;
    priority: 'low' | 'medium' | 'normal' | 'high';
    contactStatus: string;
    aiActive: number;
    sectorId: number;
}

const AccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newPerson, setNewPerson] = useState<Person>({
    id: 0,
    name: '',
    email: '',
    phoneWhatsapp: '',
    avatarUrl: '',
    isAdmin: false,
    status: true,
    sectors: [],
    invitedBy: null
  });
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAvatarLoading, setIsAvatarLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Verificar autenticação e obter userId
  const token = SessionService.getToken();
  console.log('Token:', token);
  const decodedToken = token ? SessionService.decodeToken(token) : null;
  console.log('Decoded Token:', decodedToken);
  const userId = decodedToken?.userId || null;
  console.log('User ID:', userId);

  useEffect(() => {
    fetchSectors();
  }, [navigate]);

  const [invitedBy, setInvitedBy] = useState<number | null>(userId);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sectorSearchText, setSectorSearchText] = useState('');
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    sectors?: string;
  }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const fetchSectors = async () => {
    try {
      setIsLoading(true);
      const token = SessionService.getToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }
      const response = await getSectors(token);
      setSectors(response || []);
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
      setSectors([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUsers = async (sectorsList: Sector[]) => {
    try {
      if (!userId) {
        throw new Error('ID do usuário não encontrado');
      }
      setIsLoading(true);
      console.log('Buscando usuários...');
      const response = await getAllUsers(Number(userId));
      console.log('Usuários retornados:', response);
      
      let usersData: Person[] = [];
      
      if (Array.isArray(response)) {
        usersData = response as unknown as Person[];
      } else if (response && 'data' in response) {
        usersData = (response as { data: Person[] }).data;
      }

      const processedUsers = usersData.map(user => ({
        ...user,
        isDeleting: false
      }));

      setPeople(processedUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      addToast('Erro ao carregar usuários', 'error');
      setPeople([]);
    } finally {
      setIsLoading(false);
      setIsAvatarLoading(false);
    }
  };

  useEffect(() => {
    if (sectors.length > 0) {
      console.log('Setores carregados, buscando usuários...');
      fetchUsers(sectors);
    }
  }, [sectors]);

  // Adicionar um log para monitorar o estado de carregamento e dados
  useEffect(() => {
    console.log('Estado atual:', {
      isLoading,
      peopleCount: people.length,
      sectorsCount: sectors.length
    });
  }, [isLoading, people, sectors]);

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
    setEditingPerson(person);
    setSelectedSectors(person.sectors.map(sector => sector.id.toString()));
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingPerson(null);
    setSelectedSectors([]);
    setSectorSearchText('');
    setShowSectorDropdown(false);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; sectors?: string; } = {};
    
    // Validação do nome
    if (!editingPerson?.name && !newPerson.name) {
      newErrors.name = 'O nome é obrigatório';
    } else if ((editingPerson?.name || newPerson.name).length < 3) {
      newErrors.name = 'O nome deve ter pelo menos 3 caracteres';
    }

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editingPerson?.email && !newPerson.email) {
      newErrors.email = 'O email é obrigatório';
    } else if (!emailRegex.test(editingPerson?.email || newPerson.email)) {
      newErrors.email = 'Digite um email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleToggleStatus = () => {
    if (editingPerson) {
      setEditingPerson(prev => ({
        ...prev!,
        status: !prev!.status
      }));
    } else {
      setNewPerson(prev => ({
        ...prev,
        status: !prev.status
      }));
    }
  };

  const handleSavePerson = async () => {
    if (!validateForm()) {
      return;
    }
    if (editingPerson) {
      try {
        setIsSaving(true);
        const sectorsToUpdate = selectedSectors.map((sectorId) => {
          const sector = sectors.find((s) => s.id === Number(sectorId));
          return {
            Id: sector?.id,
            IsShared: true,
          };
        });
        const updatedUser = {
          name: editingPerson.name,
          email: editingPerson.email,
          phoneWhatsapp: editingPerson.phoneWhatsapp,
          status: editingPerson.status,
          isAdmin: editingPerson.isAdmin,
          sectors: sectorsToUpdate,
          invitedBy: editingPerson.invitedBy
        };
        await updateUser(editingPerson.id, updatedUser as any);
        addToast('Usuário atualizado com sucesso!', 'success');
        handleCloseDrawer();
        await refreshUsers();
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        addToast('Erro ao atualizar usuário', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeletePerson = async (personId: string) => {
    try {
      setDeletingUserId(Number(personId));
      await deleteUser(personId);
      addToast('Usuário excluído com sucesso!', 'success');
      await refreshUsers();
    } catch (error) {
      console.error('Failed to delete user', error);
      addToast('Erro ao excluir usuário', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  const toggleDeleteMode = (personId: string, isDeleting: boolean) => {
    const updatedPeople = people.map((person) =>
      person.id === Number(personId) ? { ...person, isDeleting } : person
    );
    setPeople(updatedPeople);
  };

  const handleAddPerson = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      setIsSaving(true);
      const sectorsToUpdate = selectedSectors.map((sectorId) => {
        const sector = sectors.find((s) => s.id === Number(sectorId));
        return {
          Id: sector?.id,
          IsShared: true,
        };
      });
      const newUser: any = {
        name: newPerson.name,
        email: newPerson.email,
        avatarUrl: '',
        phoneWhatsapp: '',
        isAdmin: isAdmin,
        status: newPerson.status,
        sectors: sectorsToUpdate,
        invitedBy: invitedBy,
      };
      await createUser(newUser);
      addToast('Usuário criado com sucesso!', 'success');
      setIsDrawerOpen(false);
      setNewPerson({
        id: 0,
        name: '',
        email: '',
        phoneWhatsapp: '',
        avatarUrl: '',
        isAdmin: false,
        status: true,
        sectors: [],
        invitedBy: null
      });
      setSelectedSectors([]);
      setIsAdmin(false);
      await refreshUsers();
    } catch (error) {
      console.error('Failed to create user', error);
      addToast('Erro ao criar usuário', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const newToast = {
      id: Date.now(),
      message,
      type,
    };
    setToasts(current => [...current, newToast]);
  };

  const removeToast = (id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setIsAdmin(value === 'Administrador');
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setSelectedSectors(selectedValues);
  };

  const handleSectorSelect = (sectorId: number) => {
    const sectorIdStr = sectorId.toString();
    if (selectedSectors.includes(sectorIdStr)) {
      setSelectedSectors(selectedSectors.filter(id => id !== sectorIdStr));
    } else {
      setSelectedSectors([...selectedSectors, sectorIdStr]);
    }
  };

  const handleRemoveSector = (sectorId: string) => {
    setSelectedSectors(selectedSectors.filter(id => id !== sectorId));
  };

  return (
    <div className="ap-screen">
      <div className="ap-header">
        <div className="ap-header-content">
          <h1>Acessos</h1>
          <p className="ap-header-description">Gerencie os acessos dos usuários</p>
        </div>
        <button 
          className="ap-add-button" 
          onClick={() => setIsDrawerOpen(true)}
          disabled={!SessionService.getSectorId()}
        >
          <FiPlus /> Novo Usuário
        </button>
      </div>

      {isLoading ? (
        <div className="ap-content" style={{ position: 'relative', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-overlay">
            <div className="card-loading">
              <div className="card-loading-spinner" />
              <span className="loading-text">Carregando acessos...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="ap-content">
          {!SessionService.getSectorId() ? (
            <div className="ap-no-sector"> 
              Nenhum setor selecionado
            </div>
          ) : people.length === 0 ? (
            <div className="ap-empty">
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="ap-grid">
              {people.map((person) => (
                <div key={person.id} className="ap-card">
                  {person.isDeleting ? (
                    <div className="ap-delete-confirm">
                      <div className="ap-delete-message">
                        <h4 className="ap-delete-title">Confirmar Exclusão</h4>
                        <p className="ap-delete-text">
                          Tem certeza que deseja excluir o acesso de "{person.name}"?
                          <br />
                          Esta ação não poderá ser desfeita.
                        </p>
                      </div>
                      <div className="ap-confirm-actions">
                        <button 
                          className="ap-button ap-button-secondary" 
                          onClick={() => toggleDeleteMode(person.id.toString(), false)}
                        >
                          <FiX /> Cancelar
                        </button>
                        <button 
                          className="ap-button ap-button-danger" 
                          onClick={() => handleDeletePerson(person.id.toString())}
                          disabled={deletingUserId === person.id}
                        >
                          {deletingUserId === person.id && <span className="ap-spinner-btn" />}
                          <FiCheck /> Confirmar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ap-card-content">
                      <div className={`ap-status-indicator ${person.status ? 'active' : 'inactive'}`}>
                        {person.status ? (
                          <>
                            <FiToggleRight />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <FiToggleLeft />
                            <span>Desativado</span>
                          </>
                        )}
                      </div>
                      <div className="ap-card-header">
                        <h3 className="ap-card-title">{person.name}</h3>
                        <div className="ap-card-actions">
                          <button 
                            className="ap-action-button edit" 
                            onClick={() => handleEditPerson(person)}
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            className="ap-action-button delete" 
                            onClick={() => toggleDeleteMode(person.id.toString(), true)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      <div className="ap-card-info">
                        <div className="ap-info-item">
                          <FiMail />
                          <span>{person.email || 'Email não informado'}</span>
                        </div>
                        <div className="ap-info-item">
                          <FiUser />
                          <span>WhatsApp: {person.phoneWhatsapp || 'Não informado'}</span>
                        </div>
                        <div className="ap-info-item">
                          <span>Tipo: {person.isAdmin ? 'Administrador' : 'Colaborador'}</span>
                        </div>
                        {(() => {
                          const userSectorIds = sectors.map(s => s.id);
                          const commonSectors = person.sectors
                            ? person.sectors.filter(s => userSectorIds.includes(s.id))
                            : [];
                          if (commonSectors.length > 0) {
                            return (
                              <div className="ap-info-item">
                                <span className="ap-info-label">Setores:</span>
                                <div className="ap-info-sectors">
                                  {commonSectors.map(s => (
                                    <span key={s.id} className="ap-sector-tag">{s.name}</span>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div className="ap-info-item">
                              <span className="ap-info-label">Setores:</span>
                              <span className="ap-info-text">Nenhum setor associado</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(isDrawerOpen || editingPerson) && (
        <div className="ap-drawer-overlay">
          <div className="ap-drawer">
            <div className="ap-drawer-header">
              <h2 className="ap-drawer-title">{editingPerson ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button 
                className="ap-button ap-button-icon"
                onClick={handleCloseDrawer}
              >
                <FiX />
              </button>
            </div>
            
            <div className="ap-drawer-content">
              <form className="ap-form" onSubmit={(e) => {
                e.preventDefault();
                editingPerson ? handleSavePerson() : handleAddPerson();
              }}>
                <div className="ap-form-group">
                  <label className="ap-form-label">Nome do Usuário <span className="ap-required">*</span></label>
                  <input
                    type="text"
                    className={`ap-form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Digite o nome do usuário"
                    value={editingPerson?.name || newPerson.name}
                    onChange={(e) => {
                      if (editingPerson) {
                        setEditingPerson({ ...editingPerson, name: e.target.value });
                      } else {
                        setNewPerson({ ...newPerson, name: e.target.value });
                      }
                      if (errors.name) {
                        setErrors({ ...errors, name: undefined });
                      }
                    }}
                    disabled={isLoading || isSaving}
                  />
                  {errors.name && <span className="ap-error-message">{errors.name}</span>}
                </div>

                <div className="ap-form-group">
                  <label className="ap-form-label">Email <span className="ap-required">*</span></label>
                  <input
                    type="email"
                    className={`ap-form-input ${errors.email ? 'error' : ''}`}
                    placeholder="Digite o email"
                    value={editingPerson?.email || newPerson.email}
                    onChange={(e) => {
                      if (editingPerson) {
                        setEditingPerson({ ...editingPerson, email: e.target.value });
                      } else {
                        setNewPerson({ ...newPerson, email: e.target.value });
                      }
                      if (errors.email) {
                        setErrors({ ...errors, email: undefined });
                      }
                    }}
                    disabled={isLoading || isSaving}
                  />
                  {errors.email && <span className="ap-error-message">{errors.email}</span>}
                </div>

                <div className="ap-form-group">
                  <label className="ap-form-label">Nível de Acesso</label>
                  <select
                    className="ap-form-select"
                    value={editingPerson ? (editingPerson.isAdmin ? "Administrador" : "Colaborador") : (isAdmin ? "Administrador" : "Colaborador")}
                    onChange={handleSelectChange}
                    disabled={isLoading || isSaving}
                  >
                    <option value="Colaborador">Colaborador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div className="ap-form-group">
                  <label className="ap-form-label">Status</label>
                  <div className="ap-switch">
                    <div className={`ap-switch-label ${editingPerson ? (editingPerson.status ? 'active' : 'inactive') : (newPerson.status ? 'active' : 'inactive')}`}>
                      <span className="ap-switch-text">
                        {editingPerson ? (editingPerson.status ? 'Ativo' : 'Inativo') : (newPerson.status ? 'Ativo' : 'Inativo')}
                      </span>
                    </div>
                    <div 
                      className={`ap-switch-toggle ${editingPerson ? (editingPerson.status ? 'active' : '') : (newPerson.status ? 'active' : '')}`}
                      onClick={handleToggleStatus}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleToggleStatus();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="ap-form-group">
                  <label className="ap-form-label">Setores <span className="ap-required">*</span></label>
                  <div
                    className={`ap-multiselect${showSectorDropdown ? ' open' : ''}`}
                    onClick={() => setShowSectorDropdown(prev => !prev)}
                  >
                    <div className="ap-multiselect-content">
                      {selectedSectors.length === 0 ? (
                        <div className="ap-multiselect-placeholder">Selecione os setores</div>
                      ) : (
                        <div className="ap-multiselect-tags">
                          {selectedSectors.map(sectorId => {
                            const sector = sectors.find(s => s.id.toString() === sectorId);
                            if (!sector) return null;
                            return (
                              <span key={sector.id} className="ap-multiselect-tag">
                                {sector.name}
                                <button
                                  type="button"
                                  className="ap-multiselect-tag-remove"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSector(sectorId);
                                  }}
                                >
                                  <FiX size={14} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="ap-multiselect-toggle">
                      <FiChevronDown size={18} />
                    </div>

                    {showSectorDropdown && (
                      <div className="ap-multiselect-dropdown">
                        <div className="ap-multiselect-search">
                          <input
                            type="text"
                            placeholder="Buscar setores..."
                            value={sectorSearchText}
                            onChange={(e) => setSectorSearchText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="ap-multiselect-options">
                          {sectors
                            .filter(sector => 
                              sector.name.toLowerCase().includes(sectorSearchText.toLowerCase())
                            )
                            .map(sector => (
                              <div
                                key={sector.id}
                                className={`ap-multiselect-option${
                                  selectedSectors.includes(sector.id.toString()) ? ' selected' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSectorSelect(sector.id);
                                }}
                              >
                                <div className="ap-multiselect-checkbox" />
                                {sector.name}
                              </div>
                            ))}
                          {sectors.filter(sector => 
                            sector.name.toLowerCase().includes(sectorSearchText.toLowerCase())
                          ).length === 0 && (
                            <div className="ap-multiselect-no-results">
                              Nenhum setor encontrado
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.sectors && <span className="ap-error-message">{errors.sectors}</span>}
                </div>

                <div className="ap-drawer-footer">
                  <button 
                    type="button"
                    className="ap-button ap-button-secondary"
                    onClick={handleCloseDrawer}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="ap-button ap-button-primary"
                    disabled={isLoading || isSaving}
                  >
                    {isSaving && <span className="ap-spinner-btn" />}
                    {editingPerson ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </div>
  );
};

export default AccessPage;
