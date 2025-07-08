import React from 'react';
import ChatInterface from './components/ChatInterface.jsx';

function App() {
  return (
    <div className="app">
      <div className="header">
        <h1>Marcus Aurelius: Meditations Chat</h1>
        <p>Your personal conversation with the Roman emperor and Stoic philosopher</p>
      </div>
      <ChatInterface />
    </div>
  );
}

export default App; 