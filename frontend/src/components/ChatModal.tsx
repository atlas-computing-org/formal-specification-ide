import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat.ts';

// Type definitions
interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Component
export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  // State and hooks
  const [message, setMessage] = useState('');
  const chatThreadRef = useRef<HTMLDivElement>(null);
  const { chatMessages, sendChatMessage, resetChat } = useChat();

  // Effects
  useEffect(() => {
    if (chatThreadRef.current) {
      chatThreadRef.current.scrollTop = chatThreadRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Event handlers
  const handleSendMessage = async () => {
    if (message.trim()) {
      setMessage('');
      await sendChatMessage(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Main render
  return (
    <div id="chat-modal" className={`modal ${isOpen ? 'show' : ''}`}>
      <div className="modal-content">
        <div id="chat-header">
          <button id="hide-chat" onClick={onClose}>Hide AI Assistant</button>
          <button id="reset-chat" onClick={resetChat}>Reset Chat</button>
        </div>
        <div id="chat-thread" ref={chatThreadRef}>
          {chatMessages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.sender}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <div id="chat-compose-bar">
          <input
            type="text"
            id="chat-input"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button id="send-message" onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}; 