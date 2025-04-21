import React from 'react';

export const ChatModal: React.FC = () => {
  return (
    <div id="chat-modal" className="modal">
      <div className="modal-content">
        <div id="chat-header">
          <button id="hide-chat">Hide AI Assistant</button>
          <button id="reset-chat">Reset Chat</button>
        </div>
        <div id="chat-thread"></div>
        <div id="chat-compose-bar">
          <input type="text" id="chat-input" placeholder="Type a message..." />
          <button id="send-message">Send</button>
        </div>
      </div>
    </div>
  );
}; 