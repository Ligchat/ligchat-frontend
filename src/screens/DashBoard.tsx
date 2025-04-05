import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import { FiCalendar } from 'react-icons/fi';
import 'chart.js/auto';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/Dashboard/Dashboard.css';
import '../styles/Dashboard/CustomDatePicker.css';
import SessionService from '../services/SessionService';
import { getContacts, Contact } from '../services/ContactService';
import { getTags, Tag } from '../services/LabelService';
import { getAllUsers, User } from '../services/UserService';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Mover todas as declarações de estado para o início
  const [users, setUsers] = useState<Contact[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Contact[]>([]);
  const [isLoadingNewContacts, setIsLoadingNewContacts] = useState<boolean>(false);
  const [isLoadingActiveContacts, setIsLoadingActiveContacts] = useState<boolean>(false);
  const [isLoadingComparison, setIsLoadingComparison] = useState<boolean>(false);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [isLoadingMonthContacts, setIsLoadingMonthContacts] = useState<boolean>(false);
  const [isLoadingActiveTable, setIsLoadingActiveTable] = useState<boolean>(false);
  const [tasksDone, setTasksDone] = useState<number>(0);
  const [tasksPending, setTasksPending] = useState<number>(0);
  const [goalProgress, setGoalProgress] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Define para 7 dias atrás
    return { start, end };
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>('semanal'); // Inicia com período semanal selecionado
  const [sectorSelected, setSectorSelected] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [tasksPerPage] = useState<number>(5);
  const [tags, setTags] = useState<Tag[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Contact[]>([]);

  // Estado do gráfico
  const [goalData, setGoalData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: 'Contatos',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 20,
      }
    ],
  });

  // Componente customizado para o input do DatePicker
  const CustomInput = React.forwardRef<HTMLInputElement, any>(({ value, onClick, label, disabled }, ref) => (
    <div className="date-input-group">
      <label>{label}</label>
      <div className="date-input-container">
        <input
          className="custom-input"
          value={value || ''}
          placeholder="Selecione uma data"
          onClick={onClick}
          ref={ref}
          readOnly
          disabled={disabled}
        />
        <FiCalendar className="calendar-icon" size={18} />
      </div>
    </div>
  ));

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingNewContacts(true);
        setIsLoadingActiveContacts(true);
        setIsLoadingComparison(true);
        setIsLoadingChart(true);
        setIsLoadingMonthContacts(true);
        setIsLoadingActiveTable(true);

        const sectorId = SessionService.getSectorId();
        if (!sectorId) {
          console.error('Setor não selecionado');
          return;
        }

        // Carregar todos os dados necessários simultaneamente
        const [contactsResponse, tagsResponse, usersResponse] = await Promise.all([
          getContacts(sectorId),
          getTags(sectorId),
          getAllUsers()
        ]);

        // Configurar contatos
        const contacts = contactsResponse.data;
        setUsers(contacts);

        // Filtrar contatos pelo período selecionado
        const filteredContacts = filterContactsByPeriod(contacts, dateRange.start, dateRange.end);
        setFilteredUsers(filteredContacts);
        setTasksPending(filteredContacts.length);
        setTasksDone(filteredContacts.length);
        setCompletedTasks(filteredContacts);

        // Configurar tags
        setTags(tagsResponse.data || []);

        // Configurar usuários
        setAllUsers(usersResponse || []);

        // Processar dados para o gráfico com o range de datas atual
        if (dateRange.start && dateRange.end) {
          processContactsData(contacts, selectedPeriod, dateRange);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoadingNewContacts(false);
        setIsLoadingActiveContacts(false);
        setIsLoadingComparison(false);
        setIsLoadingChart(false);
        setIsLoadingMonthContacts(false);
        setIsLoadingActiveTable(false);
      }
    };

    const checkSector = () => {
      const selectedSector = SessionService.getSectorId();
      const hasSector = !!selectedSector;
      setSectorSelected(hasSector);
      
      if (hasSector) {
        loadData();
      } else {
        setTasksDone(0);
        setTasksPending(0);
        setGoalProgress(0);
        setUsers([]);
        setFilteredUsers([]);
        setCompletedTasks([]);
        setGoalData({
          labels: [],
          datasets: [
            {
              label: 'Contatos',
              data: [],
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 2,
              borderRadius: 8,
              barThickness: 20,
            }
          ],
        });
      }
    };
    
    checkSector();
    
    const handleStorageChange = () => {
      checkSector();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dateRange, selectedPeriod]); // Adicionar selectedPeriod como dependência

  const goalOptions = {
    indexAxis: 'y' as const,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#a0a0a0',
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#a0a0a0',
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#e0e0e0',
          boxWidth: 12,
          padding: 20,
          font: {
            size: 13
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(54, 162, 235, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (tooltipItem: any) => `${tooltipItem.formattedValue} contatos`,
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 25
      }
    },
    barThickness: 25,
  };

  // Função para formatar data no padrão brasileiro
  const formatDateBR = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para ajustar o final do dia
  const setEndOfDay = (date: Date): Date => {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  };

  // Função para ajustar o início do dia
  const setStartOfDay = (date: Date): Date => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  };

  const processContactsData = (contacts: Contact[], period: string | null, range: {start: Date | null, end: Date | null}) => {
    if (!contacts.length) return;

    let labels: string[] = [];
    let data: number[] = [];

    // Se tiver range de data selecionado, mostra apenas os dados desse período
    if (range.start && range.end) {
      const startDate = setStartOfDay(new Date(range.start));
      const endDate = setEndOfDay(new Date(range.end));

      // Criar um Map para armazenar os contatos por data
      const contactsByDate = new Map<string, number>();

      // Inicializar todas as datas no range com 0
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = formatDateBR(new Date(currentDate));
        contactsByDate.set(dateKey, 0);
        labels.push(dateKey);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Contar os contatos para cada data
      contacts.forEach(contact => {
        const contactDate = new Date(contact.createdAt);
        if (contactDate >= startDate && contactDate <= endDate) {
          const dateKey = formatDateBR(new Date(contactDate));
          const currentCount = contactsByDate.get(dateKey) || 0;
          contactsByDate.set(dateKey, currentCount + 1);
        }
      });

      // Preencher o array de dados na mesma ordem das labels
      data = labels.map(label => contactsByDate.get(label) || 0);

    } else if (period) {
      const today = setEndOfDay(new Date());
      const contactsByDate = new Map<string, number>();

      switch(period) {
        case 'diario':
          // Inicializar os últimos 7 dias
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = formatDateBR(new Date(date));
            const label = i === 0 ? 'Hoje' : dateStr;
            labels.push(label);
            contactsByDate.set(label, 0);
          }

          // Contar contatos para cada dia
          contacts.forEach(contact => {
            const contactDate = new Date(contact.createdAt);
            const daysAgo = Math.floor((today.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysAgo >= 0 && daysAgo <= 6) {
              const dateStr = formatDateBR(new Date(contactDate));
              const label = daysAgo === 0 ? 'Hoje' : dateStr;
              const currentCount = contactsByDate.get(label) || 0;
              contactsByDate.set(label, currentCount + 1);
            }
          });
          break;

        case 'semanal':
          const firstDayOfMonth = setStartOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
          const lastDayOfMonth = setEndOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));
          
          // Inicializar todas as semanas do mês
          let weekStart = new Date(firstDayOfMonth);
          while (weekStart <= lastDayOfMonth) {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const label = `${formatDateBR(new Date(weekStart))} - ${formatDateBR(new Date(weekEnd))}`;
            labels.push(label);
            contactsByDate.set(label, 0);
            
            weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() + 1);
          }

          // Contar contatos para cada semana
          contacts.forEach(contact => {
            const contactDate = new Date(contact.createdAt);
            if (contactDate >= firstDayOfMonth && contactDate <= lastDayOfMonth) {
              let weekStart = new Date(firstDayOfMonth);
              while (weekStart <= lastDayOfMonth) {
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                if (contactDate >= weekStart && contactDate <= weekEnd) {
                  const label = `${formatDateBR(new Date(weekStart))} - ${formatDateBR(new Date(weekEnd))}`;
                  const currentCount = contactsByDate.get(label) || 0;
                  contactsByDate.set(label, currentCount + 1);
                  break;
                }
                
                weekStart = new Date(weekEnd);
                weekStart.setDate(weekStart.getDate() + 1);
              }
            }
          });
          break;

        case 'mensal':
          const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
          ];
          
          // Inicializar todos os meses
          for (let month = 0; month < 12; month++) {
            const label = `${months[month]}/${today.getFullYear()}`;
            labels.push(label);
            contactsByDate.set(label, 0);
          }

          // Contar contatos para cada mês
          contacts.forEach(contact => {
            const contactDate = new Date(contact.createdAt);
            if (contactDate.getFullYear() === today.getFullYear()) {
              const label = `${months[contactDate.getMonth()]}/${today.getFullYear()}`;
              const currentCount = contactsByDate.get(label) || 0;
              contactsByDate.set(label, currentCount + 1);
            }
          });
          break;
      }

      // Preencher o array de dados na mesma ordem das labels
      data = labels.map(label => contactsByDate.get(label) || 0);
    }

    // Atualizar o estado do gráfico
    setGoalData({
      labels,
      datasets: [
        {
          ...goalData.datasets[0],
          data,
        }
      ]
    });

    // Calcular o progresso
    if (data.length > 0) {
      const currentValue = data[data.length - 1];
      const previousValue = data[data.length - 2] || 0;
      const progress = previousValue > 0 
        ? Math.round((currentValue / previousValue) * 100)
        : 100;
      setGoalProgress(progress);
    }
  };

  // Função para lidar com mudança nas datas
  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const newDate = value ? new Date(value) : null;
    let newRange = { ...dateRange };

    if (type === 'start' && newDate) {
      newRange.start = newDate;
      // Se não tiver data final, define como um mês após a data inicial
      if (!newRange.end) {
        const endDate = new Date(newDate);
        endDate.setMonth(endDate.getMonth() + 1);
        if (endDate > new Date()) {
          endDate.setTime(new Date().getTime());
        }
        newRange.end = endDate;
      }
    } else if (type === 'end' && newDate) {
      newRange.end = newDate;
      // Se não tiver data inicial, define como um mês antes da data final
      if (!newRange.start) {
        const startDate = new Date(newDate);
        startDate.setMonth(startDate.getMonth() - 1);
        newRange.start = startDate;
      }
    }

    setDateRange(newRange);
    setSelectedPeriod(null); // Reseta a seleção de período quando muda a data
    if (newRange.start && newRange.end) {
      processContactsData(users, null, newRange);
    }
  };

  // Atualizar a função handlePeriodChange
  const handlePeriodChange = (period: string) => {
    if (selectedPeriod === period) {
      // Se clicar no mesmo botão que já está selecionado, desmarca
      setSelectedPeriod(null);
      // Processa os dados com o range de datas atual
      if (dateRange.start && dateRange.end) {
        processContactsData(users, null, dateRange);
      }
    } else {
      setSelectedPeriod(period);
      setDateRange({ start: null, end: null }); // Reseta o date range ao selecionar um período
      processContactsData(users, period, { start: null, end: null });
    }
  };

  // Função para filtrar contatos pelo período
  const filterContactsByPeriod = (contacts: Contact[], startDate: Date | null, endDate: Date | null): Contact[] => {
    if (!startDate || !endDate) return contacts;

    const start = setStartOfDay(new Date(startDate));
    const end = setEndOfDay(new Date(endDate));

    return contacts.filter(contact => {
      const contactDate = new Date(contact.createdAt);
      return contactDate >= start && contactDate <= end;
    });
  };

  // Adicione esta função para calcular as tarefas da página atual usando os contatos filtrados
  const getCurrentPageTasks = () => {
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    return filteredUsers.slice(indexOfFirstTask, indexOfLastTask);
  };

  // Adicione esta função para mudar de página
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Modifique a constante para usar os contatos filtrados
  const totalPages = Math.ceil(filteredUsers.length / tasksPerPage);

  const handleDetailsClick = (contactId: number) => {
    navigate('/crm', { state: { highlightContactId: contactId } });
  };

  return (
    <div className="dashboard-container">
      <div className={`dashboard-content ${!sectorSelected ? 'dashboard-disabled' : ''}`}>
        <div className="dashboard-calendar-container">
          <div className="dashboard-calendar-wrapper">
            <div className="custom-datepicker-wrapper">
              <DatePicker
                selected={dateRange.start}
                onChange={(date) => handleDateRangeChange('start', date ? date.toISOString() : '')}
                selectsStart
                startDate={dateRange.start}
                endDate={dateRange.end}
                maxDate={dateRange.end || new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecione a data inicial"
                disabled={!sectorSelected}
                customInput={<CustomInput label="Data Inicial" />}
                calendarClassName="custom-calendar"
              />
              <DatePicker
                selected={dateRange.end}
                onChange={(date) => handleDateRangeChange('end', date ? date.toISOString() : '')}
                selectsEnd
                startDate={dateRange.start}
                endDate={dateRange.end}
                minDate={dateRange.start || undefined}
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecione a data final"
                disabled={!sectorSelected}
                customInput={<CustomInput label="Data Final" />}
                calendarClassName="custom-calendar"
              />
            </div>
          </div>
          <div className="dashboard-period-selector">
            <span>Período:</span>
            <div className="dashboard-period-buttons">
              <button 
                className={`dashboard-period-button ${selectedPeriod === 'diario' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('diario')}
                disabled={!sectorSelected}
              >
                Diário
              </button>
              <button 
                className={`dashboard-period-button ${selectedPeriod === 'semanal' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('semanal')}
                disabled={!sectorSelected}
              >
                Semanal
              </button>
              <button 
                className={`dashboard-period-button ${selectedPeriod === 'mensal' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('mensal')}
                disabled={!sectorSelected}
              >
                Mensal
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            {isLoadingNewContacts ? (
              <div className="card-loading">
                <div className="card-loading-spinner" />
                <span className="loading-text">Carregando novos contatos...</span>
              </div>
            ) : (
              <>
                <div className="dashboard-stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.47 1.72a.75.75 0 011.06 0l3 3a.75.75 0 01-1.06 1.06l-1.72-1.72V7.5h-1.5V4.06L9.53 5.78a.75.75 0 01-1.06-1.06l3-3zM11.25 7.5V15a.75.75 0 001.5 0V7.5h3.75a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3h3.75z" />
                  </svg>
                </div>
                <div className="dashboard-stat-content">
                  <h3>Novos contatos</h3>
                  <div className="dashboard-stat-value">{tasksDone}</div>
                </div>
              </>
            )}
          </div>
          
          <div className="dashboard-stat-card">
            {isLoadingActiveContacts ? (
              <div className="card-loading">
                <div className="card-loading-spinner" />
                <span className="loading-text">Carregando contatos ativos...</span>
              </div>
            ) : (
              <>
                <div className="dashboard-stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.25a.75.75 0 01.75.75v16.19l6.22-6.22a.75.75 0 111.06 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 111.06-1.06l6.22 6.22V3a.75.75 0 01.75-.75z" />
                  </svg>
                </div>
                <div className="dashboard-stat-content">
                  <h3>Contatos ativos</h3>
                  <div className="dashboard-stat-value">{tasksPending}</div>
                </div>
              </>
            )}
          </div>
          
          <div className="dashboard-stat-card">
            {isLoadingComparison ? (
              <div className="card-loading">
                <div className="card-loading-spinner" />
                <span className="loading-text">Carregando comparativo mensal...</span>
              </div>
            ) : (
              <>
                <div className="dashboard-stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="dashboard-stat-content">
                  <h3>Comparativo ao mês anterior</h3>
                  <div className="dashboard-stat-value">
                    {goalProgress === -1 ? (
                      <span className="no-data">Dados não disponíveis</span>
                    ) : (
                      `${goalProgress}%`
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="dashboard-grid-container">
          <div className="dashboard-chart-card dashboard-goal-chart">
            {isLoadingChart ? (
              <div className="card-loading">
                <div className="card-loading-spinner" />
                <span className="loading-text">Carregando gráfico de progresso...</span>
              </div>
            ) : (
              <>
                <div className="dashboard-chart-header">
                  <h3>Progresso de Contatos por Período</h3>
                </div>
                <div className="dashboard-chart-container">
                  {sectorSelected || goalData.labels.length > 0 ? (
                    <Bar data={goalData} options={goalOptions} />
                  ) : (
                    <div className="dashboard-no-data">
                      <div className="dashboard-no-data-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                        </svg>
                      </div>
                      <p>Sem dados disponíveis</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="dashboard-tasks-card">
            {isLoadingMonthContacts ? (
              <div className="card-loading">
                <div className="card-loading-spinner" />
                <span className="loading-text">Carregando contatos do mês...</span>
              </div>
            ) : (
              <>
                <div className="dashboard-tasks-header">
                  <h3>Contatos este Mês</h3>
                  <span className="dashboard-tasks-count">{completedTasks.length} contatos</span>
                </div>
                <div className="dashboard-tasks-list">
                  {completedTasks.length > 0 ? (
                    completedTasks.map(contact => (
                      <div key={contact.id} className="dashboard-task-item">
                        <div className="dashboard-task-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="dashboard-task-content">
                          <h4>{contact.name}</h4>
                          <div className="dashboard-task-meta">
                            <span className="dashboard-task-date">{contact.email}</span>
                            <span className="dashboard-task-status">{contact.number}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dashboard-no-tasks">
                      <div className="dashboard-no-tasks-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.375 3.75a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0v-3.75zm1.5-1.5a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0v-3.75a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p>Nenhum contato este mês</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="dashboard-pending-tasks-section">
          <div className="dashboard-chart-card">
            {isLoadingActiveTable ? (
              <div className="card-loading">
                <div className="card-loading-spinner" />
                <span className="loading-text">Carregando tabela de contatos...</span>
              </div>
            ) : (
              <>
                <div className="dashboard-chart-header">
                  <h3>Contatos ativos por período</h3>
                  <span className="dashboard-tasks-count">Mostrando {getCurrentPageTasks().length} de {filteredUsers.length} contatos</span>
                </div>
                
                {filteredUsers.length > 0 ? (
                  <>
                    <div className="dashboard-pending-tasks-table-container">
                      <table className="dashboard-pending-tasks-table">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Telefone</th>
                            <th>Tag</th>
                            <th>Responsável</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCurrentPageTasks().map(contact => {
                            const tag = tags.find(t => t.id === contact.tagId);
                            const assignedUser = allUsers.find(u => u.id === contact.assignedTo);
                            
                            return (
                              <tr key={contact.id} className="dashboard-pending-task-row">
                                <td className="dashboard-pending-task-title">{contact.name}</td>
                                <td>{contact.number || 'Não informado'}</td>
                                <td>
                                  {tag ? (
                                    <span 
                                      className="contact-tag"
                                      style={{
                                        backgroundColor: `${tag.color}1A`,
                                        color: tag.color,
                                        border: `1px solid ${tag.color}40`
                                      }}
                                    >
                                      {tag.name}
                                    </span>
                                  ) : (
                                    <span className="contact-tag no-tag">
                                      Não atribuído
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {assignedUser ? assignedUser.name : 'Não atribuído'}
                                </td>
                                <td>
                                  <button 
                                    className="dashboard-action-button"
                                    onClick={() => handleDetailsClick(contact.id)}
                                  >
                                    Detalhes
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="dashboard-pagination">
                        <button 
                          className="dashboard-pagination-button"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </button>
                        <span className="dashboard-pagination-info">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button 
                          className="dashboard-pagination-button"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Próximo
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="dashboard-no-tasks dashboard-no-pending-tasks">
                    <div className="dashboard-no-tasks-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.375 3.75a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0v-3.75zm1.5-1.5a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0v-3.75a.75.75 0 01.75-.75z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>Nenhum contato no período selecionado</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
