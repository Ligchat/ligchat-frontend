import React, { useState, useEffect } from 'react';
import { getAllUsers, getTags, getContacts } from '../services/api';
import { SessionService } from '../services/SessionService';

const [isInitialized, setIsInitialized] = useState(false);

useEffect(() => {
  const initializeData = async () => {
    if (!selectedSectorId || isInitialized) return;
    
    setIsLoading(true);
    try {
      const [users, tags, contactsResponse] = await Promise.all([
        getAllUsers().catch(error => {
          console.error('Erro ao buscar usuários:', error);
          return [];
        }),
        getTags(Number(selectedSectorId)).catch(error => {
          console.error('Erro ao buscar tags:', error);
          return [];
        }),
        getContacts(Number(selectedSectorId), SessionService.getSectorIsOfficial() || false).catch(error => {
          console.error('Erro ao buscar contatos:', error);
          return null;
        })
      ]);

      setUsers(users || []);
      setTags(tags || []);

      if (contactsResponse?.data) {
        const currentContactsMap = new Map(contacts.map(contact => [contact.id, contact]));
        const updatedContacts = contactsResponse.data.map(contact => ({
          ...contact,
          lastMessage: currentContactsMap.get(contact.id)?.lastMessage || '',
          lastMessageTime: currentContactsMap.get(contact.id)?.lastMessageTime || '',
          unreadCount: currentContactsMap.get(contact.id)?.unreadCount || 0
        }));
        setContacts(updatedContacts);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setError('Erro ao carregar dados iniciais. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  initializeData();
}, [selectedSectorId, isInitialized]);

useEffect(() => {
  const checkSector = () => {
    const sectorId = SessionService.getSectorId();
    if (!sectorId) {
      const storedSectorId = localStorage.getItem('selectedSector');
      if (storedSectorId) {
        const isOfficial = SessionService.getSectorIsOfficial();
        if (isOfficial !== null) {
          SessionService.setSectorId(Number(storedSectorId), isOfficial);
        }
        setSelectedSectorId(storedSectorId);
      }
      return;
    }

    const isOfficial = SessionService.getSectorIsOfficial();
    if (sectorId && isOfficial !== null && String(sectorId) !== selectedSectorId) {
      setSelectedSectorId(String(sectorId));
      setIsInitialized(false); // Reset initialization when sector changes
    }
  };

  checkSector();
  const intervalId = setInterval(checkSector, 5000);
  return () => clearInterval(intervalId);
}, [selectedSectorId]); 