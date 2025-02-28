import React, { useState, ChangeEvent, useEffect, ReactNode } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  useReactFlow,
} from 'react-flow-renderer';
import { Button, Input, Slider, Select, message, Modal } from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  FileOutlined,
  MenuOutlined,
  DeleteOutlined,
  SyncOutlined,
  TagOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import CustomNode2 from './CustomNode2';
import { createFlow, getFlowById, updateFlow } from '../services/FlowWhatsappService';
import SessionService from '../services/SessionService';
import { getAllVariables } from '../services/VariablesService';
import { getTags } from '../services/LabelService';
import EdgeDeleteButton from './EdgeDeleteButton';

const { Option } = Select;

// Interfaces
interface MediaFile {
  name: string;       // Nome do arquivo
  base64: string;     // Representação em Base64
  mimeType: string;   // Tipo MIME
}

interface Variable {
  id: number; // ID da variável
  name: string; // Nome da variável (assumindo que a API retorna um nome)
}

// Interface para as tags
interface Tag {
  id: number;      // ID da tag
  name: string;        // Nome da tag (assumindo que a API retorna um nome)
  tagId: number; 
}
// Interface para opções de menu
interface MenuOption {
  title: string;       // Título da opção
  content: string[];   // Conteúdo da opção
}

// Interface para condições
interface Condition {
  variableId: number;  // ID da variável
  condition: string;    // Condição
  value: string;        // Valor
}

// Interface para os blocos de conteúdo
interface Block {
  type: string;           // Pode ser: timer, text, image, attachment
  media?: MediaFile;      // Arquivo de mídia (se houver)
  content?: string;       // Conteúdo para tipos como 'text'
  duration?: number;      // Duração para o bloco do tipo 'timer'
}


// Interface para os nós do fluxo
interface FlowNodeData {
  id: string;            // ID do nó
  label: string;         // Rótulo do nó
  blocks?: Block[];      // Blocos de conteúdo
  menuOptions?: MenuOption; // Opções de menu
  selectedTag?: Tag;     // Tag selecionada
  condition?: Condition;  // Condição
}

// Interface para o fluxo
interface FlowData {
  id: string;               // ID do fluxo
  name: string;             // Nome do fluxo
  description: string;      // Descrição do fluxo
  sectorId: number;        // ID do setor
  nodes: FlowNodeData[];    // Array de nós do fluxo
  edges: FlowEdge[];        // Array de arestas do fluxo
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string | ReactNode; // Permite ReactNode além de string
  animated?: boolean;
}

// Função para definir a cor do nó com base no tipo
const getNodeColor = (label: string) => {
  switch (label) {
    case 'Conteúdo':
      return '#1890ff'; // Azul
    case 'Ação':
      return '#ffd700'; // Amarelo
    case 'Atraso Inteligente':
      return '#ff4d4f'; // Vermelho
    case 'Menu de Opções':
      return '#800080'; // Roxo
    case 'Resetar Variáveis':
      return '#FF69B4'; // Rosa
    case 'Tag':
      return '#8B0000'; // Vermelho escuro
    case 'Condições':
      return '#008080'; // Verde-azulado
    case 'Início':
      return '#000000'; // Preto
    default:
      return '#ddd'; // Cor padrão (cinza)
  }
}

