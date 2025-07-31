// superset-frontend/src/views/ChatLauncher.tsx
import React from 'react';
import Chat from './Chat';

export interface ChatLauncherProps {
  /** Called when Chat’s internal X is clicked */
  onClose: () => void;
}

/**
 * Just renders <Chat onClose={...}/> — no more internal open state.
 */
const ChatLauncher: React.FC<ChatLauncherProps> = ({ onClose }) => {
  return <Chat onClose={onClose} />;
};

export default ChatLauncher;