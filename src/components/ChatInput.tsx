import React, { useRef, useState, memo } from 'react';
import { FiSend, FiImage, FiPaperclip, FiMic, FiSmile } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioRecorder } from './AudioRecorder';
import EmojiPicker from './EmojiPicker';
import { sendMessage, sendFile, determineMediaType } from '../services/MessageService';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messageInput.trim()) {
        onSendMessage(messageInput);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = determineMediaType(file);
    if (type === 'image' || type === 'document') {
      onFileUpload(file, type);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          onFileUpload(file, 'image');
        }
        break;
      }
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    const file = new File([audioBlob], 'audio-message.webm', { type: 'audio/webm' });
    onFileUpload(file, 'document');
    setIsRecording(false);
  };

  return (
    <div className="chat-input-container bg-gray-800 p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-gray-700 rounded-lg p-2">
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent text-white resize-none outline-none"
            rows={1}
            placeholder="Digite uma mensagem..."
            value={messageInput}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            onClick={onToggleEmojiPicker}
          >
            <FiSmile size={20} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />

          <button
            className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiPaperclip size={20} />
          </button>

          <button
            className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiImage size={20} />
          </button>

          <button
            className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            onClick={handleStartRecording}
          >
            <FiMic size={20} />
          </button>

          {messageInput.trim() && (
            <button
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              onClick={() => onSendMessage(messageInput)}
            >
              <FiSend size={20} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiSelect={(emoji: any) => {
              onMessageChange(messageInput + emoji.native);
              onToggleEmojiPicker();
            }}
            isOpen={showEmojiPicker}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRecording && (
          <AudioRecorder
            onCancel={handleStopRecording}
            onSend={handleSendAudio}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(ChatInput); 