// Componente de nó personalizado
const CustomNode = ({ id, data }: { id: string; data: FlowNodeData }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>(data?.blocks || []);
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [menuOptions, setMenuOptions] = useState<MenuOption>(data?.menuOptions || { title: '', content: [] });


  const [variables, setVariables] = useState<Variable[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const { setNodes, setEdges } = useReactFlow();

  useEffect(() => {
    const fetchVariablesAndTags = async () => {
      try {
        const variablesData = await getAllVariables();
        setVariables(variablesData);
  
        const tagsResponse:any = await getTags();
        setTags(Array.isArray(tagsResponse.data) ? tagsResponse.data : []);
  
        // Atualiza os nós para incluir nomes de variáveis
        setNodes((nds) =>
          nds.map((node) => {
            if (node.data?.condition?.variableId) {
              const variableName = variablesData.find(
                (v: Variable) => v.id === node.data.condition.variableId
              )?.name;
              return {
                ...node,
                data: {
                  ...node.data,
                  condition: {
                    ...node.data.condition,
                    variableName,
                  },
                },
              };
            }
            return node;
          })
        );
      } catch (error) {
        console.error('Erro ao buscar variáveis ou tags:', error);
      }
    };
  
    fetchVariablesAndTags();
  }, []);
  
  const addBlock = (type: string) => {
    setBlocks((prevBlocks) => {
      const newBlock: Block = type === 'timer' ? { type, duration: 3 } : { type };
      const newBlocks = [...prevBlocks, newBlock];
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, blocks: newBlocks } } : node
        )
      );
      return newBlocks;
    });
  };
  
  const addMenuOption = () => {
    setMenuOptions((prevMenuOptions) => {
      const updatedContent = [...prevMenuOptions.content, ''];
      const updatedMenuOptions = { ...prevMenuOptions, content: updatedContent };
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, menuOptions: updatedMenuOptions } } : node
        )
      );
      return updatedMenuOptions;
    });
  };
  

  const removeBlock = (index: number) => {
    setBlocks((prevBlocks) => prevBlocks.filter((_, i) => i !== index));
  };

  const toggleOptions = () => setShowOptions((prev) => !prev);



  const handleMenuTitleChange = (value: string) => {
    setMenuOptions((prevMenuOption) => {
      const updatedMenuOption = { ...prevMenuOption, title: value };
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, menuOptions: updatedMenuOption } } : node
        )
      );
      return updatedMenuOption;
    });
  };
  
  const handleMenuContentChange = (value: string) => {
    setMenuOptions((prevMenuOption) => {
      const updatedMenuOption = { ...prevMenuOption, content: value.split(',').map((item) => item.trim()) };
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, menuOptions: updatedMenuOption } } : node
        )
      );
      return updatedMenuOption;
    });
  };
  

  // Função para lidar com o upload de arquivos
  const handleFileUpload = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const mediaFile: MediaFile = {
          name: file.name,
          mimeType: file.type,
          base64: base64String,
        };
        setBlocks((prevBlocks) => {
          const newBlocks = [...prevBlocks];
          newBlocks[index].media = mediaFile;
          return newBlocks;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para deletar o nó
  const handleDeleteNode = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id)); // Remove arestas conectadas ao nó
  };

  return (
    <div
      style={{
        padding: '10px 20px',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 10,
        width: data?.label === 'Condições' ? '450px' : '350px',
        minHeight: data?.label === 'Condições' ? '150px' : 'auto', // Diminuindo a altura do nó Condições
        position: 'relative',
      }}
    >
      {/* Handle para conexão de entrada (à esquerda) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#333',
          borderRadius: '50%',
          width: 20,
          height: 20,
        }}
      />

      {/* Título do Nó */}
      <div
        style={{
          padding: '5px 10px',
          background: getNodeColor(data?.label),
          color: '#fff',
          borderRadius: '5px 5px 0 0',
          fontSize: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {data?.label}
        {/* Ícone de Lixeira para Deletar o Nó */}
        <DeleteOutlined
          style={{ cursor: 'pointer', color: '#fff' }}
          onClick={handleDeleteNode}
          title="Deletar Nó"
        />
      </div>

      {/* Renderização condicional do conteúdo de cada nó */}
      <div style={{ padding: '10px' }}>
        {data?.label === 'Conteúdo' && (
          <>
            {blocks.map((block, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '10px',
                  position: 'relative',
                  padding: '10px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
              >
{block?.type === 'text' && (
  <Input.TextArea
    placeholder="Insira o seu texto"
    rows={2}
    style={{ width: '100%' }}
    className="nodrag"
    value={block?.content || ''}
    onChange={(e) => {
      const newContent = e.target.value;
      setBlocks((prevBlocks) => {
        const newBlocks = prevBlocks.map((b, i) => 
          i === index ? { ...b, content: newContent } : b
        );
        setNodes((nds) =>
          nds.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, blocks: newBlocks } } : node
          )
        );
        return newBlocks;
      });
    }}
  />
)}

                {block.type === 'image' && (
                  <>
                    {block.media ? (
                      <img
                        src={block.media.base64}
                        alt="Uploaded"
                        style={{ width: '100%', marginTop: '10px', borderRadius: '4px' }}
                      />
                    ) : (
                      <Button
                        icon={<PictureOutlined />}
                        className="nodrag"
                        style={{ marginTop: '10px' }}
                      >
                        <label htmlFor={`image-upload-${index}`} style={{ cursor: 'pointer' }}>
                          Clique para importar a imagem
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          id={`image-upload-${index}`}
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(index, e)}
                        />
                      </Button>
                    )}
                  </>
                )}
                {block.type === 'attachment' && (
                  <>
                    {block.media ? (
                      <a
                        href={block.media.base64}
                        download={block.media.name}
                        style={{ display: 'block', marginTop: '10px', wordBreak: 'break-all' }}
                      >
                        {block.media.name}
                      </a>
                    ) : (
                      <Button
                        icon={<FileOutlined />}
                        className="nodrag"
                        style={{ marginTop: '10px' }}
                      >
                        <label htmlFor={`file-upload-${index}`} style={{ cursor: 'pointer' }}>
                          Clique para importar o arquivo
                        </label>
                        <input
                          type="file"
                          id={`file-upload-${index}`}
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(index, e)}
                        />
                      </Button>
                    )}
                  </>
                )}
{block.type === 'timer' && (
  <div>
    <Slider
      value={block.duration || 3}  // Controla o valor do slider; se não houver valor, usa 3
      min={1}
      max={10}
      className="nodrag"
      onChange={(value) => {
        setBlocks((prevBlocks) => {
          const newBlocks = prevBlocks.map((b, i) =>
            i === index ? { ...b, duration: value } : b // Atualiza a duração no bloco
          );
          setNodes((nds) =>
            nds.map((node) =>
              node.id === id ? { ...node, data: { ...node.data, blocks: newBlocks } } : node
            )
          );
          return newBlocks;
        });
      }}
    />
    <span>Defina a duração do timer</span>
  </div>
)}


                <Button
                  icon={<DeleteOutlined />}
                  type="text"
                  style={{ position: 'absolute', right: '5px', top: '5px' }}
                  onClick={() => removeBlock(index)}
                  className="nodrag"
                />
              </div>
            ))}
            <Button
              shape="circle"
              icon={<PlusOutlined />}
              onClick={toggleOptions}
              style={{ marginTop: 10 }}
              className="nodrag"
            />
            {showOptions && (
              <div
                style={optionBoxStyle}
                onClick={() => addBlock('text')}
                className="nodrag"
              >
                <FileTextOutlined style={iconStyle} />
                <div>Texto</div>
              </div>
            )}
          </>
        )}

