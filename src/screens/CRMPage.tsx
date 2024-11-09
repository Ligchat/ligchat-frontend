import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { createColumn, getColumns, deleteColumn, moveColumn } from '../services/ColumnService';
import { createContact, updateContact } from '../services/ContactService';
import SessionService from '../services/SessionService';
import { createCard, deleteCard, moveCard } from '../services/CardService';
import LoadingOverlay from '../components/LoadingOverlay'; // Importar LoadingOverlay
import './CRMPage.css';

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
  position: number;
}

interface Column {
  id: number;
  name: string;
  cards: CardType[];
  sectorId: number;
  position: number; // Adicionando a posição
}

const CRMPage: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([{ id: -1, name: '', cards: [], sectorId: -1, position: 0 }]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isSidePanelVisible, setIsSidePanelVisible] = useState(false);
  const [currentColumnId, setCurrentColumnId] = useState<number | null>(null);
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Manter o isLoading para controle do estado de carregamento
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  useEffect(() => {
    const sectorId = SessionService.getSession('selectedSector');
    setSelectedSector(sectorId);
    loadColumns();
  }, []);

  const loadColumns = async () => {
    setIsLoading(true);
    try {
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
      const nextPosition = columns.length > 0 ? Math.max(...columns.map(col => col.position)) + 1 : 1;
  
      await createColumn({ name: newColumnName, sectorId: sectorId, position: nextPosition });
  
      setNewColumnName('');
      setIsModalVisible(false);
      loadColumns();
      message.success('Coluna adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar coluna:', error);
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    try {
      await deleteColumn(columnId);
      message.success('Coluna excluída com sucesso!');
      loadColumns();
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
      message.error('Erro ao excluir a coluna. Tente novamente.');
    }
  };

  const handleSaveCard = async () => {
    if (selectedCard && currentColumnId !== null) {
      try {
        if (selectedCard.id === 0) {
          const currentColumn = columns.find(col => col.id === currentColumnId);
          const maxPosition = currentColumn && currentColumn.cards.length > 0 ? Math.max(...currentColumn.cards.map(card => card.position)) : 0;

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
            position: maxPosition ? maxPosition + 1 : 1,
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
      position: 0,
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

  const onDragEnd = async (result: any) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === 'column') {
      const reorderedColumns = Array.from(columns);
      const [removed] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, removed);

      const updatedColumns = reorderedColumns.map((col, index) => ({ ...col, position: index + 1 }));
      setColumns(updatedColumns);

      try {
        console.log("Destino da coluna movida:", destination.index + 1);
        await moveColumn(removed.id, destination.index + 1);
      } catch (error) {
        console.error('Erro ao mover coluna:', error);
        message.error('Falha ao mover a coluna. Tente novamente.');
        loadColumns();
      }
    } else {
      const sourceColumnIndex = columns.findIndex(column => column.id === parseInt(source.droppableId));
      const destColumnIndex = columns.findIndex(column => column.id === parseInt(destination.droppableId));

      const sourceColumn = columns[sourceColumnIndex];
      const destColumn = columns[destColumnIndex];

      const sourceCards = Array.from(sourceColumn.cards);
      const [movedCard] = sourceCards.splice(source.index, 1);

      if (sourceColumnIndex === destColumnIndex) {
        sourceCards.splice(destination.index, 0, movedCard);
        const newColumn = {
          ...sourceColumn,
          cards: sourceCards.map((card, index) => ({ ...card, position: index + 1 })),
        };
        const newColumns = [...columns];
        newColumns[sourceColumnIndex] = newColumn;
        setColumns(newColumns);
      } else {
        const destCards = Array.from(destColumn.cards);
        destCards.splice(destination.index, 0, movedCard);

        const updatedSourceColumn = {
          ...sourceColumn,
          cards: sourceCards.map((card, index) => ({ ...card, position: index + 1 })),
        };

        const updatedDestColumn = {
          ...destColumn,
          cards: destCards.map((card, index) => ({ ...card, position: index + 1 })),
        };

        const newColumns = [...columns];
        newColumns[sourceColumnIndex] = updatedSourceColumn;
        newColumns[destColumnIndex] = updatedDestColumn;
        setColumns(newColumns);
      }

      try {
        await moveCard(movedCard.id, parseInt(destination.droppableId), destination.index + 1);
      } catch (error) {
        console.error('Erro ao mover card:', error);
        message.error('Falha ao mover o card. Tente novamente.');
        loadColumns();
      }
    }
  };

  const ContactCard: React.FC<{ card: CardType; columnId: number }> = ({ card, columnId }) => (
    <Card
      className={`mb-4 contact-card ${selectedCardId === card.id ? 'selected' : ''}`}
      onClick={() => {
        setSelectedCardId(card.id);
        openEditCardPanel(card, columnId);
      }}
    >
      <h3 className="font-bold">{card.contato.name}</h3>
      <p className="text-gray-500">Último contato: {new Date(card.lastContact).toLocaleDateString()}</p>
      <p className="text-gray-500">Telefone: {card.contato.phone}</p>
      <Button
        danger
        icon={<DeleteOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteCard(card.id);
        }}
      >
        Excluir
      </Button>
    </Card>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-8">
        {isLoading && <LoadingOverlay />} {/* Exibir LoadingOverlay enquanto estiver carregando */}

        <h1 style={{ color: '#1890ff' }} className="text-3xl font-bold mb-6">CRM</h1>
        {selectedSector === null && (
          <div className="flex justify-center items-center h-64 text-lg text-gray-500">
            Nenhum setor selecionado
          </div>
        )}
        <div className="flex overflow-x-auto space-x-4 pb-4">
          {selectedSector != null && (
            <Droppable droppableId="all-columns" direction="horizontal" type="column">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="flex space-x-4">
                  {columns
                    .sort((a, b) => a.position - b.position)
                    .map((column, index) => (
                      <Draggable draggableId={column.id.toString()} index={index} key={column.id}>
                        {(provided) => (
                          <div
                            {...provided.draggableProps}
                            ref={provided.innerRef}
                            className="min-w-[300px]"
                            {...provided.dragHandleProps}
                          >
                            <Droppable droppableId={column.id.toString()}>
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className="bg-blue-900 text-white p-4 rounded-lg min-w-[250px] relative"
                                >
                                  <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">{column.name}</h2>
                                    <Button
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => handleDeleteColumn(column.id)}
                                    />
                                  </div>
                                  {column.cards
                                    .sort((a, b) => a.position - b.position)
                                    .map((card, index) => (
                                      <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`contact-card-wrapper ${snapshot.isDragging ? 'dragging' : ''} ${selectedCardId === card.id ? 'selected' : ''}`}
                                            style={{
                                              ...provided.draggableProps.style,
                                              marginTop: snapshot.isDragging ? '5px' : '5px',
                                            }}
                                          >
                                            <ContactCard card={card} columnId={column.id} />
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                  {provided.placeholder}
                                  <Button
                                    icon={<PlusOutlined />}
                                    type="dashed"
                                    className="w-full mt-4"
                                    onClick={() => openAddCardPanel(column.id)}
                                  >
                                    Adicionar Card
                                  </Button>
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
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
                </div>
              )}
            </Droppable>
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
    </DragDropContext>
  );
};

export default CRMPage;