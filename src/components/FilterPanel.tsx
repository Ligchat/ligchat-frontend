import React from 'react';
import { FiX, FiCalendar, FiTag, FiUser, FiFilter, FiCheck } from 'react-icons/fi';
import '../styles/FilterPanel.css';

interface FilterPanelProps {
  filters: {
    status: string;
    priority: string;
    assignedTo: string;
    dateRange: {
      from: string;
      to: string;
    }
  };
  updateFilter: (field: string, value: any) => void;
  updateDateRange: (field: 'from' | 'to', value: string) => void;
  clearFilters: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  updateFilter,
  updateDateRange,
  clearFilters,
  onClose,
  isOpen
}) => {
  return (
    <div className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="filter-sidebar-header">
        <h3><FiFilter /> Filtros</h3>
        <button className="close-button" onClick={onClose}>
          <FiX />
        </button>
      </div>
      
      <div className="filter-sidebar-content">
        <div className="filter-group">
          <label htmlFor="filter-status">
            <FiTag /> Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="Novo">Novo</option>
            <option value="Contato Inicial">Contato Inicial</option>
            <option value="Qualificado">Qualificado</option>
            <option value="Proposta">Proposta</option>
            <option value="Negociação">Negociação</option>
            <option value="Fechado">Fechado</option>
            <option value="Perdido">Perdido</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-priority">
            <FiTag /> Prioridade
          </label>
          <select
            id="filter-priority"
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
          >
            <option value="">Todas as prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-assignee">
            <FiUser /> Responsável
          </label>
          <input
            id="filter-assignee"
            type="text"
            placeholder="Nome do responsável"
            value={filters.assignedTo}
            onChange={(e) => updateFilter('assignedTo', e.target.value)}
          />
        </div>
        
        <div className="filter-group date-range">
          <label>
            <FiCalendar /> Período de criação
          </label>
          <div className="date-inputs">
            <div className="date-input">
              <label htmlFor="filter-date-from">De</label>
              <input
                id="filter-date-from"
                type="date"
                value={filters.dateRange.from}
                onChange={(e) => updateDateRange('from', e.target.value)}
              />
            </div>
            <div className="date-input">
              <label htmlFor="filter-date-to">Até</label>
              <input
                id="filter-date-to"
                type="date"
                value={filters.dateRange.to}
                onChange={(e) => updateDateRange('to', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="filter-sidebar-footer">
        <button className="filter-button secondary" onClick={clearFilters}>
          Limpar filtros
        </button>
        <button className="filter-button primary" onClick={onClose}>
          <FiCheck /> Aplicar filtros
        </button>
      </div>
    </div>
  );
};

export default FilterPanel; 