{data?.label === 'Condições' && (
  <>
    {/* Seleção da variável */}
    <Select
      notFoundContent="Nenhuma variável encontrada"
      placeholder="Selecione a variável"
      style={{ width: '100%', marginTop: 10 }}
      className="nodrag"
      value={data?.condition?.variableId || undefined}
      onChange={(value) => {
        const variableName = variables.find((v) => v.id === value)?.name || '';
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  condition: {
                    ...node.data.condition,
                    variableId: value,
                    variableName,
                  },
                },
              };
            }
            return node;
          })
        );
      }}
    >
      {variables.map((variable) => (
        <Option key={variable.id} value={variable.id}>
          {variable.name}
        </Option>
      ))}
    </Select>

    {/* Seleção da condição */}
    <Select
      notFoundContent="Nenhuma condição encontrada"
      placeholder="Selecione a condição"
      style={{ width: '100%', marginTop: 10 }}
      className="nodrag"
      value={data?.condition?.condition || undefined}
      onChange={(value) => {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === id
              ? { ...node, data: { ...node.data, condition: { ...node.data.condition, condition: value } } }
              : node
          )
        );
      }}
    >
      <Option value="contem">Contém</Option>
      <Option value="diferente">Não contém</Option>
      <Option value="igual">É igual a</Option>
    </Select>

    {/* Campo de entrada do valor */}
    <Input
      placeholder="Insira o valor"
      style={{ width: '100%', marginTop: 10 }}
      className="nodrag"
      value={data?.condition?.value || ''}
      onChange={(e) => {
        const inputValue = e.target.value;
        setNodes((nds) =>
          nds.map((node) =>
            node.id === id
              ? { ...node, data: { ...node.data, condition: { ...node.data.condition, value: inputValue } } }
              : node
          )
        );
      }}
    />
  </>
)}



        {data?.label === 'Atraso Inteligente' && (
          <>
            <div className="nodrag">Selecione o tempo de espera</div>
            <Slider
              className="nodrag"
              defaultValue={1}
              min={1}
              max={10}
              style={{ width: '100%', marginTop: 10 }}
            />
          </>
        )}

