import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../assets/images/Logo.png';
import DashBoard from '../screens/DashBoard';
import ChatPage from '../screens/ChatScreen';
import MessageSchedule from '../screens/MessageSchedule';
import LabelPage from '../screens/LabelScreen';
import CRMPage from '../screens/CRMPage';
import AccessPage from '../screens/AccessPage';
import SectorsPage from '../screens/SectorsPage';
import WebhookPage from '../screens/WebhookPage';
import ProfilePage from '../screens/ProfilePage';
import VariablesPage from '../screens/VariablesPage';
import SessionService from '../services/SessionService';
import { getUser } from '../services/UserService';
import { getSectors, Sector } from '../services/SectorService';
import { useMenu } from '../contexts/MenuContext';
import '../styles/CombinedMenu/CombinedMenu.css';
import ChatNew from '../screens/ChatNew';

const CombinedMenu: React.FC = () => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState<JSX.Element>(<DashBoard />);
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [selectedMenuKey, setSelectedMenuKey] = useState<string>('1');
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [expandedSubmenus, setExpandedSubmenus] = useState<string[]>([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { drawerVisible, setDrawerVisible } = useMenu();
    const initialRenderRef = useRef(true);
    const navigationInProgressRef = useRef(false);

    useEffect(() => {
        setSelectedComponent(<DashBoard />);
    }, []);

    useEffect(() => {
        if (initialRenderRef.current) {
            initialRenderRef.current = false;
            
            const currentPath = location.pathname;
            if (currentPath === '/' || currentPath === '') {
                navigate('/dashboard');
                return;
            }
            
            const validPaths = [
                '/dashboard', '/chat', '/schedule', '/crm', 
                '/profile', '/labels', '/access', '/sectors', 
                '/webhook', '/variables'
            ];
            
            const isValidPath = validPaths.some(path => 
                currentPath === path || currentPath.startsWith(`${path}/`)
            );
            
            if (isValidPath) {
                updateSelectedMenuFromPath(currentPath);
                return;
            }
            
            const storedMenuKey = localStorage.getItem('selectedMenuKey');
            if (storedMenuKey) {
                setSelectedMenuKey(storedMenuKey);
                const path = getPathFromKey(storedMenuKey);
                navigate(path);
            } else {
                navigate('/dashboard');
            }
        }
    }, [navigate, location.pathname]);

    const updateSelectedMenuFromPath = (path: string) => {
        if (path.includes('/dashboard')) {
            setSelectedMenuKey('1');
        } else if (path.includes('/chat')) {
            setSelectedMenuKey('2');
        } else if (path.includes('/schedule')) {
            setSelectedMenuKey('3');
        } else if (path.includes('/crm')) {
            setSelectedMenuKey('5');
        } else if (path.includes('/profile')) {
            setSelectedMenuKey('7');
        } else if (path.includes('/labels')) {
            setSelectedMenuKey('8');
        } else if (path.includes('/access')) {
            setSelectedMenuKey('9');
        } else if (path.includes('/sectors')) {
            setSelectedMenuKey('10');
        } else if (path.includes('/webhook')) {
            setSelectedMenuKey('11');
        } else if (path.includes('/variables')) {
            setSelectedMenuKey('12');
        }
    };

    useEffect(() => {
        const tokenFromSession = SessionService.getSession('authToken');
        if (tokenFromSession) {
            fetchSectors(tokenFromSession);
        }
    }, []);

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
            const response: any = await getSectors(token);
            setSectors(Array.isArray(response.data) ? response.data : []);
            const sectorId = SessionService.getSession('selectedSector');
            if (sectorId) {
                setSelectedSector(sectorId);
            }
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
            setSectors([]);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = SessionService.getSession('authToken');
                const decodedToken = token ? SessionService.decodeToken(token) : null;
                const userId = decodedToken ? decodedToken.userId : null;

                if (!userId) {
                    return;
                }

                const response: any = await getUser(userId);
                const userData = response.data;
                setName(userData.name);
                setAvatar(userData.avatarUrl || null);
                setIsAdmin(userData.isAdmin);
            } catch (error) {
                console.error('Erro ao buscar dados do usuário:', error);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setIsLoading(true);
        setSelectedSector(value);
        SessionService.setSession('selectedSector', value);
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
        navigate('/login');
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
            case '11': return '/webhook';
            case '12': return '/variables';
            default: return '/dashboard';
        }
    };

    const handleMenuClick = (key: string) => {
        if (key === '6') {
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
        setSelectedMenuKey(childKey);
        localStorage.setItem('selectedMenuKey', childKey);

        const path = getPathFromKey(childKey);
        
        updateSelectedComponent(childKey);
        
        navigate(path);

        if (isMobile) {
            setDrawerVisible(false);
        }
    };

    const updateSelectedComponent = (key: string) => {
        const timestamp = new Date().getTime();
        
        switch (key) {
            case '1':
                setSelectedComponent(<DashBoard key={`dashboard-${timestamp}`} />);
                break;
            case '2':
                setSelectedComponent(<ChatNew key={`chat-${timestamp}`} />);
                break;
            case '3':
                setSelectedComponent(<MessageSchedule key={`schedule-${timestamp}`} />);
                break;
            case '5':
                setSelectedComponent(<CRMPage key={`crm-${timestamp}`} />);
                break;
            case '7':
                setSelectedComponent(<ProfilePage key={`profile-${timestamp}`} />);
                break;
            case '8':
                setSelectedComponent(<LabelPage key={`label-${timestamp}`} />);
                break;
            case '9':
                setSelectedComponent(<AccessPage key={`access-${timestamp}`} />);
                break;
            case '10':
                setSelectedComponent(<SectorsPage key={`sectors-${timestamp}`} />);
                break;
            case '11':
                setSelectedComponent(<WebhookPage key={`webhook-${timestamp}`} />);
                break;
            case '12':
                setSelectedComponent(<VariablesPage key={`variables-${timestamp}`} />);
                break;
            default:
                setSelectedComponent(<DashBoard key={`dashboard-default-${timestamp}`} />);
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
                            <li 
                                className={`menu-submenu-item ${selectedMenuKey === '11' ? 'active' : ''}`}
                                onClick={() => handleSubmenuClick('6', '11')}
                            >
                                <span className="submenu-dot"></span>
                                <span className="submenu-label">Webhook</span>
                            </li>
                            <li 
                                className={`menu-submenu-item ${selectedMenuKey === '12' ? 'active' : ''}`}
                                onClick={() => handleSubmenuClick('6', '12')}
                            >
                                <span className="submenu-dot"></span>
                                <span className="submenu-label">Variáveis</span>
                            </li>
                        </ul>
                    </li>
                )}
            </ul>
        );
    };

    useEffect(() => {
        const path = location.pathname;
        let key = '1'; // Default to dashboard
        
        if (path === '/' || path.includes('/dashboard')) {
            key = '1';
        } else if (path.includes('/chat')) {
            key = '2';
        } else if (path.includes('/schedule')) {
            key = '3';
        } else if (path.includes('/crm')) {
            key = '5';
        } else if (path.includes('/profile')) {
            key = '7';
        } else if (path.includes('/labels')) {
            key = '8';
        } else if (path.includes('/access')) {
            key = '9';
        } else if (path.includes('/sectors')) {
            key = '10';
        } else if (path.includes('/webhook')) {
            key = '11';
        } else if (path.includes('/variables')) {
            key = '12';
        }
        
        // Atualize o menu selecionado
        setSelectedMenuKey(key);
        
        // Atualize o componente apenas se a navegação não foi iniciada por um clique no menu
        if (!navigationInProgressRef.current) {
            updateSelectedComponent(key);
        }
        
        navigationInProgressRef.current = false;
    }, [location.pathname]);

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
                            <img src={avatar} alt={name} className="menu-avatar" />
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
                                        value={selectedSector || ''} 
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
