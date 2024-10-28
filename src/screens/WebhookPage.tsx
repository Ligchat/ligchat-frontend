import React, { useState } from 'react';
import { Card, Button, Input, Row, Col, Select, Space, Skeleton } from 'antd';
import { EditOutlined, SaveOutlined, PlusOutlined, CopyOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import LoadingOverlay from '../components/LoadingOverlay';

const { Option } = Select;

interface Webhook {
  id: string;
  name: string;
  callbackUrl: string;
  actions: string[];
  createdAt: string;
  isEditing: boolean;
}

const WebhookPage: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'Nome',
      callbackUrl: 'https://callbackurl.com',
      actions: ['Ação 1'],
      createdAt: '21/02/2025 às 14:30',
      isEditing: false,
    },
  ]);

  const [newWebhook, setNewWebhook] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEditClick = (id: string) => {
    setWebhooks((prev) =>
      prev.map((webhook) =>
        webhook.id === id ? { ...webhook, isEditing: true } : webhook
      )
    );
  };

  const handleSaveClick = (id: string) => {
    setWebhooks((prev) =>
      prev.map((webhook) =>
        webhook.id === id ? { ...webhook, isEditing: false } : webhook
      )
    );
    setNewWebhook(false);
  };

  const handleCancelClick = (id: string) => {
    setWebhooks((prev) =>
      prev.map((webhook) =>
        webhook.id === id ? { ...webhook, isEditing: false } : webhook
      )
    );
    setNewWebhook(false);
  };

  const handleAddWebhook = () => {
    setNewWebhook(true);
    setWebhooks((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        callbackUrl: '',
        actions: [],
        createdAt: new Date().toLocaleString(),
        isEditing: true,
      },
    ]);
  };

  const handleDeleteClick = (id: string) => {
    setWebhooks((prev) => prev.filter((webhook) => webhook.id !== id));
  };

  const handleActionsChange = (id: string, selectedActions: string[]) => {
    setWebhooks((prev) =>
      prev.map((webhook) =>
        webhook.id === id ? { ...webhook, actions: selectedActions } : webhook
      )
    );
  };

  return (
    <div className="p-8">
      {isLoading && <LoadingOverlay />}

      <h1 className="text-3xl font-bold mb-6">Webhook</h1>
      <Row gutter={[16, 16]}>
        {webhooks.map((webhook) => (
          <Col xs={24} sm={12} md={8} key={webhook.id}>
            <Card
              title={
                webhook.isEditing ? (
                  <Input
                    value={webhook.name}
                    placeholder="Nome"
                    onChange={(e) =>
                      setWebhooks((prev) =>
                        prev.map((w) =>
                          w.id === webhook.id ? { ...w, name: e.target.value } : w
                        )
                      )
                    }
                  />
                ) : (
                  <span>{webhook.name}</span>
                )
              }
              extra={
                <Space>
                  {webhook.isEditing ? (
                    <>
                      <Button
                        type="primary"
                        onClick={() => handleSaveClick(webhook.id)}
                        icon={<SaveOutlined />}
                        disabled={isLoading}
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
                        onClick={() => handleDeleteClick(webhook.id)}
                      />
                    </>
                  )}
                </Space>
              }
            >
              <Skeleton active loading={isLoading}>
                {!webhook.isEditing && <p>Criado dia {webhook.createdAt}</p>}
                <div>
                  <p>Callback URL</p>
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
                </div>
              </Skeleton>
            </Card>
          </Col>
        ))}

        {!newWebhook && (
          <Col xs={24} sm={12} md={8}>
            <Card
              className="flex items-center justify-center cursor-pointer shadow-md rounded-lg"
              onClick={handleAddWebhook}
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
