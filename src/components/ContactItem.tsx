import React from 'react';
import { FiMail, FiPhone } from 'react-icons/fi';
import dayjs from 'dayjs';

interface ContactItemProps {
  contact: {
    id: number;
    name: string;
    number: string;
    email?: string;
    avatarUrl: string | null;
    lastMessage?: string;
    lastMessageTime?: string;
    tagId?: number | null;
    tagColor?: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  hasNewMessage?: boolean;
  onClearNewMessage?: (number: string) => void;
}

const formatPhoneNumber = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length === 13 && numbers.startsWith('55')) {
    return `+55 (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
  } else if (numbers.length === 11) {
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  return phone.startsWith('+55') ? phone : `+55 ${phone}`;
};

export const ContactItem: React.FC<ContactItemProps> = ({ 
  contact, 
  isSelected, 
  onSelect,
  hasNewMessage = false,
  onClearNewMessage
}) => {
  const handleClick = () => {
    if (hasNewMessage && onClearNewMessage) {
      onClearNewMessage(contact.number);
    }
    onSelect();
  };

  return (
    <div 
      className={`contact-item ${isSelected ? 'selected' : ''} ${hasNewMessage ? 'has-new-message' : ''}`}
      onClick={handleClick}
    >
      <div className="contact-avatar">
        <img 
          src={contact.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}`}
          alt={contact.name}
          style={contact.tagId ? { borderColor: contact.tagColor } : undefined}
        />
        {hasNewMessage && (
          <div className="new-message-indicator" />
        )}
      </div>
      
      <div className="contact-info">
        <div className="contact-header">
          <span className="contact-name">{contact.name}</span>
          <span className="contact-time">
            {contact.lastMessageTime ? dayjs(contact.lastMessageTime).format('HH:mm') : ''}
          </span>
        </div>
        
        <div className="contact-message">
          <span className="message-preview">
            {contact.lastMessage || 'Nenhuma mensagem'}
          </span>
        </div>
        
        <div className="contact-details">
          {contact.email && (
            <span className="contact-email" title={contact.email}>
              <FiMail size={12} />
              {contact.email}
            </span>
          )}
          <span className="contact-phone">
            <FiPhone size={12} />
            {formatPhoneNumber(contact.number)}
          </span>
        </div>
      </div>
    </div>
  );
}; 