import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Row, Col, Space, Skeleton, Form, message } from 'antd';
import { EditOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import LoadingOverlay from '../components/LoadingOverlay';
import { Webhook, createWebhook, updateWebhook, getWebhooks, deleteWebhook } from '../services/WebhookService';
import SessionService from '../services/SessionService';

const WebhookPage: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhook, setNewWebhook] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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
        fetchWebhooks(); // Recarrega a lista após a atualização
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    setNewWebhook(false);
  };

  const handleCancelClick = (id: number) => {
    setWebhooks((prev) =>
      prev.map((webhook) =>
        webhook.id === id ? { ...webhook, isEditing: false } : webhook
      )
    );
    setNewWebhook(false);
  };

  const handleAddWebhook = () => {
    const sectorId = SessionService.getSessionForSector();
    setNewWebhook(true);
    const newWebhookData: Webhook = {
      id: Math.random(),
      name: '',
      callbackUrl: '',
      sectorId: sectorId,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      isEditing: true,
    };
    setWebhooks((prev) => [...prev, newWebhookData]);
  };

  const handleSaveNewWebhook = async () => {
    const webhookToSave = webhooks.find((webhook) => webhook.isEditing && newWebhook);
    if (webhookToSave) {
      if (!webhookToSave.name || !webhookToSave.callbackUrl) {
        message.error('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      if (!isValidURL(webhookToSave.callbackUrl)) {
        message.error('Por favor, insira uma URL válida para o Callback URL.');
        return;
      }
      setIsLoading(true);
      try {
        const createdWebhook = await createWebhook({
          name: webhookToSave.name,
          callbackUrl: webhookToSave.callbackUrl,
          sectorId: webhookToSave.sectorId,
        });
        setNewWebhook(false);
        fetchWebhooks(); // Recarrega a lista após a criação
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const confirmDeleteWebhook = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteClick = async (id: number) => {
    setIsLoading(true);
    try {
      await deleteWebhook(id);
      setWebhooks((prev) => prev.filter((webhook) => webhook.id !== id));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setConfirmDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  // Função para validar se a URL é válida
  const isValidURL = (url: string): boolean => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)' + // protocolo obrigatório
      '((([a-zA-Z0-9\\-]+\\.)+[a-zA-Z]{2,})|' + // domínio
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // ou IP
      '(\\:\\d+)?' + // porta
      '(\\/[-a-zA-Z0-9%_.~+]*)*' + // path
      '(\\?[;&a-zA-Z0-9%_.~+=-]*)?' + // query string
      '(\\#[-a-zA-Z0-9_]*)?$','i' // fragment locator
    );
    return !!pattern.test(url);
  };

  return (
    <div className="p-8">
      {isLoading && <LoadingOverlay />}

      <h1 style={{ color: '#1890ff' }} className="text-3xl font-bold mb-6">Webhook</h1>
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
                          onClick={() =>
                            newWebhook ? handleSaveNewWebhook() : handleSaveClick(webhook.id)
                          }
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

        {!newWebhook && (
          <Col xs={24} sm={12} md={8}>
            <Card
              className="flex items-center justify-center cursor-pointer shadow-md rounded-lg"
              onClick={handleAddWebhook}
              style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
            >
              <PlusOutlined className="text-blue-500 text-3xl" />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default WebhookPage;
