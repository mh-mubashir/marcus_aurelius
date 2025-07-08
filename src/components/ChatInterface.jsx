import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import { sendMessage, formatMessages, createSession, getSessionStatus, clearSession } from '../services/claudeAPI.js';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await createSession();
        console.log('✅ Session initialized');
      } catch (error) {
        console.error('❌ Failed to initialize session:', error);
      }
    };
    initializeSession();
  }, []);

  // Load conversation from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('therapist-chat');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Add welcome message
      setMessages([{
        id: Date.now(),
        sender: 'bot',
        text: "Greetings, I am Marcus Aurelius. I welcome you as a fellow traveler on the path of life. Ask me what you will, and I shall share with you the reflections and lessons I have gathered in my Meditations. Let us seek clarity and tranquility together."
      }]);
    }
  }, []);

  // Check session status periodically
  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const status = await getSessionStatus();
        if (status) {
          setSessionStatus(status);
          if (status.isExpired) {
            setSessionExpired(true);
            console.log('⚠️ Session expired');
          }
        }
      } catch (error) {
        console.error('Error checking session status:', error);
      }
    };
    const interval = setInterval(checkSessionStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('therapist-chat', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage.trim()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const conversationHistory = [...messages, userMessage];
      const formattedMessages = formatMessages(conversationHistory);
      const botResponse = await sendMessage(formattedMessages);
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = async () => {
    setMessages([{
      id: Date.now(),
      sender: 'bot',
      text: "Greetings, I am Marcus Aurelius. I welcome you as a fellow traveler on the path of life. Ask me what you will, and I shall share with you the reflections and lessons I have gathered in my Meditations. Let us seek clarity and tranquility together."
    }]);
    setSessionExpired(false);
    clearSession();
    try {
      await createSession();
    } catch (error) {
      console.error('Error creating new session:', error);
    }
    localStorage.removeItem('therapist-chat');
  };

  return (
    <div className="chat-container">
      {/* Session status indicator */}
      {sessionStatus && (
        <div className="session-status">
          {sessionExpired ? (
            <div className="session-expired">
              ⚠️ Your session has expired. Please refresh the page or start a new conversation.
            </div>
          ) : (
            <div className="session-active">
              ⏰ Session active - {Math.round(sessionStatus.timeRemaining / 1000 / 60)} minutes remaining
            </div>
          )}
        </div>
      )}
      <div className="messages">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-avatar">T</div>
            <div className="message-content">
              <div className="loading">
                Thinking
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <input
          type="text"
          className="input-field"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={isLoading || sessionExpired}
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={isLoading || !inputMessage.trim() || sessionExpired}
        >
          ➤
        </button>
      </div>
      <div className="controls">
        <button className="control-button" onClick={clearConversation}>
          Clear Conversation
        </button>
      </div>
    </div>
  );
};

export default ChatInterface; 