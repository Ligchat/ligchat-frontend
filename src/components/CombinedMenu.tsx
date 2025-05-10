import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../assets/images/Logo-white.png';
import DashBoard from '../screens/DashBoard';
import ChatNew from '../screens/ChatNew';
import MessageSchedule from '../screens/MessageSchedule';
import LabelPage from '../screens/LabelScreen';
import CRMPage from '../screens/CRMPage';
import AccessPage from '../screens/AccessPage';
import SectorsPage from '../screens/SectorsPage';
import ProfilePage from '../screens/ProfilePage';
import SessionService from '../services/SessionService';
import { getUser } from '../services/UserService';
import { getSectors, Sector } from '../services/SectorService';
import { useMenu } from '../contexts/MenuContext';
import { getContacts } from '../services/ContactService';
import '../styles/CombinedMenu/CombinedMenu.css';
import AgentsPage from '../screens/AgentsPage';
import ChatWebSocketService from '../services/ChatWebSocketService';

interface ProfileUpdateEvent extends CustomEvent {
    detail: {
        avatarUrl: string | null;
        name: string;
        timestamp: number;
    };
}

interface UnreadMessagesState {
    [contactId: number]: boolean;
}

interface ViewedStatus {
    [contactId: number]: boolean;
}

// Objeto para armazenar contatos temporariamente antes de adicionar à lista
type PendingContactsBuffer = {
    [contactId: number]: {
        contact: any;
        timestamp: number;
        timeoutId: NodeJS.Timeout;
    }
};

const PROFILE_UPDATED_EVENT = 'profileUpdated';
const CONTACT_BUFFER_TIMEOUT = 1500; // 1.5 segundos de buffer para contatos

