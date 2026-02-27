import { useState, useRef, useEffect } from 'react';
import { io } from "socket.io-client";
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket Connection setup
  useEffect(() => {
    const socketInstance = io("http://localhost:3000");
    setSocket(socketInstance); 

    // Jab chunk aaye, text ko REPLACE karein (Streaming Bug Fix)
    socketInstance.on('ai-message-chunk', (data) => {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];

        if (lastMessage && lastMessage.sender === 'bot' && lastMessage.isStreaming) {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1].text = data.text; // Replacing text
          return updatedMessages;
        } else {
          const newBotMessage = {
            id: Date.now(),
            text: data.text,
            sender: 'bot',
            isStreaming: true,
            // timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return [...prevMessages, newBotMessage];
        }
      });
    });

    // Stream complete hone par
    socketInstance.on('ai-message-done', () => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        if (updatedMessages.length > 0) {
          updatedMessages[updatedMessages.length - 1].isStreaming = false; 
        }
        return updatedMessages;
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (input.trim() === '' || !socket) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    socket.emit('ai-message', { input });
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // NAYA FUNCTION: Chat aur backend memory clear karne ke liye
  const handleClearChat = () => {
    setMessages([]); // UI clear
    if (socket) {
      socket.emit('clear-chat'); // Backend array clear
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>AI Chat</h1>
          <p>Always here to help</p>
        </div>
        
        {/* NAYA BUTTON: Clear Chat */}
        <button 
          onClick={handleClearChat} 
          style={{
            padding: "8px 16px", 
            backgroundColor: "#ff4d4f", 
            color: "white", 
            border: "none", 
            borderRadius: "6px", 
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Clear Chat
        </button>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h2>Start a Conversation</h2>
            <p>Send a message to begin chatting with AI</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-content">
                
                {/* Markdown formatting applied here */}
                {message.sender === 'bot' ? (
                  <div className="markdown-response">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{message.text}</p>
                )}

                <span className="message-time">{message.timestamp}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className="message-input"
        />
        <button onClick={handleSendMessage} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
}

export default App;