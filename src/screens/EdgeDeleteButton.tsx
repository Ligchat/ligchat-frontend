import React from 'react';
import { Handle } from 'react-flow-renderer';
import { DeleteOutlined } from '@ant-design/icons';

interface EdgeDeleteButtonProps {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    onDelete: (id: string) => void;
}

const EdgeDeleteButton: React.FC<EdgeDeleteButtonProps> = ({ id, sourceX, sourceY, targetX, targetY, onDelete }) => {
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    return (
        <div
            style={{
                position: 'absolute',
                left: midX - 15, // Ajuste para centralizar o ícone
                top: midY - 15,  // Ajuste para centralizar o ícone
                cursor: 'pointer', // Estilo de cursor para indicar que é clicável
                zIndex: 10,
                padding: '10px', // Adicionando padding para facilitar o clique
            }}
            onClick={(e) => {
                e.stopPropagation(); // Evita que o clique propague para o nó
                onDelete(id);
            }}
            onContextMenu={(e) => {
                e.preventDefault(); // Previne o menu de contexto padrão
                onDelete(id); // Remove a aresta ao clicar com o botão direito
            }}
        >
            <DeleteOutlined style={{ color: '#ff4d4f' }} />
        </div>
    );
};

export default EdgeDeleteButton; 