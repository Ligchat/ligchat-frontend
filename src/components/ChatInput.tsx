import React, { useRef, useState, memo } from 'react';
import { Button, Upload, Input, message } from 'antd';
import { SendOutlined, PictureOutlined, PaperClipOutlined, AudioOutlined, SmileOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioRecorder } from './AudioRecorder';
import EmojiPicker from './EmojiPicker';
import { sendMessage, sendFile, determineMediaType } from '../services/MessageService';

const { TextArea } = Input;

interface ChatInputProps {
  messageInput: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File, type: 'image' | 'document') => void;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  contactId: number;
  sectorId: number;
  recipient: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  messageInput,
  onMessageChange,
  onSendMessage,
  onFileUpload,
  showEmojiPicker,
  onToggleEmojiPicker,
  contactId,
  sectorId,
  recipient
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmojiSelect = (emoji: any) => {
    const cursor = messageInputRef.current?.selectionStart || 0;
    const text = messageInput || '';
    const newText = text.slice(0, cursor) + emoji.native + text.slice(cursor);
    onMessageChange(newText);
    messageInputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || isLoading) return;

    try {
      setIsLoading(true);

      if (!recipient) {
        message.error('Número do destinatário é obrigatório');
        return;
      }

      if (selectedFile) {
        await sendFile({
          file: selectedFile,
          caption: messageInput,
          recipient: recipient,
          contactId: contactId,
          sectorId: sectorId
        });
      } else {
        console.log('Enviando mensagem com dados:', {
          to: recipient,
          recipientPhone: recipient,
          text: messageInput,
          contactId: contactId,
          sectorId: sectorId
        });

        await sendMessage({
          to: recipient,
          recipientPhone: recipient,
          text: messageInput,
          contactId: contactId,
          sectorId: sectorId
        });
      }

      onMessageChange('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      message.error('Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: File, type: 'image' | 'document') => {
    try {
      await sendFile({
        file,
        caption: messageInput,
        recipient,
        contactId,
        sectorId
      });

      onMessageChange('');
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      message.error('Erro ao enviar arquivo');
    }
  };

  return (
    <div className="input-container">
      <AnimatePresence mode="wait" initial={false}>
        {isRecording ? (
          <AudioRecorder
            onCancel={() => setIsRecording(false)}
            onSend={async (audioBlob) => {
              try {
                const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });
                await sendFile({
                  file: audioFile,
                  recipient,
                  contactId,
                  sectorId
                });
                setIsRecording(false);
              } catch (error) {
                console.error('Erro ao enviar áudio:', error);
                message.error('Erro ao enviar áudio');
              }
            }}
          />
        ) : (
          <motion.div 
            className="message-input-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="input"
            transition={{ duration: 0.2 }}
          >
            <div className="input-actions-left">
              <Button
                type="text"
                icon={<SmileOutlined />}
                onClick={onToggleEmojiPicker}
                className={`message-action-button ${showEmojiPicker ? 'active' : ''}`}
              />
              <EmojiPicker
                isOpen={showEmojiPicker}
                onEmojiSelect={handleEmojiSelect}
              />
            </div>
            
            <TextArea
              ref={messageInputRef}
              placeholder="Digite uma mensagem..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              className="message-input"
              value={messageInput}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            <div className="message-actions">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleFileSelect(file, 'image');
                  return false;
                }}
              >
                <Button
                  type="text"
                  icon={<PictureOutlined />}
                  className="message-action-button"
                />
              </Upload>

              <Upload
                accept="*/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleFileSelect(file, 'document');
                  return false;
                }}
              >
                <Button
                  type="text"
                  icon={<PaperClipOutlined />}
                  className="message-action-button"
                />
              </Upload>

              <Button
                type="text"
                icon={<AudioOutlined />}
                onClick={() => setIsRecording(true)}
                className="message-action-button"
              />

              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                className="send-button"
                disabled={!messageInput?.trim() || isLoading}
                loading={isLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(ChatInput); 