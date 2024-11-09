import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Input, Select, Skeleton } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Tag, CreateTagRequestDTO, UpdateTagRequestDTO, createTag, getTags, updateTag, deleteTag } from '../services/LabelService';
import { getSectors, Sector } from '../services/SectorService';
import SessionService from '../services/SessionService';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '../components/LoadingOverlay';

const { Option } = Select;

const LabelPage = () => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTags();
        fetchSectors();
    }, [navigate]);

    const fetchTags = async () => {
        try {
            setIsLoading(true);
            const response: any = await getTags();
            setTags(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Erro ao buscar etiquetas:', error);
            setTags([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSectors = async () => {
        try {
            const token = SessionService.getSession('authToken');
            setSelectedSectorId(SessionService.getSession('selectedSector'));
            const response: any = await getSectors(token);
            setSectors(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
            setSectors([]);
        }
    };

    const handleEdit = (index: number) => {
        setEditing(index);
        setNewTitle(tags[index].name);
        setNewDescription(tags[index].description);
        setSelectedSectorId(tags[index].sectorId);
    };

    const handleSave = async () => {
        try {
            if (editing !== null) {

                const updatedTag: UpdateTagRequestDTO = {
                    name: newTitle,
                    description: newDescription,
                    sectorId: SessionService.getSessionForSector(),
                };

                if (editing < tags.length) {
                    await updateTag(tags[editing].id, updatedTag);
                } else {
                    const newTag: CreateTagRequestDTO = {
                        name: newTitle,
                        description: newDescription,
                        sectorId: SessionService.getSessionForSector(),
                    };
                    await createTag(newTag);
                }

                await fetchTags();
            }
        } catch (error) {
            console.error('Erro ao salvar etiqueta:', error);
        }
        setEditing(null);
        setNewTitle('');
        setNewDescription('');
    };

    const handleDelete = async (index: number) => {
        try {
            await deleteTag(tags[index].id);
            await fetchTags();
            setConfirmDelete(null);
        } catch (error) {
            console.error('Erro ao excluir etiqueta:', error);
        }
    };


    return (
        <div className="p-8">
            {isLoading && <LoadingOverlay />}

            <h1 style={{color: '#1890ff'}} className="text-3xl font-bold mb-6">Etiquetas</h1>
            {selectedSectorId === null && (
                <div className="flex justify-center items-center h-64 text-lg text-gray-500">
                    Nenhum setor selecionado
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.isArray(tags) && tags.length > 0 ? (
                    tags.map((tag, index) => {
                        const associatedSector = sectors.find((sector) => sector.id === tag.sectorId);
                        return (
                            <Card
                                key={tag.id}
                                className="relative rounded-lg border border-gray-200 shadow-sm"
                                actions={[
                                    <EditOutlined className="text-blue-500" onClick={() => handleEdit(index)} />,
                                    <DeleteOutlined className="text-red-500" onClick={() => setConfirmDelete(index)} />,
                                ]}
                            >
                                <Skeleton active loading={isLoading}>
                                    {confirmDelete === index ? (
                                        <div className="p-4 bg-yellow-400 rounded-lg">
                                            <p className="font-bold">Deseja mesmo excluir?</p>
                                            <p className="text-sm text-gray-800">Essa ação é irreversível.</p>
                                            <div className="flex justify-end mt-4 space-x-2">
                                                <Button onClick={() => setConfirmDelete(null)}>Não</Button>
                                                <Button type="primary" danger onClick={() => handleDelete(index)}>
                                                    Sim
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="font-bold text-lg">{tag.name}</h3>
                                            <p className="text-gray-500 mt-2">Descrição: {tag.description? tag.description : "Não definido"}</p>
                                           
                                        </>
                                    )}
                                </Skeleton>
                            </Card>
                        );
                    })
                ) : (
                    <></>
                )}
                {selectedSectorId != null && (
                    <div
                        className="flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer p-4"
                        onClick={() => setEditing(tags.length)}
                    >
                        <PlusOutlined className="text-blue-500 text-3xl" />
                    </div>
                )}
            </div>

            <Modal
                title="Editar Etiqueta"
                open={editing !== null}
                onCancel={() => setEditing(null)}
                footer={[
                    <Button key="cancel" onClick={() => setEditing(null)}>
                        Cancelar
                    </Button>,
                    <Button key="save" type="primary" onClick={handleSave}>
                        Salvar
                    </Button>,
                ]}
            >
                <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Nome da etiqueta"
                    className="mb-2"
                />
                <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Descrição da etiqueta"
                    className="mb-2"
                />
            </Modal>
        </div>
    );
};

export default LabelPage;
