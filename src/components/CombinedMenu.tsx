import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../assets/images/Logo.png';
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
import { WebSocketService } from '../services/WebSocketService';
import '../styles/CombinedMenu/CombinedMenu.css';
import AgentsPage from '../screens/AgentsPage';

interface ProfileUpdateEvent extends CustomEvent {
    detail: {
        avatarUrl: string | null;
        name: string;
        timestamp: number;
    };
}

const PROFILE_UPDATED_EVENT = 'profileUpdated';

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
    const webSocketRef = useRef<WebSocketService | null>(null);
    const initialRenderRef = useRef(true);
    const navigationInProgressRef = useRef(false);

    useEffect(() => {
        const sectorId = SessionService.getSectorId();
        console.log('Initial load:', { sectorId, pathname: location.pathname });
        
        if (sectorId) {
            setSelectedSector(sectorId.toString());
            
            // Inicializa o WebSocket para o setor atual
            if (!webSocketRef.current) {
                webSocketRef.current = new WebSocketService();
                webSocketRef.current.connect(sectorId.toString());
            }
        }
        
        // Força a atualização do componente inicial
        updateComponentForCurrentRoute(sectorId?.toString() || null);
    }, []);

    // Inicializar WebSocket
    useEffect(() => {
        const sectorId = SessionService.getSectorId();
        if (!sectorId) return;

        console.log('CombinedMenu: Inicializando WebSocket para o setor:', sectorId);
        
        // Criar ou reutilizar instância do WebSocket
        if (!webSocketRef.current) {
            webSocketRef.current = new WebSocketService();
        }
        
        // Conectar ao WebSocket
        webSocketRef.current.connect(sectorId.toString());

        // Registrar handler
        webSocketRef.current.addMessageHandler((message) => {
            console.log('CombinedMenu: Mensagem recebida via WebSocket:', message);
            // Notificações removidas conforme solicitado
        });

        // Cleanup
        return () => {
            if (webSocketRef.current) {
                // Limpar handlers ao desmontar
                webSocketRef.current.removeMessageHandler(() => {});
            }
        };
    }, []);

    // Desconectar WebSocket quando o componente for desmontado
    useEffect(() => {
        return () => {
            console.log('CombinedMenu: Desconectando WebSocket');
            if (webSocketRef.current) {
                webSocketRef.current.disconnect();
                webSocketRef.current = null;
            }
        };
    }, []);

    // Reconectar WebSocket quando o setor muda
    useEffect(() => {
        const handleSectorChange = () => {
            const sectorId = SessionService.getSectorId();
            if (!sectorId) {
                if (webSocketRef.current) {
                    webSocketRef.current.disconnect();
                }
                return;
            }
            
            console.log('CombinedMenu: Setor alterado, reconectando WebSocket:', sectorId);
            
            if (!webSocketRef.current) {
                webSocketRef.current = new WebSocketService();
            }
            
            webSocketRef.current.disconnect();
            webSocketRef.current.connect(sectorId.toString());
        };
        
        window.addEventListener('sectorChanged', handleSectorChange);
        
        return () => {
            window.removeEventListener('sectorChanged', handleSectorChange);
        };
    }, []);

    useEffect(() => {
        if (!initialRenderRef.current) {
            console.log('Route changed:', location.pathname);
            updateComponentForCurrentRoute(selectedSector);
        } else {
            initialRenderRef.current = false;
        }
    }, [location.pathname]);

    useEffect(() => {
        const tokenFromSession = SessionService.getToken();
        if (!tokenFromSession) {
            navigate('/');
            return;
        }

        if (SessionService.isTokenExpired(tokenFromSession)) {
            SessionService.clearSession();
            navigate('/');
            return;
        }

        fetchSectors(tokenFromSession);
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

    const fetchSectors = async (token: string) => {
        try {
            console.log('Fetching sectors...');
            const sectors = await getSectors(token);
            console.log('Sectors fetched:', sectors);
            setSectors(sectors);
            
            // Atualiza os setores disponíveis no SessionService
            const sectorIds = sectors.map(s => s.id);
            SessionService.validateAndCleanSectorSession(sectorIds);
            
            // Verifica se o setor atual ainda é válido
            const currentSectorId = SessionService.getSectorId();
            if (currentSectorId) {
                const sectorExists = sectors.some(s => s.id === currentSectorId);
                if (!sectorExists) {
                    console.log('Current sector not found in available sectors');
                    SessionService.removeSectorId();
                    setSelectedSector('');
                }
            }
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
            setSectors([]);
        }
    };

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
                
                // Verifica se é uma URL ou base64
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
                // Verifica se é uma URL ou base64
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

    const renderComponent = (Component: React.ComponentType, sectorId: string | null, timestamp: number) => {
        const key = `${selectedMenuKey}-${sectorId}-${timestamp}`;
        return <Component key={key} />;
    };

    const updateComponentForCurrentRoute = (sectorId: string | null) => {
        const timestamp = Date.now();
        console.log('Updating component for route:', { path: location.pathname, sectorId, timestamp });
        
        // Atualiza o componente baseado na rota atual
        const path = location.pathname;
        const key = `${path}-${sectorId}-${timestamp}`;
        
        if (path.includes('/sectors')) {
            setSelectedComponent(<div key={key} className="page-container"><SectorsPage /></div>);
        } else if (path === '/' || path.includes('/dashboard')) {
            setSelectedComponent(<DashBoard key={key} />);
        } else if (path.includes('/chat')) {
            setSelectedComponent(<ChatNew key={key} />);
        } else if (path.includes('/schedule')) {
            setSelectedComponent(<MessageSchedule key={key} />);
        } else if (path.includes('/crm')) {
            setSelectedComponent(<CRMPage key={key} />);
        } else if (path.includes('/profile')) {
            setSelectedComponent(<ProfilePage key={key} />);
        } else if (path.includes('/labels')) {
            setSelectedComponent(<LabelPage key={key} />);
        } else if (path.includes('/access')) {
            setSelectedComponent(<AccessPage key={key} />);
        } else if (path.includes('/agents')) {
            setSelectedComponent(<div key={key} className="page-container"><AgentsPage /></div>);
        }
    };

    useEffect(() => {
        const sectorId = selectedSector ? parseInt(selectedSector) : null;
        const currentSectorId = SessionService.getSectorId();
        
        console.log('Sector change detected:', { selectedSector, sectorId, currentSectorId });
        
        if (sectorId !== currentSectorId) {
            console.log('Updating sector in SessionService');
            if (sectorId) {
                SessionService.setSectorId(sectorId);
            } else {
                SessionService.removeSectorId();
            }
            
            // Força a atualização do componente
            const timestamp = Date.now();
            updateComponentForCurrentRoute(selectedSector);
        }
    }, [selectedSector]);

    const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        console.log('Sector selection changed:', { value });
        setIsLoading(true);
        
        // Atualiza o setor no SessionService
        if (value) {
            const sectorId = parseInt(value);
            SessionService.setSectorId(sectorId);
        } else {
            SessionService.removeSectorId();
        }
        
        setSelectedSector(value);
        
        // Força uma atualização imediata do componente
        updateComponentForCurrentRoute(value);
        
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
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
        const timestamp = Date.now();
        const sectorId = selectedSector || SessionService.getSectorId()?.toString();
        const componentKey = `${key}-${sectorId}-${timestamp}`;
        
        switch (key) {
            case '1':
                setSelectedComponent(<DashBoard key={componentKey} />);
                break;
            case '2':
                setSelectedComponent(<ChatNew key={componentKey} />);
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
                    <div className="menu-logo-container">
                        <img src={Logo} alt="Logo" className="menu-logo" />
                    </div>
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
