import React, { useEffect, useState } from 'react';
import { Layout, Typography, Card, Button, Row, Col, Space, Input, Form, message, Skeleton, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook } from '../services/WebhookService';
import LoadingOverlay from '../components/LoadingOverlay';
import SessionService from '../services/SessionService';

const { Title, Paragraph } = Typography;

const WebhookPage: React.FC = () => {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newWebhook, setNewWebhook] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(SessionService.getSession('selectedSector'));
  const [isEditingWebhookId, setIsEditingWebhookId] = useState<number | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [newWebhookData, setNewWebhookData] = useState<{ name: string; callbackUrl: string }>({
    name: '',
    callbackUrl: '',
  });

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const fetchedWebhooks: any = await getWebhooks();
      let data = fetchedWebhooks.data;

      if (data && !Array.isArray(data)) {
        data = [data];
      } else if (data == null) {
        data = [];
      }

      setWebhooks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleEditClick = (id: number) => {
    setIsEditingWebhookId(id);
    setWebhooks((prev) =>
      prev.map((webhook) =>
        webhook.id === id ? { ...webhook, isEditing: true } : webhook
      )
    );
  };

  const handleSaveClick = async (id: number) => {
    const webhookToUpdate = webhooks.find((webhook) => webhook.id === id);
    if (webhookToUpdate) {
      if (!webhookToUpdate.name || !webhookToUpdate.callbackUrl) {
        message.error('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      if (!isValidURL(webhookToUpdate.callbackUrl)) {
        message.error('Por favor, insira uma URL válida para o Callback URL.');
        return;
      }
      setIsLoading(true);
      const sectorId = SessionService.getSessionForSector();
      try {
        await updateWebhook(id, {
          name: webhookToUpdate.name,
          callbackUrl: webhookToUpdate.callbackUrl,
          sectorId: sectorId,
        });
        message.success('Webhook atualizado com sucesso!');
        fetchWebhooks();
      } catch (error) {
        message.error('Erro ao atualizar o webhook. Tente novamente.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsEditingWebhookId(null);
  };

  const handleCancelClick = (id: number) => {
    const webhookToCancel = webhooks.find((webhook) => webhook.id === id);
    if (!webhookToCancel) {
      return;
    }

    if (webhookToCancel.isEditing) {
      setWebhooks((prev) =>
        prev.map((webhook) =>
          webhook.id === id ? { ...webhook, isEditing: false } : webhook
        )
      );
      setIsEditingWebhookId(null);
    }
  };

  const handleAddWebhook = () => {
    setNewWebhookData({ name: '', callbackUrl: '' });
    setIsAddModalVisible(true);
  };

  const handleSaveNewWebhook = async () => {
    if (!newWebhookData.name || !newWebhookData.callbackUrl) {
      message.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (!isValidURL(newWebhookData.callbackUrl)) {
      message.error('Por favor, insira uma URL válida para o Callback URL.');
      return;
    }
    setIsLoading(true);
    try {
      const sectorId = SessionService.getSessionForSector();
      await createWebhook({
        name: newWebhookData.name,
        callbackUrl: newWebhookData.callbackUrl,
        sectorId: sectorId,
      });
      message.success('Webhook criado com sucesso!');
      fetchWebhooks();
    } catch (error) {
      message.error('Erro ao criar o webhook. Tente novamente.');
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsAddModalVisible(false);
    }
  };

  const confirmDeleteWebhook = (id: number) => {
    Modal.confirm({
      title: 'Deseja realmente excluir este webhook?',
      content: 'Essa ação é irreversível.',
      onOk: () => handleDeleteClick(id),
      onCancel: () => setConfirmDeleteId(null),
    });
  };

  const handleDeleteClick = async (id: number) => {
    setIsLoading(true);
    try {
      await deleteWebhook(id);
      message.success('Webhook excluído com sucesso!');
      setWebhooks((prev) => prev.filter((webhook) => webhook.id !== id));
    } catch (error) {
      message.error('Erro ao excluir o webhook. Tente novamente.');
      console.error(error);
    } finally {
      setIsLoading(false);
      setConfirmDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const isValidURL = (url: string): boolean => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)' +
      '((([a-zA-Z0-9\\-]+\\.)+[a-zA-Z]{2,})|' +
      '((\\d{1,3}\\.){3}\\d{1,3}))' +
      '(\\:\\d+)?' +
      '(\\/[-a-zA-Z0-9%_.~+]*)*' +
      '(\\?[;&a-zA-Z0-9%_.~+=-]*)?' +
      '(\\#[-a-zA-Z0-9_]*)?$','i'
    );
    return !!pattern.test(url);
  };

  return (
    <Layout style={{ padding: '20px' }}>
      {isLoading && <LoadingOverlay />}
      <Title style={{ color: '#1890ff' }} className="text-3xl font-bold mb-6">Webhook</Title>
      {selectedSectorId === null ? (
        <div className="flex justify-center items-center h-64 text-lg text-gray-500">
          Nenhum setor selecionado
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {webhooks.map((webhook) => (
            <Col xs={24} sm={12} md={8} key={webhook.id}>
              {confirmDeleteId === webhook.id ? (
                <Card>
                  <div className="text-center bg-yellow-400 p-4 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Deseja mesmo excluir?</h3>
                    <p className="mb-4">Essa ação é irreversível.</p>
                    <div className="flex justify-around">
                      <Button
                        onClick={handleCancelDelete}
                        className="border-blue-500 text-blue-500"
                      >
                        Não
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => handleDeleteClick(webhook.id)}
                        disabled={isLoading}
                      >
                        Sim
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card
                  style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                  extra={
                    <Space>
                      {webhook.isEditing ? (
                        <>
                          <Button
                            className='ms-3'
                            type="primary"
                            onClick={() => handleSaveClick(webhook.id)}
                            icon={<SaveOutlined />}
                            disabled={
                              isLoading ||
                              !webhook.name ||
                              !webhook.callbackUrl ||
                              !isValidURL(webhook.callbackUrl)
                            }
                          >
                            Salvar
                          </Button>
                          <Button
                            onClick={() => handleCancelClick(webhook.id)}
                            icon={<CloseOutlined />}
                            disabled={isLoading}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <EditOutlined
                            className="text-blue-500 cursor-pointer"
                            onClick={() => handleEditClick(webhook.id)}
                          />
                          <DeleteOutlined
                            className="text-red-500 cursor-pointer"
                            onClick={() => confirmDeleteWebhook(webhook.id)}
                          />
                        </>
                      )}
                    </Space>
                  }
                >
                  <Skeleton active loading={isLoading}>
                    <Form layout="vertical">
                      <Form.Item
                        label="Nome"
                        required
                        validateStatus={!webhook.name && webhook.isEditing ? 'error' : ''}
                        help={!webhook.name && webhook.isEditing ? 'Campo obrigatório' : ''}
                      >
                        <Input
                          value={webhook.name}
                          placeholder="Insira o nome"
                          onChange={(e) =>
                            setWebhooks((prev) =>
                              prev.map((w) =>
                                w.id === webhook.id ? { ...w, name: e.target.value } : w
                              )
                            )
                          }
                          disabled={!webhook.isEditing || isLoading}
                        />
                      </Form.Item>
                      <Form.Item
                        label="Callback URL"
                        required
                        validateStatus={
                          webhook.isEditing && (!webhook.callbackUrl || !isValidURL(webhook.callbackUrl))
                            ? 'error'
                            : ''
                        }
                        help={
                          webhook.isEditing && !webhook.callbackUrl
                            ? 'Campo obrigatório'
                            : webhook.isEditing && !isValidURL(webhook.callbackUrl)
                            ? 'URL inválida'
                            : ''
                        }
                      >
                        <Input
                          value={webhook.callbackUrl}
                          placeholder="Insira o callback URL"
                          onChange={(e) =>
                            setWebhooks((prev) =>
                              prev.map((w) =>
                                w.id === webhook.id ? { ...w, callbackUrl: e.target.value } : w
                              )
                            )
                          }
                          disabled={!webhook.isEditing || isLoading}
                        />
                      </Form.Item>
                    </Form>
                  </Skeleton>
                </Card>
              )}
            </Col>
          ))}

          <Col xs={24} sm={12} md={8}>
            <Card
              className="flex items-center justify-center cursor-pointer shadow-md rounded-lg"
              onClick={handleAddWebhook}
            >
              <PlusOutlined className="text-blue-500 text-3xl" />
            </Card>
          </Col>
        </Row>
      )}

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ flex: 1 }}>Adicionar Novo Webhook</span>
            <button className="ant-modal-close" onClick={() => setIsAddModalVisible(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
              <span className="ant-modal-close-x" />
            </button>
          </div>
        }
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        confirmLoading={isLoading}
        width="400px"
        style={{ maxWidth: '90%' }}
        footer={null}
      >
        <Input
          placeholder="Nome do Webhook"
          value={newWebhookData.name}
          onChange={(e) => setNewWebhookData({ ...newWebhookData, name: e.target.value })}
          className="my-4"
          disabled={isLoading}
        />
        <Input
          placeholder="Callback URL"
          value={newWebhookData.callbackUrl}
          onChange={(e) => setNewWebhookData({ ...newWebhookData, callbackUrl: e.target.value })}
          className="mb-4"
          disabled={isLoading}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
          <Button style={{ flex: 1, marginRight: '8px' }} onClick={() => setIsAddModalVisible(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button style={{ flex: 1 }} type="primary" onClick={handleSaveNewWebhook} loading={isLoading}>
            Adicionar
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default WebhookPage;
