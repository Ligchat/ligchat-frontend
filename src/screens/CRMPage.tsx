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
  useDroppable,
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
import { 
  FiPhone, 
  FiUser, 
  FiPlus, 
  FiGrid,
  FiList,
  FiFilter,
  FiSearch,
  FiChevronRight,
  FiX,
  FiTrash2,
  FiMail
} from 'react-icons/fi';
import CardSidebar from '../components/CardSidebar';
import FilterPanel from '../components/FilterPanel';
import { getColumns, createColumn, moveColumn, updateColumn, deleteColumn } from '../services/ColumnService';
import { createCard, updateCard, moveCard, Card, getCards } from '../services/CardService';
import SessionService from '../services/SessionService';
import { getTags, Tag as ApiTag } from '../services/LabelService';
import Toast from '../components/Toast';
import { getAllUsers, User } from '../services/UserService';
import { getContacts, updateContact, UpdateContactRequestDTO } from '../services/ContactService';

interface Column {
  id: string;
  title: string;
  cards: UICard[];
}

interface UICard {
  id: string;
  title: string;
  content: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  lastContact?: string;
  priority?: 'high' | 'medium' | 'low';
  labels?: string[];
  contactId: number;
  columnId: number;
  sectorId: number;
  position: number;
  tagId?: number;
  assignedTo?: string;
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Primeiro, vamos definir a interface da Tag
interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  sectorId: number;
}

interface Contact {
  id: number;
  name: string;
  notes?: string;
  email?: string;
  number?: string;
  isActive: boolean;
  priority?: string;
  tagId?: number;
  assignedTo?: number;
}

interface ContactResponse {
  data: Contact;
}

// Componente Modal aprimorado
const EnhancedModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ visible, onClose, title, children }) => {
  if (!visible) return null;
  
  // Impedir que o clique dentro do modal feche o modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div className="enhanced-modal-overlay" onClick={onClose}>
      <div className="enhanced-modal" onClick={handleModalClick}>
        <div className="enhanced-modal-header">
          <h3>{title}</h3>
          <button className="enhanced-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="enhanced-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Crie um componente separado para a lixeira
const TrashBin = () => {
  const { setNodeRef } = useDroppable({
    id: 'trash-bin',
  });

  return (
    <div 
      ref={setNodeRef}
      id="trash-bin"
      className="trash-bin"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '15px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(5px)',
        border: '2px dashed rgba(255, 255, 255, 0.3)',
        transition: 'all 0.3s ease'
      }}
    >
      <FiTrash2 size={24} color="#fff" />
    </div>
  );
};

