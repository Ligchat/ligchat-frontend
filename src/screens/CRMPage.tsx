import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core';
import { 
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './CRMPage.css';
import Modal from '../components/Modal';
// Importando ícones
import { 
  FiPhone, 
  FiMail, 
  FiUser, 
  FiCalendar, 
  FiClock, 
  FiTag, 
  FiEdit, 
  FiPlus, 
  FiMessageSquare,
  FiInfo,
  FiCheckSquare,
  FiFileText, 
  FiSend,
  FiGrid,
  FiList,
  FiSettings,
  FiFilter,
  FiSearch,
  FiChevronRight
} from 'react-icons/fi';
import CardSidebar from '../components/CardSidebar';
import FilterPanel from '../components/FilterPanel';

interface Card {
  id: string;
  title: string;
  content: string;
  labels?: string[];
  email?: string;
  phone?: string;
  status?: string;
  assignedTo?: string;
  assigneeAvatar?: string;
  createdAt?: string;
  lastContact?: string;
  notes?: string[];
  priority?: 'high' | 'medium' | 'low';
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

const CRMPage: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([
    { 
      id: 'col1', 
      title: 'Novos Leads', 
      cards: [
        { 
          id: 'card1', 
          title: 'João Silva', 
          content: 'Interessado em produto A',
          email: 'joao.silva@email.com',
          phone: '(11) 98765-4321',
          status: 'Novo',
          assignedTo: 'Carlos Vendas',
          assigneeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          createdAt: '2023-05-15',
          lastContact: '2023-05-20',
          notes: ['Cliente encontrado na feira de negócios', 'Demonstrou interesse no plano premium'],
          priority: 'medium'
        }, 
        { 
          id: 'card2', 
          title: 'Maria Santos', 
          content: 'Solicitou orçamento para implementação do sistema em 3 filiais. Precisa de resposta até o final da semana.',
          email: 'maria.santos@email.com',
          phone: '(11) 91234-5678',
          status: 'Orçamento',
          assignedTo: 'Ana Vendas',
          assigneeAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          createdAt: '2023-05-18',
          lastContact: '2023-05-19',
          priority: 'high'
        }
      ] 
    },
    { 
      id: 'col2', 
      title: 'Em Contato', 
      cards: [
        { 
          id: 'card3', 
          title: 'Pedro Lima', 
          content: 'Aguardando retorno sobre proposta enviada. Fazer follow-up na próxima semana.',
          email: 'pedro.lima@email.com',
          phone: '(11) 99876-5432',
          status: 'Em análise',
          assignedTo: 'Carlos Vendas',
          assigneeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          createdAt: '2023-05-10',
          lastContact: '2023-05-17',
          priority: 'low'
        }
      ] 
    },
    { 
      id: 'col3', 
      title: 'Negociação', 
      cards: [
        { 
          id: 'card4', 
          title: 'Ana Costa', 
          content: 'Proposta enviada, cliente solicitou desconto adicional. Agendar reunião para discutir termos.',
          email: 'ana.costa@email.com',
          phone: '(11) 97654-3210',
          status: 'Proposta',
          assignedTo: 'Ana Vendas',
          assigneeAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          createdAt: '2023-05-05',
          lastContact: '2023-05-15',
          labels: ['Prioridade Alta'],
          priority: 'high'
        }
      ] 
    },
  ]);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'column' | 'card' | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showNewColumnModal, setShowNewColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isCreatingNewCard, setIsCreatingNewCard] = useState(false);
  const [newCardColumnId, setNewCardColumnId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    dateRange: {
      from: '',
      to: ''
    }
  });

  // Configuração melhorada dos sensores para movimentação mais suave
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Aumenta a distância mínima para iniciar o arrasto
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Configuração da animação de drop para tornar mais suave
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Determina se estamos arrastando uma coluna ou um card
    if (columns.some(col => col.id === active.id)) {
      setActiveType('column');
      document.body.classList.add('dragging-column');
    } else {
      setActiveType('card');
      document.body.classList.add('dragging-card');
    }
  };

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    // Podemos adicionar lógica aqui para melhorar a experiência durante o arrasto
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Remove classes do body
    document.body.classList.remove('dragging-column', 'dragging-card');
    
    if (!over) {
      setActiveId(null);
      setActiveType(null);
      return;
    }
    
    if (active.id !== over.id) {
      if (activeType === 'column') {
        // Reordenar colunas com uma abordagem mais robusta
        setColumns(columns => {
          const oldIndex = columns.findIndex(col => col.id === active.id);
          const newIndex = columns.findIndex(col => col.id === over.id);
          
          // Usa arrayMove para garantir uma reordenação correta
          return arrayMove(columns, oldIndex, newIndex);
        });
      } else if (activeType === 'card') {
        // Extrair IDs da coluna e do card
        const activeIdParts = (active.id as string).split(':');
        const overIdParts = (over.id as string).split(':');
        
        const activeColumnId = activeIdParts[0];
        const activeCardId = activeIdParts[1];
        
        let overColumnId = overIdParts[0];
        let overCardId = overIdParts[1];
        
        // Verifica se estamos sobre uma coluna ou um card
        const isOverColumn = !overCardId;
        if (isOverColumn) {
          overColumnId = over.id as string;
        }
        
        setColumns(columns => {
          // Encontrar colunas de origem e destino
          const sourceColumn = columns.find(col => col.id === activeColumnId);
          const destColumn = columns.find(col => col.id === overColumnId);
          
          if (!sourceColumn || !destColumn) return columns;
          
          // Copiar o array de colunas
          const newColumns = [...columns];
          
          // Encontrar índices
          const sourceColumnIndex = columns.findIndex(col => col.id === activeColumnId);
          const destColumnIndex = columns.findIndex(col => col.id === overColumnId);
          
          // Se estamos na mesma coluna
          if (sourceColumnIndex === destColumnIndex) {
            const sourceCardIndex = sourceColumn.cards.findIndex(card => card.id === activeCardId);
            let destCardIndex;
            
            if (isOverColumn) {
              // Se estamos sobre a coluna, adiciona no final
              destCardIndex = sourceColumn.cards.length;
            } else {
              // Se estamos sobre um card específico
              destCardIndex = sourceColumn.cards.findIndex(card => card.id === overCardId);
            }
            
            // Cria uma cópia dos cards
            const newCards = [...sourceColumn.cards];
            
            // Remove o card da posição original
            const [movedCard] = newCards.splice(sourceCardIndex, 1);
            
            // Insere o card na nova posição
            newCards.splice(destCardIndex, 0, movedCard);
            
            // Atualiza a coluna
            newColumns[sourceColumnIndex] = {
              ...sourceColumn,
              cards: newCards
            };
          } else {
            // Movendo entre colunas diferentes
            const sourceCardIndex = sourceColumn.cards.findIndex(card => card.id === activeCardId);
            
            // Cria cópias dos arrays de cards
            const newSourceCards = [...sourceColumn.cards];
            const newDestCards = [...destColumn.cards];
            
            // Remove o card da coluna de origem
            const [movedCard] = newSourceCards.splice(sourceCardIndex, 1);
            
            // Determina a posição de destino
            let destCardIndex;
            
            if (isOverColumn) {
              // Se estamos sobre a coluna, adiciona no final
              destCardIndex = newDestCards.length;
            } else {
              // Se estamos sobre um card específico
              destCardIndex = newDestCards.findIndex(card => card.id === overCardId);
              
              if (destCardIndex === -1) {
                // Fallback para o final da lista se não encontrar
                destCardIndex = newDestCards.length;
              }
            }
            
            // Insere o card na nova posição
            newDestCards.splice(destCardIndex, 0, movedCard);
            
            // Atualiza as colunas
            newColumns[sourceColumnIndex] = {
              ...sourceColumn,
              cards: newSourceCards
            };
            
            newColumns[destColumnIndex] = {
              ...destColumn,
              cards: newDestCards
            };
        }
        
        return newColumns;
      });
      }
    }
    
    setActiveId(null);
    setActiveType(null);
  };

  // Função personalizada para detecção de colisão
  const customCollisionDetection = useCallback((args: any) => {
    // Para colunas, usamos uma detecção mais precisa
    if (activeType === 'column') {
      // Primeiro tentamos com pointerWithin que é mais preciso para movimento horizontal
      const pointerCollisions = pointerWithin(args);
      
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }
      
      // Se não encontrar colisões, usamos rectIntersection como fallback
      return rectIntersection(args);
    }
    
    // Para cards, continuamos usando closestCorners
    return closestCorners(args);
  }, [activeType]);

  // Função para abrir o painel lateral
  const openCardDetails = (columnId: string, cardId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column) {
      const card = column.cards.find(c => c.id === cardId);
      if (card) {
        setSelectedCard(card);
        setSidebarOpen(true);
      }
    }
  };

  // Função para salvar as alterações do card
  const saveCardChanges = (updatedCard: Card) => {
    setColumns(columns => {
      const newColumns = [...columns];
      const columnIndex = newColumns.findIndex(col => 
        col.cards.some(card => card.id === updatedCard.id)
      );
      
      if (columnIndex !== -1) {
        const cardIndex = newColumns[columnIndex].cards.findIndex(
          card => card.id === updatedCard.id
        );
        
        if (cardIndex !== -1) {
          newColumns[columnIndex].cards[cardIndex] = {...updatedCard};
        }
      }
      
      return newColumns;
    });
    
    setSelectedCard(updatedCard);
  };

  // Função para adicionar nova coluna
  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      const newColumn: Column = {
        id: `col${columns.length + 1}`,
        title: newColumnTitle.trim(),
        cards: []
      };
      
      setColumns([...columns, newColumn]);
      setNewColumnTitle('');
      setShowNewColumnModal(false);
    }
  };

  // Adicione a função para criar um novo card
  const handleAddCard = (columnId: string) => {
    setNewCardColumnId(columnId);
    setIsCreatingNewCard(true);
    setSidebarOpen(true);
  };

  // Adicione esta função para salvar um novo card
  const saveNewCard = (newCard: Card) => {
    if (newCardColumnId) {
      setColumns(columns => {
        const newColumns = [...columns];
        const columnIndex = newColumns.findIndex(col => col.id === newCardColumnId);
        
        if (columnIndex !== -1) {
          newColumns[columnIndex] = {
            ...newColumns[columnIndex],
            cards: [...newColumns[columnIndex].cards, newCard]
          };
        }
        
        return newColumns;
      });
      
      setIsCreatingNewCard(false);
      setNewCardColumnId(null);
    }
  };

  // Função para filtrar os cards com base nos critérios
  const filterCards = useCallback((cards: Card[], columnId: string) => {
    return cards.filter(card => {
      // Filtro por termo de busca (nome, conteúdo, telefone, email)
      const searchMatch = !searchTerm || 
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.content && card.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (card.phone && card.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (card.email && card.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!searchMatch) return false;
      
      // Filtro por status
      const statusMatch = !filters.status || card.status === filters.status;
      if (!statusMatch) return false;
      
      // Filtro por prioridade
      const priorityMatch = !filters.priority || card.priority === filters.priority;
      if (!priorityMatch) return false;
      
      // Filtro por responsável
      const assigneeMatch = !filters.assignedTo || 
        (card.assignedTo && card.assignedTo.toLowerCase().includes(filters.assignedTo.toLowerCase()));
      if (!assigneeMatch) return false;
      
      // Filtro por data de criação
      if (filters.dateRange.from && card.createdAt) {
        const cardDate = new Date(card.createdAt);
        const fromDate = new Date(filters.dateRange.from);
        if (cardDate < fromDate) return false;
      }
      
      if (filters.dateRange.to && card.createdAt) {
        const cardDate = new Date(card.createdAt);
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Final do dia
        if (cardDate > toDate) return false;
      }
      
      return true;
    });
  }, [searchTerm, filters]);

  // Crie uma versão filtrada das colunas
  const filteredColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      cards: filterCards(column.cards, column.id)
    }));
  }, [columns, filterCards]);

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      priority: '',
      assignedTo: '',
      dateRange: {
        from: '',
        to: ''
      }
    });
    setShowFilters(false);
  };

  // Função para atualizar um filtro específico
  const updateFilter = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para atualizar o intervalo de datas
  const updateDateRange = (field: 'from' | 'to', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  // Componente para uma coluna ordenável
  const SortableColumn = ({ column, index }: { column: Column, index: number }) => {
    const { 
      attributes, 
      listeners, 
      setNodeRef, 
      transform, 
      transition,
      isDragging
    } = useSortable({ 
      id: column.id,
      data: {
        type: 'column',
        column
      }
    });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 999 : 1,
    };

    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const setDroppableRef = useCallback((node: HTMLElement | null) => {
      setNodeRef(node);
      
      if (node) {
        node.addEventListener('dragover', () => setIsDraggingOver(true));
        node.addEventListener('dragleave', () => setIsDraggingOver(false));
        node.addEventListener('drop', () => setIsDraggingOver(false));
      }
    }, [setNodeRef]);

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`column ${isDragging ? 'is-dragging' : ''}`}
      >
        <div 
          className="column-header"
          {...attributes}
          {...listeners}
          data-count={column.cards.length}
        >
          <h2>{column.title}</h2>
        </div>
        
        <div className={`cards-container ${isDraggingOver ? 'is-dragging-over' : ''}`} ref={setDroppableRef}>
          <SortableContext 
            items={column.cards.map(card => `${column.id}:${card.id}`)} 
            strategy={verticalListSortingStrategy}
          >
            {column.cards.map((card, cardIndex) => (
              <SortableCard 
                key={card.id} 
                columnId={column.id} 
                card={card} 
                index={cardIndex}
                onCardClick={openCardDetails}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    );
  };

  // Componente para um card ordenável
  const SortableCard = ({ 
    columnId, 
    card, 
    index, 
    onCardClick 
  }: { 
    columnId: string, 
    card: Card, 
    index: number,
    onCardClick: (columnId: string, cardId: string) => void
  }) => {
    const { 
      attributes, 
      listeners, 
      setNodeRef, 
      transform, 
      transition,
      isDragging
    } = useSortable({ 
      id: `${columnId}:${card.id}`,
      data: {
        type: 'card',
        card,
        columnId
      }
    });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 999 : 1,
    };
    
    const handleClick = (e: React.MouseEvent) => {
      // Evita abrir o modal durante o arrasto
      if (!isDragging) {
        onCardClick(columnId, card.id);
      }
    };
    
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`contact-card-wrapper ${isDragging ? 'is-dragging' : ''}`}
        {...attributes}
        {...listeners}
      >
        <div className="contact-card" onClick={handleClick}>
          <h3>{card.title}</h3>
          <p>{card.content}</p>
          
          {/* Labels */}
          {(card.labels && card.labels.length > 0) || card.priority ? (
            <div className="labels">
              {card.priority && (
                <span className={`label ${card.priority}`}>
                  {card.priority === 'high' ? 'Alta Prioridade' : 
                   card.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                </span>
              )}
              {card.labels && card.labels.map((label, i) => (
                <span key={i} className="label">{label}</span>
              ))}
            </div>
          ) : null}
          
          {/* Detalhes do card */}
          <div className="card-details">
            {card.phone && (
              <div className="card-detail-item">
                <FiPhone />
                <span>{card.phone}</span>
              </div>
            )}
          </div>
          
          {/* Responsável */}
          {card.assignedTo && (
            <div className="card-assignee">
              <div className="assignee-avatar">
                {card.assigneeAvatar ? (
                  <img src={card.assigneeAvatar} alt={card.assignedTo} />
                ) : (
                  <FiUser />
                )}
              </div>
              <span className="assignee-name">{card.assignedTo}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderiza o item ativo durante o arrasto
  const renderActiveItem = () => {
    if (!activeId || !activeType) return null;
    
    if (activeType === 'column') {
      const column = columns.find(col => col.id === activeId);
      if (!column) return null;
      
      return (
        <div className="column is-dragging">
          <div className="column-header" data-count={column.cards.length}>
            <h2>{column.title}</h2>
          </div>
          <div className="cards-container">
            {column.cards.map(card => (
              <div key={card.id} className="contact-card-wrapper">
                <div className="contact-card">
                  <h3>{card.title}</h3>
                  <p>{card.content}</p>
                  
                  {/* Labels */}
                  {(card.labels && card.labels.length > 0) || card.priority ? (
                    <div className="labels">
                      {card.priority && (
                        <span className={`label ${card.priority}`}>
                          {card.priority === 'high' ? 'Alta Prioridade' : 
                           card.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                        </span>
                      )}
                      {card.labels && card.labels.map((label, i) => (
                        <span key={i} className="label">{label}</span>
                      ))}
                    </div>
                  ) : null}
                  
                  {/* Detalhes do card */}
                  <div className="card-details">
                    {card.phone && (
                      <div className="card-detail-item">
                        <FiPhone />
                        <span>{card.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Responsável */}
                  {card.assignedTo && (
                    <div className="card-assignee">
                      <div className="assignee-avatar">
                        {card.assigneeAvatar ? (
                          <img src={card.assigneeAvatar} alt={card.assignedTo} />
                        ) : (
                          <FiUser />
                        )}
                      </div>
                      <span className="assignee-name">{card.assignedTo}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Extrair IDs da coluna e do card
      const idParts = activeId.split(':');
      const columnId = idParts[0];
      const cardId = idParts[1];
      
      const column = columns.find(col => col.id === columnId);
      if (!column) return null;
      
      const card = column.cards.find(c => c.id === cardId);
      if (!card) return null;
      
      return (
        <div className="contact-card-wrapper is-dragging">
          <div className="contact-card">
            <h3>{card.title}</h3>
            <p>{card.content}</p>
            
            {/* Labels */}
            {(card.labels && card.labels.length > 0) || card.priority ? (
              <div className="labels">
                {card.priority && (
                  <span className={`label ${card.priority}`}>
                    {card.priority === 'high' ? 'Alta Prioridade' : 
                     card.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                  </span>
                )}
                {card.labels && card.labels.map((label, i) => (
                  <span key={i} className="label">{label}</span>
                ))}
              </div>
            ) : null}
            
            {/* Detalhes do card */}
            <div className="card-details">
              {card.phone && (
                <div className="card-detail-item">
                  <FiPhone />
                  <span>{card.phone}</span>
                </div>
              )}
            </div>
            
            {/* Responsável */}
            {card.assignedTo && (
              <div className="card-assignee">
                <div className="assignee-avatar">
                  {card.assigneeAvatar ? (
                    <img src={card.assigneeAvatar} alt={card.assignedTo} />
                  ) : (
                    <FiUser />
                  )}
                </div>
                <span className="assignee-name">{card.assignedTo}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  // Adicione este useEffect para desativar a animação após o carregamento inicial
  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 1000); // Tempo suficiente para a animação terminar
      
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  // Dentro do componente, adicione esta função para detectar dispositivos móveis
  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  return (
    <div className={`crm-container ${isInitialLoad ? 'initial-load' : ''}`}>
      <div className="crm-toolbar">
        <div className="view-selector">
          <button 
            className={`view-button ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Visualização Kanban"
          >
            <FiGrid />
            <span>Kanban</span>
          </button>
          <button 
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
          >
            <FiList />
            <span>Lista</span>
          </button>
        </div>
        
        <div className="search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar leads..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-container">
            <button 
              className="filter-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter />
              <span>Filtrar</span>
              {(filters.status || filters.priority || filters.assignedTo || 
                filters.dateRange.from || filters.dateRange.to) && (
                <span className="filter-indicator"></span>
              )}
            </button>
            
            {showFilters && (
              <FilterPanel 
                filters={filters}
                updateFilter={updateFilter}
                updateDateRange={updateDateRange}
                clearFilters={clearFilters}
                onClose={() => setShowFilters(false)}
                isOpen={showFilters}
              />
            )}
          </div>
        </div>
        
        <button 
          className="add-column-button"
          onClick={() => setShowNewColumnModal(true)}
        >
          <FiPlus /> Nova Etapa
        </button>
      </div>
      
      {viewMode === 'kanban' ? (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div className="columns-container">
              <SortableContext 
                items={filteredColumns.map(col => col.id)} 
                strategy={horizontalListSortingStrategy}
              >
                {filteredColumns.map((column, index) => (
                  <div key={column.id} className="column-wrapper">
                    <SortableColumn column={column} index={index} />
                    <button 
                      className="add-card-button"
                      onClick={() => handleAddCard(column.id)}
                    >
                      <FiPlus /> Adicionar Lead
                    </button>
                  </div>
                ))}
              </SortableContext>
            </div>
            
            <DragOverlay dropAnimation={dropAnimation}>
              {renderActiveItem()}
            </DragOverlay>
          </DndContext>
          
          {isMobile() && (
            <div className="scroll-indicator">
              <span>Deslize para ver mais</span>
              <FiChevronRight />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="list-view">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Etapa</th>
                  <th>Responsável</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                  <th>Último Contato</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredColumns.flatMap(column => 
                  column.cards.map(card => (
                    <tr key={`${column.id}:${card.id}`} onClick={() => openCardDetails(column.id, card.id)}>
                      <td>{card.title}</td>
                      <td>{column.title}</td>
                      <td>
                        <div className="table-user">
                          {card.assigneeAvatar && (
                            <div className="assignee-avatar-small">
                              <img src={card.assigneeAvatar} alt={card.assignedTo} />
                            </div>
                          )}
                          {card.assignedTo}
                        </div>
                      </td>
                      <td>{card.phone}</td>
                      <td>{card.status}</td>
                      <td>
                        {card.priority && (
                          <span className={`priority-tag ${card.priority}`}>
                            {card.priority === 'high' ? 'Alta' : 
                             card.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        )}
                      </td>
                      <td>{card.lastContact}</td>
                      <td>
                        <button className="table-action-button" onClick={(e) => {
                          e.stopPropagation();
                          openCardDetails(column.id, card.id);
                        }}>
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {isMobile() && (
            <div className="scroll-indicator">
              <span>Deslize para ver mais</span>
              <FiChevronRight />
            </div>
          )}
        </>
      )}
      
      {/* Modal para adicionar nova coluna */}
      {showNewColumnModal && (
        <Modal 
          title="Adicionar Nova Etapa"
          onClose={() => setShowNewColumnModal(false)}
          visible={showNewColumnModal}
        >
          <div className="new-column-modal">
            <div className="form-group">
              <label htmlFor="column-title">Título da Etapa</label>
              <input
                id="column-title"
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Ex: Qualificação, Proposta, Fechamento..."
              />
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-button secondary"
                onClick={() => setShowNewColumnModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="modal-button primary"
                onClick={handleAddColumn}
                disabled={!newColumnTitle.trim()}
              >
                <FiPlus /> Adicionar
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Overlay para quando o sidebar estiver aberto */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Painel lateral para detalhes do card */}
      <CardSidebar 
        card={isCreatingNewCard ? null : selectedCard}
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          setIsCreatingNewCard(false);
          setNewCardColumnId(null);
        }}
        onSave={isCreatingNewCard ? saveNewCard : saveCardChanges}
        isNewCard={isCreatingNewCard}
        columnId={newCardColumnId || undefined}
      />
    </div>
  );
};

export default CRMPage;