const CombinedMenu: React.FC = () => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState<JSX.Element | null>(null);
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [selectedSector, setSelectedSector] = useState<string>('');
    const [selectedMenuKey, setSelectedMenuKey] = useState<string>('1');
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [expandedSubmenus, setExpandedSubmenus] = useState<string[]>([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { drawerVisible, setDrawerVisible } = useMenu();
    const navigationInProgressRef = useRef(false);
    const [unreadMessagesState, setUnreadMessagesState] = useState<UnreadMessagesState>({});
    const [contacts, setContacts] = useState<any[]>([]);
    
    // Buffer de contatos pendentes
    const pendingContactsRef = useRef<PendingContactsBuffer>({});

    const updateComponentForCurrentRoute = useCallback((sectorId: string | null) => {
        const path = location.pathname;
        const componentKey = `${path}-${sectorId || 'no-sector'}`;
        
        if (path.includes('/sectors')) {
            setSelectedComponent(<div key={componentKey} className="page-container"><SectorsPage /></div>);
        } else if (path === '/' || path.includes('/dashboard')) {
            setSelectedComponent(<DashBoard key={componentKey} />);
        } else if (path.includes('/chat')) {
            setSelectedComponent(
                <ChatNew 
                    key={componentKey}
                    hasNewMessages={unreadMessagesState}
                    setHasNewMessages={setUnreadMessagesState}
                    contacts={contacts}
                    setContacts={setContacts}
                />
            );
        } else if (path.includes('/schedule')) {
            setSelectedComponent(<MessageSchedule key={componentKey} />);
        } else if (path.includes('/crm')) {
            setSelectedComponent(<CRMPage key={componentKey} />);
        } else if (path.includes('/profile')) {
            setSelectedComponent(<ProfilePage key={componentKey} />);
        } else if (path.includes('/labels')) {
            setSelectedComponent(<LabelPage key={componentKey} />);
        } else if (path.includes('/access')) {
            setSelectedComponent(<AccessPage key={componentKey} />);
        } else if (path.includes('/agents')) {
            setSelectedComponent(<div key={componentKey} className="page-container"><AgentsPage /></div>);
        }
    }, [unreadMessagesState, location.pathname, sectors, contacts]);

    const fetchSectors = useCallback(async (token: string) => {
        try {
            const sectors = await getSectors(token);
            setSectors(sectors);
            
            // Verificar se o setor atualmente selecionado ainda existe
            const currentSectorId = selectedSector ? parseInt(selectedSector) : SessionService.getSectorId();
            if (currentSectorId) {
                const sectorExists = sectors.some(s => s.id === currentSectorId);
                if (!sectorExists) {
                    SessionService.removeSectorId();
                    setSelectedSector('');
                    
                    // Disparar evento para notificar que o setor foi alterado
                    const event = new CustomEvent('sectorChanged', { 
                        detail: { sectorId: null } 
                    });
                    window.dispatchEvent(event);
                    
                    // Redirecionar para o dashboard quando o setor selecionado não existir mais
                    updateComponentForCurrentRoute(null);
                    if (location.pathname !== '/dashboard') {
                        navigate('/dashboard');
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
            setSectors([]);
        }
    }, [selectedSector, updateComponentForCurrentRoute, navigate, location.pathname]);

    useEffect(() => {
        const loadInitialSector = async () => {
            // Obter o setor atual
            const sectorId = SessionService.getSectorId();
            
            // Se tiver um setor definido, atualizar o estado local
            if (sectorId) {
                setSelectedSector(sectorId.toString());
                updateComponentForCurrentRoute(sectorId.toString());
            } else {
                setSelectedSector('');
                updateComponentForCurrentRoute(null);
            }
            
            // Carregar os setores disponíveis
            const token = SessionService.getToken();
            if (token) {
                await fetchSectors(token);
            }
        };
        
        loadInitialSector();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Executar apenas na montagem

    // Adicionar listener para atualização de setores
    useEffect(() => {
        const handleSectorsUpdated = async () => {
            const token = SessionService.getToken();
            if (token) {
                await fetchSectors(token);
            }
        };

        window.addEventListener('sectorsUpdated', handleSectorsUpdated);
        
        return () => {
            window.removeEventListener('sectorsUpdated', handleSectorsUpdated);
        };
    }, [fetchSectors]);

    useEffect(() => {
        const handleSectorChange = (event: CustomEvent) => {
            const { sectorId } = event.detail;
            if (sectorId) {
                setSelectedSector(sectorId.toString());
                updateComponentForCurrentRoute(sectorId.toString());
            } else {
                setSelectedSector('');
                updateComponentForCurrentRoute(null);
            }
        };

        window.addEventListener('sectorChanged', handleSectorChange as EventListener);
        return () => {
            window.removeEventListener('sectorChanged', handleSectorChange as EventListener);
        };
    }, [updateComponentForCurrentRoute]);

    useEffect(() => {
        const checkAuthentication = () => {
            const tokenFromSession = SessionService.getToken();
            if (!tokenFromSession) {
                navigate('/');
                return false;
            }

            if (SessionService.isTokenExpired(tokenFromSession)) {
                SessionService.clearSession();
                navigate('/');
                return false;
            }

            return true;
        };

        checkAuthentication();
    }, [navigate]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setDrawerVisible(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [setDrawerVisible]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = SessionService.getToken();
                const decodedToken = token ? SessionService.decodeToken(token) : null;
                const userId = decodedToken ? decodedToken.userId : null;

                if (!userId) {
                    return;
                }

                const response: any = await getUser(userId);
                const userData = response.data;
                setName(userData.name);
                
                if (userData.avatarUrl) {
                    if (userData.avatarUrl.startsWith('data:image')) {
                        setAvatar(userData.avatarUrl);
                    } else {
                        setAvatar(`${userData.avatarUrl}?t=${new Date().getTime()}`);
                    }
                } else {
                    setAvatar(null);
                }
                
                setIsAdmin(userData.isAdmin || false);
            } catch (error) {
                console.error('Erro ao buscar dados do usuário:', error);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const handleProfileUpdate = (event: Event) => {
            const profileEvent = event as ProfileUpdateEvent;
            if (profileEvent.detail) {
                const newAvatarUrl = profileEvent.detail.avatarUrl;
                if (newAvatarUrl) {
                    if (newAvatarUrl.startsWith('data:image')) {
                        setAvatar(newAvatarUrl);
                    } else {
                        setAvatar(`${newAvatarUrl}?t=${profileEvent.detail.timestamp}`);
                    }
                } else {
                    setAvatar(null);
                }
                setName(profileEvent.detail.name);
            }
        };

        window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);

        return () => {
            window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
        };
    }, []);

    useEffect(() => {
        if (selectedSector) {
            const sectorId = parseInt(selectedSector);
            const sector = sectors.find(s => s.id === sectorId);
            
            if (sector) {
                // Atualizar o setor no SessionService sem disparar evento
                SessionService.setSectorId(sectorId, sector.isOfficial);
                
                // Atualizar o componente atual
                updateComponentForCurrentRoute(selectedSector);
            }
        }
    }, [selectedSector, sectors, updateComponentForCurrentRoute]);

    // Função para ordenar contatos com base no campo order
    const sortContactsByOrder = useCallback((contactsArray: any[]) => {
        
        const sorted = [...contactsArray].sort((a, b) => {
            // Ordenar pelo campo 'order' (menor primeiro)
            // Se order for igual ou ausente, ordenar pela data de criação mais recente
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            } else if (a.order !== undefined) {
                return -1;
            } else if (b.order !== undefined) {
                return 1;
            } else {
                // Se order não existir, ordenar por data de criação (mais recente primeiro)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
        
        
        return sorted;
    }, []);

    // Função para buscar contatos do setor selecionado
    const fetchContacts = useCallback(async (sectorId: string) => {
        if (!sectorId) return;
        try {
            const response = await getContacts(Number(sectorId));
            if (response && response.data) {
   
                // Ordenar contatos pelo campo order antes de atualizar o estado
                const sortedContacts = sortContactsByOrder(response.data);
                setContacts(sortedContacts);
                // Inicializar o estado de não lido com base no campo isViewed
                const unreadMap = sortedContacts.reduce((acc, contact) => {
                  if (!contact.isViewed) {
                    acc[contact.id] = true;
                  }
                  return acc;
                }, {});
                setUnreadMessagesState(unreadMap);
            } else {
                setContacts([]);
            }
        } catch (error) {
            console.error('[DEBUG] Erro ao buscar contatos:', error);
            setContacts([]);
        }
    }, [sortContactsByOrder]);

    // Buscar contatos sempre que o setor mudar
    useEffect(() => {
        if (selectedSector) {
            fetchContacts(selectedSector);
        }
    }, [selectedSector, fetchContacts]);

    // Função para adicionar um contato após o período de buffer
    const addOrUpdateBufferedContact = useCallback((contactData: any) => {
        const contactId = contactData.id;
        
        // Se já existe um timeout para este contato, limpe-o
        if (pendingContactsRef.current[contactId]?.timeoutId) {
            clearTimeout(pendingContactsRef.current[contactId].timeoutId);
        }
        
        // Atualizar o contato no buffer
        const timeoutId = setTimeout(() => {
            // Quando o timeout acontecer, adicione/atualize o contato na lista
            setContacts(prev => {
                const safePrev = Array.isArray(prev) ? prev : [];
                const exists = safePrev.some(c => c.id === contactId);
                const finalContactData = pendingContactsRef.current[contactId].contact;

                delete pendingContactsRef.current[contactId];
                
                let newContacts;
                if (exists) {
                    newContacts = safePrev.map(c => c.id === contactId ? { ...c, ...finalContactData } : c);
                } else {
                    newContacts = [...safePrev, finalContactData];
                }
                
                // Ordenar a lista atualizada antes de retornar
                return sortContactsByOrder(newContacts);
            });
        }, CONTACT_BUFFER_TIMEOUT);
        
        // Armazenar ou atualizar no buffer
        pendingContactsRef.current[contactId] = {
            contact: contactData,
            timestamp: Date.now(),
            timeoutId: timeoutId
        };
    }, [sortContactsByOrder]);

    // WebSocket para notificações globais de mensagens não lidas
    useEffect(() => {
        const token = SessionService.getToken?.() || '';
        if (!token || !selectedSector) return;

        // Define uma flag global para indicar que CombinedMenu está gerenciando o websocket principal
        (window as any).combinedMenuWebSocketActive = true;

        const handleWebSocketMessage = (msg: any) => {
            const msgType = msg.type || 'unknown';
            
            if (msgType === 'unread_status') {
                const unread = msg.payload.unreadStatus || {};
                const normalized = Object.fromEntries(
                    Object.entries(unread).map(([id, value]) => [id, !value])
                );
                setUnreadMessagesState(prev => ({ ...prev, ...normalized }));
                
                // Não precisamos de fetchContacts aqui, apenas atualizamos status
            } else if (msgType === 'message') {
                const contactId = msg.payload.contactID;
                
                // Determinar se é uma mensagem enviada pelo usuário ou recebida
                const isSentByUser = msg.payload.isSent === true;
                

                if (!isSentByUser) {
                    setUnreadMessagesState(prev => ({
                        ...prev,
                        [contactId]: true
                    }));
                }
                
                // Buscar contatos para atualização completa de dados
                fetchContacts(selectedSector);
            } else if (msgType === 'contact') {
                
                // Formatar o nome padrão baseado no número se o nome não estiver presente
                const contactData = { ...msg.payload };
                if (!contactData.name || contactData.name.trim() === '') {
                    // Formatar número como nome: +XX YY ZZZZ-ZZZZ -> "Contato +XX YY ZZZZ-ZZZZ"
                    const formattedNumber = contactData.number || '';
                    contactData.name = `Contato ${formattedNumber}`;
                }
                
                // Verificar se temos todos os campos necessários
                if (!contactData.id || !contactData.number) {
                    return; // Não processar contato incompleto
                }
                
                // Não processar eventos de contato individuais, aguardar contacts_list para atualização completa
                // fetchContacts(selectedSector);
            } else if (msgType === 'contacts_list') {

                if (msg.payload?.contacts && Array.isArray(msg.payload.contacts)) {
                    // Atualiza a lista de contatos com a nova lista ordenada
                    const sortedContacts = sortContactsByOrder(msg.payload.contacts);
                    setContacts(sortedContacts);
                    
                    // Atualizar também o mapa de não lidos, agora sobrescrevendo o estado local
                    const unreadMap = msg.payload.contacts.reduce((acc: any, contact: any) => {
                        // Só atualizar status se o contato estiver marcado como não lido no backend
                        if (!contact.isViewed) {
                            acc[contact.id] = true;
                        }
                        return acc;
                    }, {});
                    
                    // Preservar status atual, apenas adicionando novos não lidos
                    setUnreadMessagesState(unreadMap);
                }
            }
        };

        ChatWebSocketService.connect(token, handleWebSocketMessage, Number(selectedSector));
        
        return () => {
            // Limpar todos os timeouts ao desmontar
            Object.values(pendingContactsRef.current).forEach(item => {
                clearTimeout(item.timeoutId);
            });
            pendingContactsRef.current = {};
            
            ChatWebSocketService.disconnect();
            (window as any).combinedMenuWebSocketActive = false;
        };
    }, [selectedSector, fetchContacts, sortContactsByOrder]);

    useEffect(() => {
        const handleWhatsAppConnected = () => {
            // Desconectar e reconectar o WebSocket
            ChatWebSocketService.disconnect();
            const token = SessionService.getToken?.() || '';
            if (token && selectedSector) {
                ChatWebSocketService.connect(token, () => {}, Number(selectedSector));
            }
            // Recarregar contatos
            if (selectedSector) {
                fetchContacts(selectedSector);
            }
        };
        window.addEventListener('whatsappConnected', handleWhatsAppConnected);
        return () => {
            window.removeEventListener('whatsappConnected', handleWhatsAppConnected);
        };
    }, [selectedSector, fetchContacts]);

    const handleSectorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        
        try {
            setIsLoading(true);
            
            if (value) {
                const sectorId = parseInt(value);
                const sector = sectors.find(s => s.id === sectorId);
                
                if (sector && String(sectorId) !== selectedSector) {
                    await SessionService.setSectorId(sectorId, sector.isOfficial);
                    setSelectedSector(value);
                    updateComponentForCurrentRoute(value);
                }
            } else {
                await SessionService.removeSectorId();
                setSelectedSector('');
                updateComponentForCurrentRoute(null);
            }
        } catch (error) {
            console.error('Erro ao mudar setor:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    const toggleMobileMenu = () => {
        setDrawerVisible(!drawerVisible);
    };

    const toggleUserDropdown = () => {
        setShowUserDropdown(!showUserDropdown);
    };

    const toggleSubmenu = (key: string) => {
        if (expandedSubmenus.includes(key)) {
            setExpandedSubmenus(expandedSubmenus.filter(item => item !== key));
        } else {
            setExpandedSubmenus([...expandedSubmenus, key]);
        }
    };

    const handleLogout = () => {
        SessionService.clearSession();
        navigate('/');
    };

    const getPathFromKey = (key: string): string => {
        switch (key) {
            case '1': return '/dashboard';
            case '2': return '/chat';
            case '3': return '/schedule';
            case '5': return '/crm';
            case '7': return '/profile';
            case '8': return '/labels';
            case '9': return '/access';
            case '10': return '/sectors';
            case '11': return '/agents';
            case '12': return '/agents';
            default: return '/dashboard';
        }
    };

    const handleMenuClick = (key: string) => {
        if (key === '6' || key === '11') {
            toggleSubmenu(key);
            return;
        }

        setSelectedMenuKey(key);
        localStorage.setItem('selectedMenuKey', key);

        if (key === '2') {
            setUnreadMessagesState({});
            // Forçar recarregamento dos contatos ao clicar no menu de chat
            if (selectedSector) {
                fetchContacts(selectedSector);
            }
        }

        const path = getPathFromKey(key);
        
        updateSelectedComponent(key);
        
        if (location.pathname !== path) {
            navigate(path);
        }

        if (isMobile) {
            setDrawerVisible(false);
        }

        setShowUserDropdown(false);
    };

    const handleSubmenuClick = (parentKey: string, childKey: string) => {
        navigationInProgressRef.current = true;
        setSelectedMenuKey(childKey);
        localStorage.setItem('selectedMenuKey', childKey);
        
        updateSelectedComponent(childKey);
        
        const path = getPathFromKey(childKey);
        navigate(path);

        if (isMobile) {
            setDrawerVisible(false);
        }
    };

    const updateSelectedComponent = (key: string) => {
        const sectorId = selectedSector || SessionService.getSectorId()?.toString();
        const componentKey = `${key}-${sectorId || 'no-sector'}`;
        
        switch (key) {
            case '1':
                setSelectedComponent(<DashBoard key={componentKey} />);
                break;
            case '2':
                setSelectedComponent(
                    <ChatNew 
                        key={componentKey}
                        hasNewMessages={unreadMessagesState}
                        setHasNewMessages={setUnreadMessagesState}
                        contacts={contacts}
                        setContacts={setContacts}
                    />
                );
                break;
            case '3':
                setSelectedComponent(<MessageSchedule key={componentKey} />);
                break;
            case '5':
                setSelectedComponent(<CRMPage key={componentKey} />);
                break;
            case '7':
                setSelectedComponent(<ProfilePage key={componentKey} />);
                break;
            case '8':
                setSelectedComponent(<LabelPage key={componentKey} />);
                break;
            case '9':
                setSelectedComponent(<AccessPage key={componentKey} />);
                break;
            case '10':
                setSelectedComponent(
                    <div key={componentKey} className="page-container">
                        <SectorsPage />
                    </div>
                );
                break;
            case '11':
            case '12':
                setSelectedComponent(
                    <div key={componentKey} className="page-container">
                        <AgentsPage />
                    </div>
                );
                break;
            default:
                setSelectedComponent(<DashBoard key={componentKey} />);
        }
    };

    const renderMenuItems = () => {
        return (
            <ul className="menu-items">
                <li className={`menu-item ${selectedMenuKey === '1' ? 'active' : ''}`}>
                    <div className="menu-item-content" onClick={() => handleMenuClick('1')}>
                        <span className="menu-icon icon-dashboard"></span>
                        <span className="menu-label">Dashboard</span>
                        {collapsed && <div className="menu-tooltip">Dashboard</div>}
                    </div>
                </li>
                <li className={`menu-item ${selectedMenuKey === '2' ? 'active' : ''}`}>
                    <div className="menu-item-content" onClick={() => handleMenuClick('2')}>
                        <span className="menu-icon icon-message"></span>
                        <span className="menu-label">Chat</span>
                        {Object.values(unreadMessagesState).some(hasUnread => hasUnread) && (
                            <div className="notification-dot"></div>
                        )}
                        {collapsed && <div className="menu-tooltip">Chat</div>}
                    </div>
                </li>
                <li className={`menu-item ${selectedMenuKey === '3' ? 'active' : ''}`}>
                    <div className="menu-item-content" onClick={() => handleMenuClick('3')}>
                        <span className="menu-icon icon-schedule"></span>
                        <span className="menu-label">Agendamento</span>
                        {collapsed && <div className="menu-tooltip">Agendamento</div>}
                    </div>
                </li>
                <li className={`menu-item ${selectedMenuKey === '5' ? 'active' : ''}`}>
                    <div className="menu-item-content" onClick={() => handleMenuClick('5')}>
                        <span className="menu-icon icon-crm"></span>
                        <span className="menu-label">CRM</span>
                        {collapsed && <div className="menu-tooltip">CRM</div>}
                    </div>
                </li>
                <li className={`menu-item ${selectedMenuKey === '8' ? 'active' : ''}`}>
                    <div className="menu-item-content" onClick={() => handleMenuClick('8')}>
                        <span className="menu-icon icon-tag"></span>
                        <span className="menu-label">Etiquetas</span>
                        {collapsed && <div className="menu-tooltip">Etiquetas</div>}
                    </div>
                </li>
                {isAdmin && (
                    <li className={`menu-item ${expandedSubmenus.includes('6') ? 'expanded' : ''}`}>
                        <div className="menu-item-content" onClick={() => handleMenuClick('6')}>
                            <span className="menu-icon icon-settings"></span>
                            <span className="menu-label">Configurações</span>
                            <span className="menu-submenu-arrow">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                                    <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                                </svg>
                            </span>
                            {collapsed && <div className="menu-tooltip">Configurações</div>}
                        </div>
                        <ul className="menu-submenu">
                            <li 
                                className={`menu-submenu-item ${selectedMenuKey === '9' ? 'active' : ''}`}
                                onClick={() => handleSubmenuClick('6', '9')}
                            >
                                <span className="submenu-dot"></span>
                                <span className="submenu-label">Acessos</span>
                            </li>
                            <li 
                                className={`menu-submenu-item ${selectedMenuKey === '10' ? 'active' : ''}`}
                                onClick={() => handleSubmenuClick('6', '10')}
                            >
                                <span className="submenu-dot"></span>
                                <span className="submenu-label">Setores</span>
                            </li>
                        </ul>
                    </li>
                )}
                <li className={`menu-item ${expandedSubmenus.includes('11') ? 'expanded' : ''}`}>
                    <div className="menu-item-content" onClick={() => handleMenuClick('11')}>
                        <span className="menu-icon icon-ai"></span>
                        <span className="menu-label">Inteligência Artificial</span>
                        <span className="menu-submenu-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                                <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                            </svg>
                        </span>
                        {collapsed && <div className="menu-tooltip">Inteligência Artificial</div>}
                    </div>
                    <ul className="menu-submenu">
                        <li 
                            className={`menu-submenu-item ${selectedMenuKey === '12' ? 'active' : ''}`}
                            onClick={() => handleSubmenuClick('11', '12')}
                        >
                            <span className="submenu-dot"></span>
                            <span className="submenu-label">Agentes</span>
                        </li>
                    </ul>
                </li>
            </ul>
        );
    };

    return (
        <div className="menu-layout">
            <header className="menu-header">
                <div className="menu-header-left">
                    <button className="menu-toggle-button" onClick={isMobile ? toggleMobileMenu : toggleSidebar}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                        </svg>
                    </button>
                    <img src={Logo} alt="Logo" className="menu-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', marginLeft: '10px' }} />
                </div>
                <div className="menu-header-right">
                    <div className="menu-user-profile" onClick={toggleUserDropdown} ref={userDropdownRef}>
                        {avatar ? (
                            <img 
                                src={avatar} 
                                alt={name} 
                                className="menu-avatar"
                                key={avatar}
                            />
                        ) : (
                            <div className="menu-avatar-placeholder">
                                {name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="menu-username">{name}</span>
                        <span className="menu-dropdown-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                                <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                            </svg>
                        </span>
                        {showUserDropdown && (
                            <div className="menu-user-dropdown">
                                <div className="menu-dropdown-item" onClick={() => handleMenuClick('7')}>
                                    <span className="menu-dropdown-icon icon-user"></span>
                                    <span>Perfil</span>
                                </div>
                                <div className="menu-dropdown-item" onClick={handleLogout}>
                                    <span className="menu-dropdown-icon icon-logout"></span>
                                    <span>Sair</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="menu-content-layout">
                <aside className={`menu-sidebar ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${drawerVisible && isMobile ? 'visible' : ''}`}>
                    <div className="menu-sidebar-content">
                        {isLoading ? (
                            <div className="menu-loading">
                                <div className="menu-spinner"></div>
                            </div>
                        ) : (
                            <>
                                {renderMenuItems()}
                                <div className="menu-sector-selector">
                                    <select 
                                        value={selectedSector} 
                                        onChange={handleSectorChange}
                                        className="menu-select"
                                    >
                                        <option value="">Selecione o setor</option>
                                        {sectors.map((sector) => (
                                            <option key={sector.id} value={sector.id}>
                                                {sector.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                <main className="menu-content">
                    {selectedComponent}
                </main>
            </div>

            {isMobile && drawerVisible && (
                <div className="menu-overlay" onClick={toggleMobileMenu}></div>
            )}
        </div>
    );
};

export default CombinedMenu;
