import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import '../styles/Dashboard/Dashboard.css';
import SessionService from '../services/SessionService';

const Dashboard: React.FC = () => {
  // Dados mockados para métricas de CRM
  const [tasksDone, setTasksDone] = useState<number>(42);
  const [tasksPending, setTasksPending] = useState<number>(18);
  const [goalProgress, setGoalProgress] = useState<number>(78); // porcentagem
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(new Date().setDate(new Date().getDate() - 30)),
    new Date()
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("mensal");
  
  // Dados mockados para o gráfico de barras horizontal
  const [goalData, setGoalData] = useState<any>({
    labels: ['Vendas', 'Marketing', 'Suporte', 'Desenvolvimento', 'Financeiro', 'Recursos Humanos'],
    datasets: [
      {
        label: 'Meta',
        data: [100, 100, 100, 100, 100, 100],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        borderSkipped: false,
        borderRadius: 4,
      },
      {
        label: 'Alcançado',
        data: [85, 92, 78, 65, 88, 72],
        backgroundColor: 'rgba(0, 194, 255, 0.7)',
        borderColor: 'rgba(0, 194, 255, 1)',
        borderWidth: 1,
        borderSkipped: false,
        borderRadius: 4,
      }
    ],
  });
  
  // Tarefas concluídas este mês
  const [completedTasks, setCompletedTasks] = useState<any[]>([
    { id: 1, title: 'Reunião com cliente XYZ', date: '15/03/2023', status: 'Concluída' },
    { id: 2, title: 'Enviar proposta comercial', date: '18/03/2023', status: 'Concluída' },
    { id: 3, title: 'Atualizar cadastro de clientes', date: '20/03/2023', status: 'Concluída' },
    { id: 4, title: 'Fazer follow-up com leads', date: '22/03/2023', status: 'Concluída' },
    { id: 5, title: 'Preparar relatório mensal', date: '25/03/2023', status: 'Concluída' },
    { id: 6, title: 'Revisar contratos pendentes', date: '27/03/2023', status: 'Concluída' },
    { id: 7, title: 'Agendar demonstração do produto', date: '28/03/2023', status: 'Concluída' },
  ]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const goalOptions = {
    indexAxis: 'y' as const,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        max: 120,
        ticks: {
          callback: (value: any) => value + '%',
          color: '#a0a0a0',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        }
      },
      y: {
        ticks: {
          color: '#a0a0a0',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
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
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(0, 194, 255, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: (tooltipItem: any) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}%`,
        },
      },
    },
  };

  const fetchMockData = async (period: string = selectedPeriod) => {
    try {
      setIsLoading(true);
      
      // Simular carregamento
      setTimeout(() => {
        // Atualizar dados com base no período selecionado
        let newData;
        switch(period) {
          case "diario":
            newData = {
              ...goalData,
              datasets: [
                {
                  ...goalData.datasets[0],
                  data: [100, 100, 100, 100, 100, 100],
                },
                {
                  ...goalData.datasets[1],
                  data: [45, 62, 58, 35, 48, 42],
                }
              ]
            };
            setGoalProgress(48);
            break;
          case "trimestral":
            newData = {
              ...goalData,
              datasets: [
                {
                  ...goalData.datasets[0],
                  data: [100, 100, 100, 100, 100, 100],
                },
                {
                  ...goalData.datasets[1],
                  data: [92, 95, 88, 82, 94, 86],
                }
              ]
            };
            setGoalProgress(89);
            break;
          case "anual":
            newData = {
              ...goalData,
              datasets: [
                {
                  ...goalData.datasets[0],
                  data: [100, 100, 100, 100, 100, 100],
                },
                {
                  ...goalData.datasets[1],
                  data: [95, 97, 92, 88, 96, 91],
                }
              ]
            };
            setGoalProgress(93);
            break;
          default: // mensal
            newData = {
              ...goalData,
              datasets: [
                {
                  ...goalData.datasets[0],
                  data: [100, 100, 100, 100, 100, 100],
                },
                {
                  ...goalData.datasets[1],
                  data: [85, 92, 78, 65, 88, 72],
                }
              ]
            };
            setGoalProgress(78);
        }
        
        setGoalData(newData);
        setIsLoading(false);
      }, 800);
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Simular carregamento inicial
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
  }, []);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = new Date(e.target.value);
    setDateRange([newStartDate, dateRange[1]]);
    fetchMockData();
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    setDateRange([dateRange[0], newEndDate]);
    fetchMockData();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    fetchMockData();
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    fetchMockData(period);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Adicionar este novo estado para tarefas pendentes
  const [pendingTasks, setPendingTasks] = useState<any[]>([
    { 
      id: 1, 
      title: 'Preparar apresentação para cliente', 
      startDate: '10/04/2023', 
      endDate: '15/04/2023', 
      priority: 'Alta',
      assignedTo: 'Carlos Silva'
    },
    { 
      id: 2, 
      title: 'Atualizar proposta comercial', 
      startDate: '12/04/2023', 
      endDate: '14/04/2023', 
      priority: 'Média',
      assignedTo: 'Ana Oliveira'
    },
    { 
      id: 3, 
      title: 'Reunião com equipe de desenvolvimento', 
      startDate: '15/04/2023', 
      endDate: '15/04/2023', 
      priority: 'Alta',
      assignedTo: 'Marcos Santos'
    },
    { 
      id: 4, 
      title: 'Revisar feedback dos clientes', 
      startDate: '11/04/2023', 
      endDate: '18/04/2023', 
      priority: 'Baixa',
      assignedTo: 'Juliana Costa'
    },
    { 
      id: 5, 
      title: 'Finalizar relatório trimestral', 
      startDate: '05/04/2023', 
      endDate: '20/04/2023', 
      priority: 'Alta',
      assignedTo: 'Roberto Almeida'
    },
    { 
      id: 6, 
      title: 'Preparar material de treinamento', 
      startDate: '18/04/2023', 
      endDate: '25/04/2023', 
      priority: 'Média',
      assignedTo: 'Fernanda Lima'
    },
    { 
      id: 7, 
      title: 'Atualizar documentação técnica', 
      startDate: '14/04/2023', 
      endDate: '21/04/2023', 
      priority: 'Baixa',
      assignedTo: 'Paulo Mendes'
    },
    { 
      id: 8, 
      title: 'Revisar orçamento do projeto', 
      startDate: '17/04/2023', 
      endDate: '19/04/2023', 
      priority: 'Alta',
      assignedTo: 'Mariana Costa'
    },
    { 
      id: 9, 
      title: 'Configurar ambiente de testes', 
      startDate: '20/04/2023', 
      endDate: '22/04/2023', 
      priority: 'Média',
      assignedTo: 'Ricardo Souza'
    },
    { 
      id: 10, 
      title: 'Analisar métricas de desempenho', 
      startDate: '16/04/2023', 
      endDate: '18/04/2023', 
      priority: 'Baixa',
      assignedTo: 'Camila Santos'
    }
  ]);

  // Adicione estes estados para controlar a paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [tasksPerPage] = useState<number>(5);

  // Adicione esta função para calcular as tarefas da página atual
  const getCurrentPageTasks = () => {
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    return pendingTasks.slice(indexOfFirstTask, indexOfLastTask);
  };

  // Adicione esta função para mudar de página
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Adicione esta constante para calcular o número total de páginas
  const totalPages = Math.ceil(pendingTasks.length / tasksPerPage);

  // Adicione este estado para controlar se há um setor selecionado
  const [sectorSelected, setSectorSelected] = useState<boolean>(false);

  // Modifique o useEffect para atualizar os dados quando o setor muda
  useEffect(() => {
    const checkSector = () => {
      const selectedSector = SessionService.getSession('selectedSector');
      const hasSector = !!selectedSector && selectedSector !== '';
      setSectorSelected(hasSector);
      
      // Atualizar dados com base na presença de um setor
      if (hasSector) {
        // Dados normais quando há setor selecionado
        setTasksDone(42);
        setTasksPending(18);
        setGoalProgress(78);
        
        setGoalData({
          labels: ['Vendas', 'Marketing', 'Suporte', 'Desenvolvimento', 'Financeiro', 'Recursos Humanos'],
          datasets: [
            {
              label: 'Meta',
              data: [100, 100, 100, 100, 100, 100],
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              borderSkipped: false,
              borderRadius: 4,
            },
            {
              label: 'Alcançado',
              data: [85, 92, 78, 65, 88, 72],
              backgroundColor: 'rgba(0, 194, 255, 0.7)',
              borderColor: 'rgba(0, 194, 255, 1)',
              borderWidth: 1,
              borderSkipped: false,
              borderRadius: 4,
            }
          ],
        });
        
        setCompletedTasks([
          { id: 1, title: 'Reunião com cliente XYZ', date: '15/03/2023', status: 'Concluída' },
          { id: 2, title: 'Enviar proposta comercial', date: '18/03/2023', status: 'Concluída' },
          { id: 3, title: 'Atualizar cadastro de clientes', date: '20/03/2023', status: 'Concluída' },
          { id: 4, title: 'Fazer follow-up com leads', date: '22/03/2023', status: 'Concluída' },
          { id: 5, title: 'Preparar relatório mensal', date: '25/03/2023', status: 'Concluída' },
          { id: 6, title: 'Revisar contratos pendentes', date: '27/03/2023', status: 'Concluída' },
          { id: 7, title: 'Agendar demonstração do produto', date: '28/03/2023', status: 'Concluída' },
        ]);
        
        setPendingTasks([
          // Dados existentes de tarefas pendentes
        ]);
      } else {
        // Dados vazios quando não há setor selecionado
        setTasksDone(0);
        setTasksPending(0);
        setGoalProgress(0);
        
        setGoalData({
          labels: [],
          datasets: [
            {
              label: 'Meta',
              data: [],
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              borderSkipped: false,
              borderRadius: 4,
            },
            {
              label: 'Alcançado',
              data: [],
              backgroundColor: 'rgba(0, 194, 255, 0.7)',
              borderColor: 'rgba(0, 194, 255, 1)',
              borderWidth: 1,
              borderSkipped: false,
              borderRadius: 4,
            }
          ],
        });
        
        setCompletedTasks([]);
        setPendingTasks([]);
      }
    };
    
    checkSector();
    
    // Adicione um listener para detectar mudanças no sessionStorage
    const handleStorageChange = () => {
      checkSector();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar a cada 2 segundos (como fallback)
    const intervalId = setInterval(checkSector, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="dashboard-container">
      {isLoading && (
        <div className="dashboard-loading-overlay">
          <div className="dashboard-spinner"></div>
        </div>
      )}
      
      <div className={`dashboard-content ${!sectorSelected ? 'dashboard-disabled' : ''}`}>
        <div className="dashboard-calendar-container">
          <div className="dashboard-calendar-wrapper">
            <label>Data de Referência:</label>
            <input 
              type="date" 
              value={formatDateForInput(selectedDate)} 
              onChange={handleDateChange}
              className="dashboard-calendar-input"
              disabled={!sectorSelected}
            />
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
                className={`dashboard-period-button ${selectedPeriod === 'mensal' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('mensal')}
                disabled={!sectorSelected}
              >
                Mensal
              </button>
              <button 
                className={`dashboard-period-button ${selectedPeriod === 'trimestral' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('trimestral')}
                disabled={!sectorSelected}
              >
                Trimestral
              </button>
              <button 
                className={`dashboard-period-button ${selectedPeriod === 'anual' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('anual')}
                disabled={!sectorSelected}
              >
                Anual
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.47 1.72a.75.75 0 011.06 0l3 3a.75.75 0 01-1.06 1.06l-1.72-1.72V7.5h-1.5V4.06L9.53 5.78a.75.75 0 01-1.06-1.06l3-3zM11.25 7.5V15a.75.75 0 001.5 0V7.5h3.75a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3h3.75z" />
              </svg>
            </div>
            <div className="dashboard-stat-content">
              <h3>Tarefas Concluídas</h3>
              <div className="dashboard-stat-value">{tasksDone}</div>
            </div>
          </div>
          
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.25a.75.75 0 01.75.75v16.19l6.22-6.22a.75.75 0 111.06 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 111.06-1.06l6.22 6.22V3a.75.75 0 01.75-.75z" />
              </svg>
            </div>
            <div className="dashboard-stat-content">
              <h3>Tarefas Pendentes</h3>
              <div className="dashboard-stat-value">{tasksPending}</div>
            </div>
          </div>
          
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="dashboard-stat-content">
              <h3>Alcance da Meta</h3>
              <div className="dashboard-stat-value">{goalProgress}%</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-container">
          <div className="dashboard-chart-card dashboard-goal-chart">
            <div className="dashboard-chart-header">
              <h3>Progresso de Metas por Departamento</h3>
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
          </div>

          <div className="dashboard-tasks-card">
            <div className="dashboard-tasks-header">
              <h3>Tarefas Concluídas este Mês</h3>
              <span className="dashboard-tasks-count">{completedTasks.length} tarefas</span>
            </div>
            <div className="dashboard-tasks-list">
              {completedTasks.length > 0 ? (
                completedTasks.map(task => (
                  <div key={task.id} className="dashboard-task-item">
                    <div className="dashboard-task-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="dashboard-task-content">
                      <h4>{task.title}</h4>
                      <div className="dashboard-task-meta">
                        <span className="dashboard-task-date">{task.date}</span>
                        <span className="dashboard-task-status">{task.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dashboard-no-tasks">
                  <div className="dashboard-no-tasks-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zM6 12a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V12zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 15a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V15zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 18a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V18zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p>Nenhuma tarefa concluída</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-pending-tasks-section">
          <div className="dashboard-chart-card">
            <div className="dashboard-chart-header">
              <h3>Tarefas Pendentes</h3>
              <span className="dashboard-tasks-count">{pendingTasks.length} tarefas</span>
            </div>
            
            {pendingTasks.length > 0 ? (
              <>
                <div className="dashboard-pending-tasks-table-container">
                  <table className="dashboard-pending-tasks-table">
                    <thead>
                      <tr>
                        <th>Tarefa</th>
                        <th>Data de Início</th>
                        <th>Data de Término</th>
                        <th>Prioridade</th>
                        <th>Responsável</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCurrentPageTasks().map(task => (
                        <tr key={task.id} className="dashboard-pending-task-row">
                          <td className="dashboard-pending-task-title">{task.title}</td>
                          <td>{task.startDate}</td>
                          <td>{task.endDate}</td>
                          <td>
                            <span className={`dashboard-priority-badge priority-${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td>{task.assignedTo}</td>
                        </tr>
                      ))}
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
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="pagination-icon">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-4.5A.75.75 0 0010 7z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="dashboard-pagination-info">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button 
                      className="dashboard-pagination-button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="pagination-icon">
                        <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8 3a.75.75 0 00.75-.75v-4.5c0-.414-.336-.75-.75-.75h-4.5a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75z" clipRule="evenodd" />
                      </svg>
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
                <p>Nenhuma tarefa pendente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