{data?.label === 'Menu de Opções' && (
  <>
    <Input
      value={menuOptions.title} // Preenchendo o título do menu
      onChange={(e) => handleMenuTitleChange(e.target.value)}
      placeholder="Título do menu"
      style={{ marginBottom: 10 }}
    />

    {menuOptions.content.map((option, index) => (
      <Input
        key={index}
        value={option}
        onChange={(e) => {
          const updatedContent = menuOptions.content.map((opt, i) =>
            i === index ? e.target.value : opt
          );
          setMenuOptions((prevMenuOptions) => {
            const updatedMenuOptions = { ...prevMenuOptions, content: updatedContent };
            setNodes((nds) =>
              nds.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, menuOptions: updatedMenuOptions } } : node
              )
            );
            return updatedMenuOptions;
          });
        }}
        placeholder={`Opção ${index + 1}`}
        style={{ marginBottom: 10 }}
      />
    ))}

    <Button
      type="dashed"
      onClick={addMenuOption}
      style={{ width: '100%', marginTop: 10 }}
      className="nodrag"
    >
      Adicionar Opção
    </Button>
  </>
)}


{data?.label === 'Tag' && (
  <Select
    notFoundContent="Nenhuma etiqueta encontrada"
    placeholder="Selecione a tag"
    style={{ width: '100%', marginTop: 10 }}
    className="nodrag"
    value={data?.selectedTag?.tagId || undefined} // Seleciona pelo ID da tag
    onChange={(value) => {
      const selectedTag = tags.find((tag) => tag.id === value); // Busca a tag selecionada pelo ID
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                selectedTag: selectedTag
                  ? { tagId: selectedTag.id, name: selectedTag.name }
                  : null,
              },
            };
          }
          return node;
        })
      );
    }}
  >
    {tags.map((tag: Tag) => (
      <Option key={tag.id} value={tag.id}>
        {tag.name}
      </Option>
    ))}
  </Select>
)}




        {data?.label === 'Reiniciar Flow' && (
          <>
            <p className="nodrag">Esta ação irá reiniciar todo o fluxo do flow</p>
          </>
        )}

        {data?.label === 'Resetar Variáveis' && (
          <>
            <p className="nodrag">Esta ação irá limpar todas as variáveis do chat</p>
          </>
        )}

        {/* Handles para conexão de saída no nó Condições */}
        {data?.label === 'Condições' && (
          <>
            <Handle
              type="source"
              position={Position.Right}
              id="true"
              style={{
                top: '30%',
                background: '#333',
                borderRadius: '50%',
                width: 20,
                height: 20,
              }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="false"
              style={{
                top: '70%',
                background: '#333',
                borderRadius: '50%',
                width: 20,
                height: 20,
              }}
            />
          </>
        )}

        {/* Handle padrão para conexão de saída */}
        {data?.label !== 'Condições' && (
          <Handle
            type="source"
            position={Position.Right}
            style={{
              background: '#333',
              borderRadius: '50%',
              width: 20,
              height: 20,
            }}
          />
        )}
      </div>
    </div>
  );
};

