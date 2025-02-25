import React, { memo } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { motion, AnimatePresence } from 'framer-motion';
import './EmojiPicker.css';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: any) => void;
  isOpen: boolean;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="emoji-picker-wrapper"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="emoji-picker-container">
            <Picker
              data={data}
              onEmojiSelect={onEmojiSelect}
              set="native"
              theme="light"
              autoFocus={true}
              icons="solid"
              locale="pt"
              previewPosition="none"
              skinTonePosition="none"
              searchPosition="top"
              navPosition="bottom"
              perLine={8}
              emojiSize={22}
              emojiButtonSize={32}
              maxFrequentRows={1}
              categories={[
                'frequent',
                'people',
                'nature',
                'foods',
                'activity',
                'places',
                'objects',
                'symbols',
                'flags'
              ]}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(EmojiPicker); 