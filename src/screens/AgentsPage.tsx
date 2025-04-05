import React, { useState, useEffect } from 'react';
import { getAgents, createAgent, updateAgent, deleteAgent } from '../services/AgentService';
import Toast from '../components/Toast';
import './AgentsPage.css';

interface Agent {
  id?: number;
  name: string;
  type: 'gpt' | 'anthropic' | 'grok';
  apiKey: string;
  model: string;
  status: boolean;
  prompt: string;
  sectorId: number;
}

const defaultModels = {
  gpt: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  grok: ['grok-1', 'grok-2', 'grok-3']
};

const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [currentAgent, setCurrentAgent] = useState<Agent>({
    name: '',
    type: 'gpt',
    apiKey: '',
    model: defaultModels.gpt[0],
    status: true,
    prompt: '',
    sectorId: 1 // Você pode pegar isso do contexto ou props
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const data = await getAgents(currentAgent.sectorId);
      setAgents(data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentAgent.id) {
        await updateAgent(currentAgent.id, currentAgent);
        showToast('Agente atualizado com sucesso', 'success');
      } else {
        await createAgent(currentAgent);
        showToast('Agente criado com sucesso', 'success');
      }
      fetchAgents();
      setIsDrawerOpen(false);
    } catch (error) {
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAgent(id);
      await fetchAgents();
      showToast('Agente excluído com sucesso', 'success');
    } catch (error) {
    }
  };

  const handleEdit = (agent: Agent) => {
    setCurrentAgent(agent);
    setIsDrawerOpen(true);
  };

  const toggleAgentStatus = (agentId: number) => {
    setAgents(currentAgents => {
      // Se estamos tentando ativar um agente, primeiro verificamos se já existe algum ativo
      const targetAgent = currentAgents.find(a => a.id === agentId);
      if (targetAgent && !targetAgent.status) {
        const hasActiveAgent = currentAgents.some(a => a.status);
        if (hasActiveAgent) {
          alert('Não é possível ativar mais de um agente ao mesmo tempo');
          return currentAgents;
        }
      }

      return currentAgents.map(agent => 
        agent.id === agentId ? { ...agent, status: !agent.status } : agent
      );
    });
  };

  return (
    <div className="agents-page">
      <div className="agents-header">
        <div className="header-content">
          <h1>Agentes de IA</h1>
          <p className="header-description">
            Gerencie seus agentes de inteligência artificial
          </p>
        </div>
        <button 
          className="add-agent-button"
          onClick={() => {
            setCurrentAgent({
              name: '',
              type: 'gpt',
              apiKey: '',
              model: defaultModels.gpt[0],
              status: true,
              prompt: '',
              sectorId: 1
            });
            setIsDrawerOpen(true);
          }}
        >
          Novo Agente
        </button>
      </div>

      <div className="agents-content">
        {isLoading ? (
          <div className="loading-overlay">
            <div className="card-loading">
              <div className="card-loading-spinner" />
              <span className="loading-text">Carregando agentes...</span>
            </div>
          </div>
        ) : (
          <div className="agents-grid">
            {agents.map(agent => (
              <div key={agent.id} className="agent-card">
                <div className="agent-header">
                  <div className="agent-type-badge" data-type={agent.type}>
                    {agent.type.toUpperCase()}
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={agent.status}
                      onChange={() => toggleAgentStatus(agent.id!)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <h3 className="agent-name">{agent.name}</h3>
                <div className="agent-model">{agent.model}</div>
                <div className="agent-actions">
                  <button 
                    className="edit-button"
                    onClick={() => handleEdit(agent)}
                  >
                    Editar
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(agent.id!)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDrawerOpen && (
        <div className="agent-drawer">
          <div className="drawer-header">
            <h2>{currentAgent.id ? 'Editar Agente' : 'Novo Agente'}</h2>
            <button 
              className="close-button"
              onClick={() => setIsDrawerOpen(false)}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} className="agent-form">
            <div className="form-group">
              <label>Nome do Agente</label>
              <input
                type="text"
                value={currentAgent.name}
                onChange={e => setCurrentAgent({...currentAgent, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Tipo</label>
              <select
                value={currentAgent.type}
                onChange={e => {
                  const type = e.target.value as Agent['type'];
                  setCurrentAgent({
                    ...currentAgent,
                    type,
                    model: defaultModels[type][0]
                  });
                }}
              >
                <option value="gpt">GPT (OpenAI)</option>
                <option value="anthropic">Anthropic</option>
                <option value="grok">Grok (xAI)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Chave API</label>
              <input
                type="password"
                value={currentAgent.apiKey}
                onChange={e => setCurrentAgent({...currentAgent, apiKey: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Modelo</label>
              <select
                value={currentAgent.model}
                onChange={e => setCurrentAgent({...currentAgent, model: e.target.value})}
              >
                {defaultModels[currentAgent.type].map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Prompt do Sistema</label>
              <textarea
                value={currentAgent.prompt}
                onChange={e => setCurrentAgent({...currentAgent, prompt: e.target.value})}
                rows={6}
                placeholder="Digite o prompt que definirá o comportamento do agente..."
                required
              />
            </div>

            <div className="form-group">
              <label className="switch-label">
                <span>Status</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={currentAgent.status}
                    onChange={(e) => {
                      const newStatus = e.target.checked;
                      if (newStatus && agents.some(a => a.status && a.id !== currentAgent.id)) {
                        alert('Não é possível ativar mais de um agente ao mesmo tempo');
                        return;
                      }
                      setCurrentAgent({...currentAgent, status: newStatus});
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </label>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </button>
              <button type="submit">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}
    </div>
  );
};

export default AgentsPage; 