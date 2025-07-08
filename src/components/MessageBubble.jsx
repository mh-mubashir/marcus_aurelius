import React from 'react';

const MessageBubble = ({ message }) => {
  return (
    <div className={`message ${message.sender}`}>
      <div className="message-avatar">
        {message.sender === 'user' ? 'U' : 'T'}
      </div>
      <div className="message-content">
        {message.text}
      </div>
    </div>
  );
};

export default MessageBubble; 