const CRMPage: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [contactsMap, setContactsMap] = useState<Map<number, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'column' | 'card' | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedCard, setSelectedCard] = useState<UICard | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
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
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [directModalTitle, setDirectModalTitle] = useState('');
  const [directModalError, setDirectModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [showTrashBin, setShowTrashBin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<User[]>([]);

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

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(current => [...current, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  };

  const convertPriority = (priority: string | undefined): 'high' | 'medium' | 'low' | undefined => {
    if (!priority) return undefined;
    switch (priority.toLowerCase()) {
      case 'high':
      case 'alta':
        return 'high';
      case 'medium':
      case 'média':
      case 'media':
        return 'medium';
      default:
        return 'low';
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const sectorId = SessionService.getSectorId();
        console.log('SectorId:', sectorId);
        
        if (!sectorId) {
          console.error('Setor não selecionado');
          setIsLoading(false);
          return;
        }
        
        console.log('Iniciando carregamento dos dados...');
        
        // Buscar colunas, cards, contatos e usuários
        const [columnsData, cardsData, contactsResponse, usersData] = await Promise.all([
          getColumns(),
          getCards(sectorId),
          getContacts(sectorId),
          getAllUsers()
        ]);

        console.log('Dados brutos:', {
          columnsData,
          cardsData,
          contactsResponse,
          usersData
        });

        // Buscar e formatar tags
        let formattedTags: ApiTag[] = [];
        try {
          const tagsResponse = await getTags(sectorId);
          if (tagsResponse.data) {
            formattedTags = tagsResponse.data.map(tag => ({
              id: Number(tag.id),
              name: tag.name,
              color: tag.color,
              description: tag.description,
              sectorId: tag.sectorId
            }));
          }
        } catch (error) {
          console.warn('Não foi possível carregar as tags, continuando sem elas:', error);
        }

        console.log('Dados carregados:', {
          colunas: columnsData,
          cards: cardsData,
          contatos: contactsResponse,
          tags: formattedTags,
          usuarios: usersData
        });

        // Criar mapa de contatos para acesso rápido
        const newContactsMap = new Map(
          contactsResponse.data.map(contact => [contact.id, {
            id: contact.id,
            name: contact.name,
            notes: contact.notes,
            email: contact.email,
            number: contact.number,
            isActive: contact.isActive,
            priority: contact.priority,
            tagId: contact.tagId,
            assignedTo: contact.assignedTo
          }])
        );
        setContactsMap(newContactsMap);

        console.log('Mapa de contatos:', Array.from(newContactsMap.entries()));

        // Mapear as colunas com os cards
        const mappedColumns = columnsData.map((column) => {
          const columnCards = cardsData
            .filter(card => card.columnId.toString() === column.id.toString())
            .map(card => {
              console.log('Processando card:', card);
              const contact = newContactsMap.get(card.contactId);
              console.log('Contato encontrado para o card:', contact);
              
              if (!contact) {
                console.warn('Contato não encontrado para o card:', card);
                return null;
              }

              return {
                id: card.id.toString(),
                title: contact.name || 'Sem nome',
                content: contact.notes || '',
                email: contact.email || '',
                phone: contact.number || '',
                status: contact.isActive ? 'active' : 'inactive',
                priority: convertPriority(contact.priority),
                contactId: card.contactId,
                columnId: card.columnId,
                sectorId: card.sectorId,
                position: card.position,
                tagId: contact.tagId || undefined,
                createdAt: card.createdAt,
                assignedTo: contact.assignedTo ? contact.assignedTo.toString() : undefined
              };
            })
            .filter(card => card !== null)
            .sort((a, b) => a!.position - b!.position);

          console.log(`Cards mapeados para a coluna ${column.name}:`, columnCards);

          return {
            id: column.id.toString(),
            title: column.name,
            cards: columnCards
          };
        });

        console.log('Colunas mapeadas final:', mappedColumns);
        setColumns(mappedColumns);
        
        // Configurar tags
        setTags(formattedTags);

        // Configurar usuários
        setUsers(usersData);

      } catch (error: any) {
        console.error('Erro detalhado ao carregar dados:', error);
        if (error.response) {
          console.error('Resposta do servidor:', error.response.data);
          console.error('Status:', error.response.status);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Função para validar o título da coluna
  const validateColumnTitle = (title: string): boolean => {
    if (!title.trim()) {
      setDirectModalError('O título da coluna é obrigatório');
      return false;
    }
    
    if (title.trim().length < 3) {
      setDirectModalError('O título deve ter pelo menos 3 caracteres');
      return false;
    }
    
    if (title.trim().length > 30) {
      setDirectModalError('O título deve ter no máximo 30 caracteres');
      return false;
    }
    
    // Verificar se já existe uma coluna com esse título
    const columnExists = columns.some(col => 
      col.title.toLowerCase() === title.trim().toLowerCase()
    );
    
    if (columnExists) {
      setDirectModalError('Já existe uma coluna com esse título');
      return false;
    }
    
    setDirectModalError('');
    return true;
  };

  // Função para adicionar ou atualizar coluna com validação
  const handleSaveColumn = async () => {
    if (!validateColumnTitle(directModalTitle)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const sectorId = SessionService.getSectorId();
      if (!sectorId) {
        console.error('Setor não selecionado');
        addToast('Selecione um setor para continuar', 'error');
        setIsSubmitting(false);
        return;
      }

      if (editingColumn) {
        // Atualizar coluna existente
        const updatedColumn = await updateColumn(editingColumn.id, {
          name: directModalTitle.trim(),
        });
        
        setColumns(prevColumns => prevColumns.map(col => 
          col.id === updatedColumn.id ? { ...col, title: updatedColumn.name } : col
        ));
        
        addToast('Coluna atualizada com sucesso', 'success');
      } else {
      // Criar nova coluna
      const newColumn = await createColumn({
        name: directModalTitle.trim(),
        sectorId: sectorId,
        position: columns.length + 1
      });
      
      setColumns(prevColumns => [...prevColumns, {
        id: newColumn.id.toString(),
        title: newColumn.name,
        cards: []
      }]);
      
      addToast('Coluna adicionada com sucesso', 'success');
      }
      
      setShowDirectModal(false);
      setDirectModalTitle('');
      setDirectModalError('');
    } catch (error) {
      console.error('Erro ao salvar coluna:', error);
      addToast('Erro ao salvar coluna', 'error');
    } finally {
      setIsSubmitting(false);
      setEditingColumn(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Adiciona classe no body quando começar a arrastar
    document.body.classList.add('dragging');
    
    if (columns.some(col => col.id === active.id)) {
      setActiveType('column');
      setShowTrashBin(true);
    } else {
      setActiveType('card');
    }
  };

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    // Podemos adicionar lógica aqui para melhorar a experiência durante o arrasto
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Remove classe do body quando terminar de arrastar
    document.body.classList.remove('dragging');
    setShowTrashBin(false);
    
    if (!over) return;
    
    if (over.id === 'trash-bin' && activeType === 'column') {
      const column = columns.find(col => col.id === active.id);
      if (!column) return;

      if (column.cards.length > 0) {
        addToast('Não é possível excluir uma coluna com cards', 'error');
        return;
      }

      setColumnToDelete(column);
      setShowDeleteModal(true);
      return;
    }
    
    if (activeType === 'column') {
      const oldIndex = columns.findIndex(col => col.id === active.id);
      const newIndex = columns.findIndex(col => col.id === over.id);
      
      if (oldIndex === newIndex) return;

      try {
        // Atualiza imediatamente a UI
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns);
        
        // Tenta atualizar no backend
        await moveColumn(active.id.toString(), newIndex + 1);
        addToast('Coluna movida com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao mover coluna:', error);
        // Reverte a mudança em caso de erro
        setColumns(columns);
        addToast('Erro ao mover coluna', 'error');
      }
    } else if (activeType === 'card') {
      const [sourceColumnId, cardId] = active.id.toString().split(':');
      const [targetColumnId, targetPosition] = over.id.toString().split(':');
      
      // Verifica se é o mesmo card
      if (cardId === targetPosition) return;

      try {
        const sourceColumn = columns.find(col => col.id === sourceColumnId);
        const targetColumn = columns.find(col => col.id === targetColumnId);
        
        if (!sourceColumn || !targetColumn) return;

        const cardToMove = sourceColumn.cards.find(card => card.id === cardId);
        if (!cardToMove) return;

        // Calcula a nova posição do card
        let newPosition;
        if (sourceColumnId === targetColumnId) {
          // Se for na mesma coluna, usa o índice do card alvo
          const targetCard = targetColumn.cards.find(card => card.id === targetPosition);
          const targetIndex = targetColumn.cards.indexOf(targetCard!);
          newPosition = targetIndex + 1;
        } else {
          // Se for em coluna diferente, usa a posição passada ou o final da coluna
          newPosition = parseInt(targetPosition) || targetColumn.cards.length + 1;
        }

        // Atualiza imediatamente a UI
        const newColumns = columns.map(col => ({...col, cards: [...col.cards]}));
        
        // Remove o card da coluna de origem
        const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumnId);
        newColumns[sourceColIndex].cards = newColumns[sourceColIndex].cards.filter(card => card.id !== cardId);
        
        // Adiciona o card na coluna de destino na posição correta
        const destColIndex = newColumns.findIndex(col => col.id === targetColumnId);
        newColumns[destColIndex].cards.splice(newPosition - 1, 0, cardToMove);
        
        setColumns(newColumns);

        // Atualiza no backend
        await moveCard(cardId, parseInt(targetColumnId), newPosition);
        addToast('Card movido com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao mover card:', error);
        setColumns(columns);
        addToast('Erro ao mover card', 'error');
      }
    }
    
    setActiveId(null);
    setActiveType(null);
  };

  // Adicione esta função para detectar quando está sobre a lixeira
  const handleDragOver = (event: DragMoveEvent) => {
    const { over } = event;
    const trashBin = document.getElementById('trash-bin');
    
    if (trashBin && over?.id === 'trash-bin') {
      trashBin.classList.add('drag-over');
    } else if (trashBin) {
      trashBin.classList.remove('drag-over');
    }
  };

  // Função personalizada para detecção de colisão
  const customCollisionDetection = useCallback((args: any) => {
    // Para colunas, incluímos a detecção da lixeira
    if (activeType === 'column') {
      const pointerCollisions = pointerWithin(args);
      
      // Verifica se há colisão com a lixeira
      const trashBin = document.getElementById('trash-bin');
      if (trashBin) {
        const trashBinRect = trashBin.getBoundingClientRect();
        const { x, y } = args.pointerCoordinates;
        
        if (
          x >= trashBinRect.left &&
          x <= trashBinRect.right &&
          y >= trashBinRect.top &&
          y <= trashBinRect.bottom
        ) {
          return [{ id: 'trash-bin' }];
        }
      }
      
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }
      
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

  // Primeiro, vamos garantir que a função convertToCard mantenha todos os campos
  const convertToCard = (uiCard: UICard) => {
    return {
      id: uiCard.id,
      title: uiCard.title,
      content: uiCard.content,
      email: uiCard.email,
      phone: uiCard.phone,
      status: uiCard.status,
      createdAt: uiCard.createdAt ? new Date(uiCard.createdAt) : undefined,
      lastContact: uiCard.lastContact ? new Date(uiCard.lastContact) : undefined,
      priority: uiCard.priority,
      contactId: uiCard.contactId,
      tagId: uiCard.tagId,
      columnId: uiCard.columnId,
      sectorId: uiCard.sectorId,
      position: uiCard.position
    };
  };

  // Agora vamos ajustar o saveCardChanges
  const saveCardChanges = async (updatedCard: UICard) => {
    try {
      const sectorId = SessionService.getSectorId();
      if (!sectorId) {
        addToast('Selecione um setor para continuar', 'error');
        return;
      }

      const contact = contactsMap.get(updatedCard.contactId);
      if (!contact) {
        addToast('Contato não encontrado', 'error');
        return;
      }

      // Atualiza o contato
      const contactData: UpdateContactRequestDTO = {
        name: updatedCard.title,
        tagId: updatedCard.tagId || null,
        phoneWhatsapp: updatedCard.phone || '',
        avatarUrl: null,
        email: updatedCard.email || '',
        notes: updatedCard.content || null,
        sectorId: updatedCard.sectorId,
        isActive: updatedCard.status === 'active',
        priority: updatedCard.priority || 'normal',
        aiActive: 1,
        assignedTo: updatedCard.assignedTo ? Number(updatedCard.assignedTo) : null
      };

      const contactResponse = (await updateContact(updatedCard.contactId, contactData)) as unknown as ContactResponse;
      
      // Atualiza o mapa de contatos
      setContactsMap(new Map(contactsMap.set(updatedCard.contactId, contactResponse.data)));

      // Criar um novo objeto com os dados atualizados usando o retorno da API
      const updatedCardData: UICard = {
        ...updatedCard,
        title: contactResponse.data.name,
        content: contactResponse.data.notes || '',
        email: contactResponse.data.email || '',
        phone: contactResponse.data.number || '',
        status: contactResponse.data.isActive ? 'active' : 'inactive',
        priority: convertPriority(contactResponse.data.priority),
        tagId: contactResponse.data.tagId || undefined,
        assignedTo: contactResponse.data.assignedTo ? contactResponse.data.assignedTo.toString() : undefined
      };

      // Atualiza o estado das colunas imediatamente
      setColumns(prevColumns => {
        const newColumns = prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.id === updatedCard.id ? updatedCardData : card
          )
        }));
        return newColumns;
      });

      // Atualiza o card selecionado e fecha o sidebar
      setSelectedCard(updatedCardData);
      setTimeout(() => {
        setSidebarOpen(false);
      }, 100);

      addToast('Lead atualizado com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      addToast('Erro ao atualizar lead', 'error');
    }
  };

  // Função para filtrar os cards com base nos critérios
  const filterCards = useCallback((cards: UICard[], columnId: string) => {
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
      const assigneeMatch = !filters.assignedTo || (() => {
        const contact = contactsMap.get(card.contactId);
        if (!contact?.assignedTo) return false;
        const user = users.find(u => u.id === Number(contact.assignedTo));
        return user?.name.toLowerCase().includes(filters.assignedTo.toLowerCase()) || false;
      })();
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
  }, [searchTerm, filters, users]);

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
                handleCardClick={openCardDetails}
                tags={tags}
                users={users}
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
    handleCardClick,
    tags,
    users
  }: { 
    columnId: string, 
    card: UICard, 
    index: number,
    handleCardClick: (columnId: string, cardId: string) => void,
    tags: Tag[],
    users: User[]
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
      opacity: isDragging ? 0.8 : 1,
      zIndex: isDragging ? 999 : 1,
      cursor: isDragging ? 'grabbing' : 'grab',
    };
    
    // Encontrar a tag correspondente uma única vez
    const cardTag = useMemo(() => {
      if (!card.tagId || !tags?.length) return null;
      return tags.find(tag => tag.id === Number(card.tagId));
    }, [card.tagId, tags]);

    // Função para obter as iniciais do responsável
    const getAssigneeInitials = () => {
      const contact = contactsMap.get(card.contactId);
      if (!contact?.assignedTo) return null;
      const user = users.find(u => u.id === Number(contact.assignedTo));
      if (!user?.name) return null;
      
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      }
      return nameParts[0].substring(0, 2).toUpperCase();
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`contact-card ${card.priority ? `priority-${card.priority}` : ''}`}
        {...attributes} 
        {...listeners}
        onClick={() => handleCardClick(columnId, card.id)}
      >
        <div className="card-header-info">
          {cardTag && (
            <span 
              className="card-tag"
              style={{
                backgroundColor: `${cardTag.color}1A`,
                color: cardTag.color,
                border: `1px solid ${cardTag.color}40`
              }}
            >
              {cardTag.name}
            </span>
          )}
          {getAssigneeInitials() && (
            <div className="card-assignee">
              <span className="assignee-initials">{getAssigneeInitials()}</span>
            </div>
          )}
        </div>
        <span className="card-title">{card.title}</span>
        {card.content && <span className="card-content">{card.content}</span>}
        
        {(card.phone || card.email) && (
          <div className="card-details">
            {card.phone && (
              <div className="card-detail-item">
                <FiPhone size={12} />
                <span>{card.phone}</span>
              </div>
            )}
            {card.email && (
              <div className="card-detail-item">
                <FiMail size={12} />
                <span>{card.email}</span>
              </div>
            )}
          </div>
        )}
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
          <div className="column-header">
            <h2>{column.title}</h2>
          </div>
          <div className="cards-container">
            {column.cards.map(card => (
              <div key={card.id} className="contact-card-preview">
                <span className="card-title">{card.title}</span>
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
      
      // Encontrar a tag para o card
      const cardTag = tags.find(tag => tag.id === card.tagId);
      
      // Obter iniciais do responsável
      const getAssigneeInitials = () => {
        const contact = contactsMap.get(card.contactId);
        if (!contact?.assignedTo) return null;
        const user = users.find(u => u.id === Number(contact.assignedTo));
        if (!user?.name) return null;
        
        const nameParts = user.name.split(' ');
        if (nameParts.length >= 2) {
          return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        }
        return nameParts[0].substring(0, 2).toUpperCase();
      };
      
      return (
        <div className={`contact-card ${card.priority ? `priority-${card.priority}` : ''}`}>
          <div className="card-header-info">
            {cardTag && (
              <span 
                className="card-tag"
                style={{
                  backgroundColor: `${cardTag.color}1A`,
                  color: cardTag.color,
                  border: `1px solid ${cardTag.color}40`
                }}
              >
                {cardTag.name}
              </span>
            )}
            {getAssigneeInitials() && (
              <div className="card-assignee">
                <span className="assignee-initials">{getAssigneeInitials()}</span>
              </div>
            )}
          </div>
          <span className="card-title">{card.title}</span>
          {card.content && <span className="card-content">{card.content}</span>}
          
          {(card.phone || card.email) && (
            <div className="card-details">
              {card.phone && (
                <div className="card-detail-item">
                  <FiPhone size={12} />
                  <span>{card.phone}</span>
                </div>
              )}
              {card.email && (
                <div className="card-detail-item">
                  <FiMail size={12} />
                  <span>{card.email}</span>
                </div>
              )}
            </div>
          )}
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

  // Componente do Modal de Confirmação
  const DeleteConfirmationModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    columnName: string;
  }> = ({ visible, onClose, onConfirm, columnName }) => {
    if (!visible) return null;

    return (
      <div className="enhanced-modal-overlay" onClick={onClose}>
        <div className="enhanced-modal delete-modal" onClick={e => e.stopPropagation()}>
          <div className="enhanced-modal-header">
            <h3>Confirmar Exclusão</h3>
            <button className="enhanced-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="enhanced-modal-content">
            <p>Tem certeza que deseja excluir a etapa <strong>{columnName}</strong>?</p>
            <p className="delete-warning">Esta ação não pode ser desfeita.</p>
            
            <div className="form-actions">
              <button 
                className="form-button secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                className="form-button danger"
                onClick={onConfirm}
              >
                <FiTrash2 /> Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Adicione a função para confirmar a deleção
  const handleConfirmDelete = () => {
    if (!columnToDelete) return;

    // Atualiza a UI imediatamente
    setColumns(prevColumns => prevColumns.filter(col => col.id !== columnToDelete.id));
    
    // Tenta deletar no backend
    deleteColumn(columnToDelete.id.toString()).catch(error => {
      console.error('Erro ao excluir coluna:', error);
      // Reverte a mudança em caso de erro
      setColumns(prevColumns => [...prevColumns, columnToDelete]);
      addToast('Erro ao excluir coluna', 'error');
    });
    
    addToast('Coluna excluída com sucesso', 'success');
    setShowDeleteModal(false);
    setColumnToDelete(null);
  };

  return (
    <div className={`crm-container ${isInitialLoad ? 'initial-load' : ''}`}>
      <div className="crm-container">
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
            onClick={() => {
              setEditingColumn(null);
              setDirectModalTitle('');
              setShowDirectModal(true);
            }}
            disabled={!SessionService.getSectorId()}
          >
            <FiPlus /> Nova Coluna
          </button>
        </div>

        <div className="crm-content">
          {isLoading ? (
            <div className="crm-loading">
              <div className="loading-spinner" />
              <div className="loading-text">Carregando CRM...</div>
            </div>
          ) : !SessionService.getSectorId() ? (
            <div className="crm-loading">
              <div className="loading-text">Nenhum dado encontrado ou setor não selecionado</div>
            </div>
          ) : (
            <>
              {viewMode === 'kanban' ? (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
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
                          </div>
                        ))}
                      </SortableContext>
                    </div>
                    
                    <DragOverlay dropAnimation={dropAnimation}>
                      {renderActiveItem()}
                    </DragOverlay>
                    
                    {showTrashBin && <TrashBin />}
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
              
              {/* Overlay para quando o sidebar estiver aberto */}
              <div 
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
                onClick={() => setSidebarOpen(false)}
              />
              
              {/* Painel lateral para detalhes do card */}
              <CardSidebar 
                isOpen={sidebarOpen}
                onClose={() => {
                  setSidebarOpen(false);
                }}
                onSave={saveCardChanges}
                selectedCard={selectedCard}
                addToast={addToast}
              />
              
              <EnhancedModal 
                visible={showDirectModal}
                onClose={() => {
                  setShowDirectModal(false);
                  setDirectModalTitle('');
                  setDirectModalError('');
                }}
                title="Adicionar Nova Etapa"
              >
                <div className="enhanced-modal-form">
                  <div className="form-group">
                    <label htmlFor="column-title-direct">Título da Etapa</label>
                    <input
                      id="column-title-direct"
                      type="text"
                      value={directModalTitle}
                      onChange={(e) => {
                        setDirectModalTitle(e.target.value);
                        if (directModalError) validateColumnTitle(e.target.value);
                      }}
                      placeholder="Ex: Qualificação, Proposta, Fechamento..."
                      className={directModalError ? 'input-error' : ''}
                      autoFocus
                    />
                    {directModalError && (
                      <div className="error-message">{directModalError}</div>
                    )}
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      className="form-button secondary"
                      onClick={() => {
                        setShowDirectModal(false);
                        setDirectModalTitle('');
                        setDirectModalError('');
                      }}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="form-button primary"
                      onClick={handleSaveColumn}
                      disabled={isSubmitting || !directModalTitle.trim()}
                    >
                      {isSubmitting ? (
                        <span className="button-spinner"></span>
                      ) : (
                        <>
                          <FiPlus /> {editingColumn ? 'Atualizar' : 'Adicionar'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </EnhancedModal>
              
              {/* Modal de confirmação de deleção */}
              <DeleteConfirmationModal
                visible={showDeleteModal}
                onClose={() => {
                  setShowDeleteModal(false);
                  setColumnToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                columnName={columnToDelete?.title || ''}
              />
            </>
          )}
        </div>
        
        <div className="toast-container">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CRMPage;