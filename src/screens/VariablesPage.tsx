import React, { useState, useEffect } from 'react';
import { Button, Input, Modal } from '../components/CustomComponents';
import SessionService from '../services/SessionService';
import { VariableInterface, getVariablesBySector, editVariable, createVariable, deleteVariable } from '../services/VariablesService';
import LoadingOverlay from '../components/LoadingOverlay';

const VariablesPage: React.FC = () => {
  const [variableName, setVariableName] = useState('');
  const [variableValue, setVariableValue] = useState('');
  const [variables, setVariables] = useState<VariableInterface[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedSector, setSelectedSector] = useState<number | null>(SessionService.getSessionForSector());

  useEffect(() => {
    if (selectedSector !== null) {
      fetchVariables();
    } else {
      setIsLoading(false);
    }
  }, [selectedSector]);

  const fetchVariables = async () => {
    try {
      setIsLoading(true);
      const response = await getVariablesBySector(SessionService.getSessionForSector());
      setVariables(response);
    } catch (error) {
      console.error('Erro ao buscar variáveis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (value: string) => {
    setVariableName(value);
  };

  const handleValueChange = (value: string) => {
    setVariableValue(value);
  };

  const handleAddVariable = async () => {
    if (!variableName) {
      return;
    }

    const variable: VariableInterface = {
      name: variableName,
      value: variableValue,
      sectorId: selectedSector!,
    };

    try {
      setIsSaving(true);
      if (isEditing && editIndex !== null) {
        await editVariable(variables[editIndex].id!, variable);
        console.log('success', `Variável "${variableName}" editada com sucesso!`);
      } else {
        const createdVariable = await createVariable(variable);
        console.log('success', `Variável "${variableName}" com valor "${variableValue}" cadastrada com sucesso!`);
        setVariables([...variables, createdVariable]);
      }
      fetchVariables();
      setIsEditing(false);
      setEditIndex(null);
      setIsModalVisible(false);
      setVariableName('');
      setVariableValue('');
    } catch (error) {
      console.error('Erro ao adicionar/editar variável:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditVariable = (index: number) => {
    setVariableName(variables[index].name || '');
    setVariableValue(variables[index].value || '');
    setIsEditing(true);
    setEditIndex(index);
    setIsModalVisible(true);
  };

  const handleDeleteVariable = async (index: number) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir esta variável?');
    if (confirmDelete) {
      try {
        await deleteVariable(variables[index].id!);
        console.log('success', 'Variável excluída com sucesso!');
        fetchVariables();
      } catch (error) {
        console.error('Erro ao excluir variável:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditing(false);
    setEditIndex(null);
    setVariableName('');
    setVariableValue('');
  };

  return (
    <div className="p-6">
      <h3 className="text-2xl text-blue-600 mb-6">Cadastro de Variáveis</h3>
      {isLoading ? (
        selectedSector === null ? (
          <div className="flex justify-center items-center h-64 text-lg text-gray-500">
            Nenhum setor selecionado
          </div>
        ) : (
          <LoadingOverlay />
        )
      ) : (
        <>
          {selectedSector !== null && (
            <div className="bg-white rounded-lg shadow p-6">
              <Button type="primary" onClick={() => setIsModalVisible(true)} className="mb-4">
                {isEditing ? 'Salvar' : 'Cadastrar'}
              </Button>
              <div className="mt-6">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-t-lg">
                  <div className="col-span-4"><h4 className="text-lg font-semibold">Nome</h4></div>
                  <div className="col-span-4"><h4 className="text-lg font-semibold">Valor</h4></div>
                  <div className="col-span-4"><h4 className="text-lg font-semibold">Ações</h4></div>
                </div>
                <div className="border rounded-b-lg">
                  {variables.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Nenhuma variável cadastrada</div>
                  ) : (
                    variables.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 p-4 border-t">
                        <div className="col-span-4"><strong>{item.name}</strong></div>
                        <div className="col-span-4">{item.value}</div>
                        <div className="col-span-4">
                          <Button type="text" onClick={() => handleEditVariable(index)}>Editar</Button>
                          <Button type="text" onClick={() => handleDeleteVariable(index)}>Excluir</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedSector === null && (
            <div className="flex justify-center items-center h-64 text-lg text-gray-500">
              Nenhum setor selecionado
            </div>
          )}
        </>
      )}

      <Modal
        visible={isModalVisible}
        onClose={handleCancel}
        title={isEditing ? 'Editar Variável' : 'Cadastrar Variável'}
        footer={
          <>
            <Button type="text" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="primary" onClick={handleAddVariable} disabled={isSaving}>
              {isEditing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              value={variableName}
              onChange={handleNameChange}
              placeholder="Digite o nome da variável"
            />
          </div>
          <div>
            <Input
              value={variableValue}
              onChange={handleValueChange}
              placeholder="Digite o valor da variável"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VariablesPage;
