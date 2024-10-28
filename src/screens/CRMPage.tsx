import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal, message, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createColumn, getColumns } from '../services/ColumnService';
import { createContact, updateContact } from '../services/ContactService';
import { createCard, getCards, deleteCard, moveCard, updateCard } from '../services/CardService';
import SessionService from '../services/SessionService';
import LoadingOverlay from '../components/LoadingOverlay';

const { Option } = Select;

interface Contato {
  name: string;
  phone: string;
  email: string;
}

interface CardType {
  id: number;
  contactId: number;
  contato: Contato;
  lastContact: string;
  labels: string[];
}

interface Column {
  id: number;
  name: string;
  cards: CardType[];
  sectorId: number;
}

const CRMPage: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isSidePanelVisible, setIsSidePanelVisible] = useState(false);
  const [currentColumnId, setCurrentColumnId] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const sectorId = SessionService.getSession('selectedSector');
    setSelectedSector(sectorId);
    loadColumns();
  }, []);

  const loadColumns = async () => {
    try {
      setIsLoading(true);
      const columnsData = await getColumns();
      setColumns(columnsData);
    } catch (error) {
      console.error('Erro ao carregar colunas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddColumn = async () => {
    try {
      const sectorId = SessionService.getSession('selectedSector');
      await createColumn({ name: newColumnName, sectorId: sectorId });
      setNewColumnName('');
      setIsModalVisible(false);
      loadColumns();
      message.success('Coluna adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar coluna:', error);
    }
  };

  const handleSaveCard = async () => {
    if (selectedCard && currentColumnId !== null) {
      try {
        if (selectedCard.id === 0) {
          const newContact = await createContact({
            name: selectedCard.contato.name,
            phone: selectedCard.contato.phone,
            sectorId: selectedSector || 1,
            generalInfo: '',
          });

          await createCard({
            contactId: newContact.id,
            columnId: currentColumnId,
            lastContact: new Date(),
            sectorId: selectedSector || 1,
          });

          message.success('Card criado com sucesso!');
        } else {
          await updateContact(selectedCard.contactId, {
            name: selectedCard.contato.name,
            phone: selectedCard.contato.phone,
            labels: selectedCard.labels,
            lastContact: new Date(),
            generalInfo: '',
            sectorId: selectedSector || 0,
          });

          message.success('Card atualizado com sucesso!');
        }

        loadColumns();
        setIsSidePanelVisible(false);
      } catch (error) {
        console.error('Erro ao salvar card:', error);
      }
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      await deleteCard(cardId);
      message.success('Card excluído com sucesso!');
      loadColumns();
    } catch (error) {
      console.error('Erro ao excluir card:', error);
    }
  };

  const openAddCardPanel = (columnId: number) => {
    setCurrentColumnId(columnId);
    setSelectedCard({
      id: 0,
      contactId: 0,
      contato: {
        name: '',
        phone: '',
        email: '',
      },
      lastContact: '',
      labels: [],
    });
    setIsSidePanelVisible(true);
  };

  const openEditCardPanel = (card: CardType, columnId: number) => {
    setCurrentColumnId(columnId);
    setSelectedCard(card);
    setIsSidePanelVisible(true);
  };

  const handleCancel = () => {
    setIsSidePanelVisible(false);
    setSelectedCard(null);
  };

  const ContactCard: React.FC<{ card: CardType; columnId: number }> = ({ card, columnId }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'card',
      item: { cardId: card.id, fromColumnId: columnId },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    });

    return (
      <Card
        ref={drag}
        className="mb-4"
        style={{
          cursor: 'move',
          backgroundColor: '#fff',
          padding: '12px',
          borderRadius: '8px',
          opacity: isDragging ? 0.5 : 1,
        }}
        onClick={() => openEditCardPanel(card, columnId)}
      >
        <h3 className="font-bold">{card.contato.name}</h3>
        <p className="text-gray-500">Nome: {card.contato.name}</p>
        <p className="text-gray-500">Último contato: {new Date(card.lastContact).toLocaleDateString()}</p>
        <p className="text-gray-500">Telefone: {card.contato.phone}</p>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
        >
          Excluir
        </Button>
      </Card>
    );
  };

  const ColumnComponent: React.FC<{ column: Column }> = ({ column }) => {
    const [, drop] = useDrop({
      accept: 'card',
      drop: async (item: { cardId: number; fromColumnId: number }) => {
        if (item.fromColumnId !== column.id) {
          const originalColumnId = item.fromColumnId;

          try {
            moveCardLocally(item.cardId, column.id);
            setIsMoving(true);

            await Promise.all([
              moveCard(item.cardId, column.id),
              new Promise((resolve) => setTimeout(resolve, 300))
            ]);

            loadColumns();
          } catch (error) {
            moveCardLocally(item.cardId, originalColumnId);
          } finally {
            setIsMoving(false);
          }
        }
      },
    });

    const moveCardLocally = (cardId: number, toColumnId: number) => {
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];

        const fromColumn = newColumns.find((col) =>
          col.cards.some((card) => card.id === cardId)
        );
        const toColumn = newColumns.find((col) => col.id === toColumnId);

        if (!fromColumn || !toColumn) return newColumns;

        const cardIndex = fromColumn.cards.findIndex((card) => card.id === cardId);
        const [movedCard] = fromColumn.cards.splice(cardIndex, 1);

        toColumn.cards.push(movedCard);

        return newColumns;
      });
    };

    return (
      <div ref={drop} className="bg-blue-900 text-white p-4 rounded-lg min-w-[250px] relative">
        {isMoving && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <Spin tip="Movendo..." />
          </div>
        )}
        <h2 className="text-xl font-bold mb-4">{column.name}</h2>
        {column.cards.map((card: CardType) => (
          <ContactCard key={card.id} card={card} columnId={column.id} />
        ))}
        <Button
          icon={<PlusOutlined />}
          type="dashed"
          className="w-full mt-4"
          onClick={() => openAddCardPanel(column.id)}
        >
          Adicionar Card
        </Button>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-8">
        {isLoading && <LoadingOverlay />}
        <h1 className="text-3xl font-bold mb-6">CRM</h1>
        {selectedSector === null && (
          <div className="flex justify-center items-center h-64 text-lg text-gray-500">
            Nenhum setor selecionado
          </div>
        )}
        <div className="flex overflow-x-auto space-x-4 pb-4">
          {columns.map((column) => (
            <div className="min-w-[300px]" key={column.id}>
              <ColumnComponent column={column} />
            </div>
          ))}
           {selectedSector != null && (
          <div className="min-w-[300px]">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              className="w-full"
              onClick={() => setIsModalVisible(true)}
            >
              Adicionar Coluna
            </Button>
          </div>
           )}
        </div>
      </div>

      <Modal
        title="Adicionar Coluna"
        visible={isModalVisible}
        onOk={handleAddColumn}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          placeholder="Nome da coluna"
        />
      </Modal>

      {isSidePanelVisible && selectedCard && (
        <div className="fixed top-0 right-0 w-96 bg-white shadow-lg h-full p-6 z-50">
          <h2 className="text-lg font-bold mb-4">{selectedCard.id ? 'Editar Card' : 'Adicionar Card'}</h2>
          <Input
            value={selectedCard.contato.name}
            onChange={(e) => setSelectedCard({ 
              ...selectedCard, 
              contato: { ...selectedCard.contato, name: e.target.value } 
            })}
            placeholder="Nome do contato"
            className="mb-4"
          />
          <Input
            type="date"
            value={selectedCard.lastContact ? new Date(selectedCard.lastContact).toISOString().substr(0, 10) : ''}
            onChange={(e) => setSelectedCard({ ...selectedCard, lastContact: e.target.value })}
            placeholder="Último contato"
            className="mb-4"
          />
          <Input
            value={selectedCard.contato.phone}
            onChange={(e) => setSelectedCard({ 
              ...selectedCard, 
              contato: { ...selectedCard.contato, phone: e.target.value } 
            })}
            placeholder="Telefone"
            className="mb-4"
          />
          <Select
          notFoundContent="Nenhuma etiqueta encontrada"
            mode="tags"
            value={selectedCard.labels}
            onChange={(value) => setSelectedCard({ ...selectedCard, labels: value })}
            placeholder="Etiquetas"
            className="w-full mb-4"
          >
            <Option value="Etiqueta 1">Etiqueta 1</Option>
            <Option value="Etiqueta 2">Etiqueta 2</Option>
            <Option value="Etiqueta 3">Etiqueta 3</Option>
          </Select>
          <div className="flex justify-between">
            {selectedCard.id !== 0 && (
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteCard(selectedCard.id)}>
                Excluir
              </Button>
            )}
            <div className="flex space-x-2">
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button type="primary" onClick={handleSaveCard}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
};

export default CRMPage;