// Estilos para as opções visuais
const optionBoxStyle: React.CSSProperties = {
  width: '70px',
  height: '70px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #ddd',
  borderRadius: '8px',
  margin: '5px',
  background: '#f5f5f5',
  cursor: 'pointer',
  transition: 'background-color 0.3s, transform 0.3s',
};

const iconStyle: React.CSSProperties = {
  fontSize: '24px',
  color: '#1890ff',
};

// Inicialização dos nós e arestas
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'customNode2',
    data: { label: 'Início' },
    position: { x: 50, y: 100 },
  },
];

const initialEdges: Edge[] = [];

const nodeTypes = {
  customNode: CustomNode,
  customNode2: CustomNode2, // Registrando o novo tipo de nó
};

interface EditFlowPageProps {
  flowId: any; // Definindo a prop flowId
}


const EditFlowPage: React.FC<EditFlowPageProps> = ({ flowId }:any) => {
  const id = flowId;
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useEffect(() => {
    if (flowId) {
      fetchFlowById(flowId); // Chama a função para buscar o fluxo
    }
  }, [flowId]);

  const validateEdges = (edges: Edge[], nodes: Node[]) => {
    const nodeIds = nodes.map((node) => node.id);
    return edges.filter((edge) => nodeIds.includes(edge.source) && nodeIds.includes(edge.target));
  };
  

  const fetchFlowById = async (flowId: string) => {
    try {
      const flow:any = await getFlowById(flowId);
      const tagsResponse:any = await getTags(); // Busca todas as tags disponíveis
      const tags:any = Array.isArray(tagsResponse.data) ? tagsResponse.data : [];
  
      if (flow) {
        const updatedNodes: Node[] = (flow.nodes || []).map((node: any) => {
          // Atualiza o selectedTag para incluir o nome correspondente
          const tagId = node.selectedTag?.tagId || null;
          const tagName = tags.find((tag:any) => tag.id === tagId)?.name || null;
  
          return {
            id: node.id,
            type: node.type || 'customNode',
            position: node.position || { x: 0, y: 0 },
            data: {
              id: node.id,
              label: node.label || 'Nó sem título',
              blocks: node.blocks || [],
              menuOptions: node.menuOptions || { title: '', content: [] },
              selectedTag: tagId
                ? {
                    tagId,
                    name: tagName, // Inclui o nome da tag
                  }
                : null,
              condition: node.condition || { variableId: null, condition: '', value: '' },
            },
          };
        });
  
        const validatedEdges = validateEdges(flow.edges || [], updatedNodes);
        setNodes(updatedNodes);
        setEdges(validatedEdges);
      }
    } catch (error) {
      console.error('Erro ao obter flow:', error);
    }
  };
  
  
  
  
  
  const handleSaveFlow = async () => {
    if (!reactFlowInstance) return;
  
    try {
      const flowData = {
        id: flowId,
        name: 'Nome do Flow',
        description: 'Descrição do Flow',
        sectorId: SessionService.getSession('selectedSector'),
        nodes: reactFlowInstance.getNodes().map((node: any) => ({
          id: node.id,
          label: node.data?.label,
          type: node.type || 'customNode',
          blocks: (node.data?.blocks || []).map((block: any, index: number) => ({
            id: block.id || `block-${index}`,
            type: block.type || 'text',
            content: block.content || '',
            media: block.media
              ? {
                  id: block.media.id || `media-${index}`,
                  name: block.media.name || '',
                  mimeType: block.media.mimeType || '',
                  base64: block.media.base64 || '',
                }
              : null,
            duration: block.duration || 0,
          })),
          menuOptions: node.data?.menuOptions
            ? {
                id: node.data?.menuOptions.id || 'menuOption-1',
                title: node.data?.menuOptions.title || '',
                content: node.data?.menuOptions.content || [],
              }
            : { id: 'menuOption-1', title: '', content: [] },
          selectedTag: node.data?.selectedTag
            ? {
                tagId: node.data?.selectedTag.tagId || node.data?.selectedTag.tag_id || null, // Usa o campo correto
              }
            : null,
          condition: node.data?.condition
            ? {
                id: node.data?.condition.id || 'condition-1',
                variableId: node.data?.condition.variableId || 0,
                condition: node.data?.condition.condition || '',
                value: node.data?.condition.value || '',
              }
            : null,
          position: node.position || { x: 0, y: 0 },
        })),
        edges: reactFlowInstance.getEdges().map((edge: any) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: edge.animated || false,
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
        })),
      };
  
      if (flowId) {
        const response = await updateFlow(flowData.id, flowData);
        message.success('Flow atualizado com sucesso!');
      } else {
        const response = await createFlow(flowData);
        message.success('Flow criado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar o Flow:', error);
      message.error('Erro ao salvar o Flow.');
    }
  };
  
  

  
  

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('application/reactflow');

    const bounds = event.currentTarget.getBoundingClientRect();
    const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
    });

    const newNode: Node = {
        id: `${nodes.length + 1}`,
        type: 'customNode',
        position,
        data: { label: nodeType },
    };

    setNodes((nds) => nds.concat(newNode));
  };
  

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onEdgeContextMenu = (event: React.MouseEvent, edge: Edge) => {
    event.preventDefault(); // Previne o menu de contexto padrão
    setEdges((eds) => eds.filter((e) => e.id !== edge.id)); // Remove a aresta clicada
  };

  return (
    <div style={{ height: '80vh', display: 'flex' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <Button onClick={() => window.history.back()} style={{ marginRight: '10px' }}>
          Voltar
        </Button>
        <Button type="primary" onClick={handleSaveFlow}>
          Salvar Fluxo
        </Button>
      </div>

      <div style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={(instance) => {
            if (instance) setReactFlowInstance(instance);
          }}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          {edges.map((edge) => {
            const sourceNode = nodes.find((node) => node.id === edge.source);
            const targetNode = nodes.find((node) => node.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            return (
              <React.Fragment key={edge.id}>
                <div
                  onContextMenu={(event) => onEdgeContextMenu(event, edge)}
                  style={{ position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }}
                >
                  {/* Renderização da aresta */}
                </div>
              </React.Fragment>
            );
          })}
        </ReactFlow>
      </div>

      <div
        style={{
          width: '150px', // Aumentei a largura para acomodar melhor os ícones
          background: '#f5f5f5',
          borderLeft: '1px solid #ddd',
          padding: '20px 0',
          textAlign: 'center',
          overflowY: 'auto', // Adicionado para permitir rolagem caso necessário
        }}
      >
        <div
          draggable
          onDragStart={(event) => onDragStart(event, 'Conteúdo')}
          style={{ marginBottom: '20px', cursor: 'pointer' }}
        >
          <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <div>Conteúdo</div>
        </div>

        <div
          draggable
          onDragStart={(event) => onDragStart(event, 'Menu de Opções')}
          style={{ marginBottom: '20px', cursor: 'pointer' }}
        >
          <MenuOutlined style={{ fontSize: '24px', color: '#800080' }} />
          <div>Menu</div>
        </div>

        <div
          draggable
          onDragStart={(event) => onDragStart(event, 'Resetar Variáveis')}
          style={{ marginBottom: '20px', cursor: 'pointer' }}
        >
          <SyncOutlined style={{ fontSize: '24px', color: '#FF69B4' }} />
          <div>Resetar</div>
        </div>

        <div
          draggable
          onDragStart={(event) => onDragStart(event, 'Tag')}
          style={{ marginBottom: '20px', cursor: 'pointer' }}
        >
          <TagOutlined style={{ fontSize: '24px', color: '#8B0000' }} />
          <div>Tag</div>
        </div>

        <div
          draggable
          onDragStart={(event) => onDragStart(event, 'Condições')}
          style={{ marginBottom: '20px', cursor: 'pointer' }}
        >
          <BranchesOutlined style={{ fontSize: '24px', color: '#008080' }} />
          <div>Condições</div>
        </div>
      </div>
    </div>
  );
};

export default EditFlowPage;
