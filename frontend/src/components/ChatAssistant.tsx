import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../hooks/useChat.ts';
import { keyCodes } from '../utils/keyEventUtils.ts';

// Type definitions
interface ChatAssistantProps {}

// Component
export const ChatAssistant: React.FC<ChatAssistantProps> = () => {
  // State and hooks
  const [message, setMessage] = useState('');
  const chatThreadRef = useRef<HTMLDivElement>(null);
  const { chatMessages, sendChatMessage, resetChat, isLoading } = useChat();

  // Effects
  useEffect(() => {
    if (chatThreadRef.current) {
      chatThreadRef.current.scrollTop = chatThreadRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Event handlers
  const handleSendMessage = useCallback(async () => {
    if (message.trim()) {
      setMessage('');
      await sendChatMessage(message);
    }
  }, [message, sendChatMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === keyCodes.ENTER) {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  }, []);

  return (
    <>
      <div id="chat-header">
        <button id="reset-chat" onClick={resetChat}>Reset Chat</button>
      </div>
      <div id="chat-thread" ref={chatThreadRef}>
        {chatMessages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
      <div id="chat-compose-bar">
        <input
          type="text"
          id="chat-input"
          placeholder="Type a message..."
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button id="send-message" onClick={handleSendMessage} disabled={isLoading}>Send</button>
      </div>
    </>
  );
}; 