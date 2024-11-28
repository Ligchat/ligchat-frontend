// CustomNode2.tsx
import React from 'react';
import { Handle, Position, NodeProps } from 'react-flow-renderer';

// Função para definir a cor do nó com base no tipo
const getNodeColor = (label: string) => {
  switch (label) {
    case 'Início':
      return '#000000'; // Preto
    // Adicione outros casos se necessário
    default:
      return '#ddd'; // Cor padrão (cinza)
  }
};

// Componente de nó personalizado para "Início"
const CustomNode2: React.FC<NodeProps> = ({ data }) => {
  return (
    <div
      style={{
        padding: '10px 20px',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 10,
        width: '350px',
        position: 'relative',
      }}
    >
      {/* Handle para conexão de entrada (à esquerda) - Removido se "Início" não precisar de entrada */}
      {/* <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#333',
          borderRadius: '50%',
          width: 20,
          height: 20,
        }}
      /> */}

      <div
        style={{
        display:'flex',
        justifyContent:'center',
        alignItems:'center',
          padding: '15px 10px 5px 5px',
          borderRadius: '5px 5px 0 0',
          fontSize: '32px',
        }}
      >
        {data?.label}
      </div>

      {/* Conteúdo do Nó "Início" */}
      <div style={{ padding: '10px' }}>
        {/* Adicione o conteúdo específico do nó "Início" aqui, se necessário */}
      </div>

      {/* Handle padrão para conexão de saída à direita */}
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
    </div>
  );
};

export default CustomNode2;
