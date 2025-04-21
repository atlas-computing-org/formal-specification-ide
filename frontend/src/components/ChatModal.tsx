import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat.ts';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const chatThreadRef = useRef<HTMLDivElement>(null);
  const { chatMessages, sendChatMessage, resetChat } = useChat();

  useEffect(() => {
    if (chatThreadRef.current) {
      chatThreadRef.current.scrollTop = chatThreadRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      await sendChatMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div id="chat-modal" className={`modal ${isOpen ? 'show' : ''}`}>
      <div className="modal-content">
        <div id="chat-header">
          <button onClick={onClose}>Hide AI Assistant</button>
          <button onClick={resetChat}>Reset Chat</button>
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
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}; 