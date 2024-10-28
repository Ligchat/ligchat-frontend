import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Typography, message, Row, Col, List, Modal, Spin } from 'antd';
import SessionService from '../services/SessionService';
import { VariableInterface, getVariablesBySector, editVariable, createVariable, deleteVariable } from '../services/VariablesService';
import LoadingOverlay from '../components/LoadingOverlay';

const { Title } = Typography;

const VariablesPage: React.FC = () => {
  const [variableName, setVariableName] = useState('');
  const [variableValue, setVariableValue] = useState('');
  const [variables, setVariables] = useState<VariableInterface[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchVariables();
  }, []);

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVariableName(e.target.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVariableValue(e.target.value);
  };

  const handleAddVariable = async () => {
    if (!variableName) {
      return;
    }

    const variable: VariableInterface = {
      name: variableName,
      value: variableValue,
      sectorId: SessionService.getSessionForSector(),
    };

    try {
      setIsSaving(true);
      if (isEditing && editIndex !== null) {
        await editVariable(variables[editIndex].id!, variable);
        message.success(`Variável "${variableName}" editada com sucesso!`);
      } else {
        const createdVariable = await createVariable(variable);
        message.success(`Variável "${variableName}" com valor "${variableValue}" cadastrada com sucesso!`);
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
    Modal.confirm({
      title: 'Tem certeza que deseja excluir esta variável?',
      onOk: async () => {
        try {
          await deleteVariable(variables[index].id!);
          message.success('Variável excluída com sucesso!');
          fetchVariables();
        } catch (error) {
          console.error('Erro ao excluir variável:', error);
        }
      },
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditing(false);
    setEditIndex(null);
    setVariableName('');
    setVariableValue('');
  };

  return (
    <div style={{ padding: '24px' }}>
      {isLoading && <LoadingOverlay />}
      {!isLoading && (
        <Card>
          <Title level={3}>Cadastro de Variáveis</Title>
          <Button type="primary" onClick={() => setIsModalVisible(true)} style={{ marginBottom: '16px' }}>
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
          <List
            style={{ marginTop: '24px' }}
            header={
              <Row style={{ width: '100%' }}>
                <Col span={8}><Title level={4}>Nome</Title></Col>
                <Col span={8}><Title level={4}>Valor</Title></Col>
                <Col span={8}><Title level={4}>Ações</Title></Col>
              </Row>
            }
            bordered
            dataSource={variables}
            locale={{ emptyText: 'Nenhuma variável cadastrada' }}
            renderItem={(item, index) => (
              <List.Item>
                <Row style={{ width: '100%' }}>
                  <Col span={8}><strong>{item.name}</strong></Col>
                  <Col span={8}>{item.value}</Col>
                  <Col span={8}>
                    <Button type="link" onClick={() => handleEditVariable(index)}>Editar</Button>
                    <Button type="link" danger onClick={() => handleDeleteVariable(index)}>Excluir</Button>
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Modal
        title={isEditing ? 'Editar Variável' : 'Cadastrar Variável'}
        visible={isModalVisible}
        onOk={handleAddVariable}
        onCancel={handleCancel}
        okText={isEditing ? 'Salvar' : 'Cadastrar'}
        cancelText="Cancelar"
        confirmLoading={isSaving}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Input
              value={variableName}
              onChange={handleNameChange}
              placeholder="Digite o nome da variável"
            />
          </Col>
          <Col span={12}>
            <Input
              value={variableValue}
              onChange={handleValueChange}
              placeholder="Digite o valor da variável"
            />
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default VariablesPage;
