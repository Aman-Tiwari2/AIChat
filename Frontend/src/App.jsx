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

    // Jab chunk aaye, text ko REPLACE karein, APPEND NAHI (Bug fix)
    socketInstance.on('ai-message-chunk', (data) => {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];

        // Agar bot type kar raha hai, toh text update karo
        if (lastMessage && lastMessage.sender === 'bot' && lastMessage.isStreaming) {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1].text = data.text; // Fixed: = instead of +=
          return updatedMessages;
        } 
        // Naya message start karo
        else {
          const newBotMessage = {
            id: Date.now(),
            text: data.text,
            sender: 'bot',
            isStreaming: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>AI Chat</h1>
        <p>Always here to help</p>
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


// import { useState, useRef, useEffect } from 'react'
// import { io } from "socket.io-client";
// import ReactMarkdown from 'react-markdown'; // <-- 1. Import added
// import './App.css'

// function App() {
//   const [socket, setSocket] = useState(null)
//   const [messages, setMessages] = useState([])
//   const [input, setInput] = useState('')
//   const messagesEndRef = useRef(null)

//   // Auto-scroll to bottom when new messages arrive
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [messages])

//   const handleSendMessage = () => {
//     if (input.trim() === '') return

//     // Add user message
//     const userMessage = {
//       id: Date.now(),
//       text: input,
//       sender: 'user',
//       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//     }

//     setMessages([...messages, userMessage])
//     socket.emit('ai-message', {input})
//     setInput('')
//   }

//   useEffect(() => {
//     let socketInstance = io("http://localhost:3000")
//     setSocket(socketInstance) 

//     socketInstance.on('ai-message-response', (response) => {
//       const botMessage = {
//         id: Date.now() + 1,
//         text: response.response,
//         sender: 'bot',
//         // timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // <-- Added timestamp for bot too
//       }
//       setMessages(prev => [...prev, botMessage]) 
//     })

//     // Cleanup function to avoid multiple socket connections
//     return () => {
//       socketInstance.disconnect();
//     }
//   }, [])

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault()
//       handleSendMessage()
//     }
//   }

//   return (
//     <div className="chat-container">
//       <div className="chat-header">
//         <h1>AI Chat</h1>
//         <p>Always here to help</p>
//       </div>

//       <div className="messages-container">
//         {messages.length === 0 ? (
//           <div className="empty-state">
//             <h2>Start a Conversation</h2>
//             <p>Send a message to begin chatting with AI</p>
//           </div>
//         ) : (
//           messages.map((message) => (
//             <div key={message.id} className={`message ${message.sender}`}>
//               <div className="message-content">
                
//                 {/* 2. Changed plain <p> to handle Markdown for Bot messages */}
//                 {message.sender === 'bot' ? (
//                   <div className="markdown-response">
//                     <ReactMarkdown>{message.text}</ReactMarkdown>
//                   </div>
//                 ) : (
//                   <p>{message.text}</p>
//                 )}

//                 <span className="message-time">{message.timestamp}</span>
//               </div>
//             </div>
//           ))
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       <div className="input-container">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyPress={handleKeyPress}
//           placeholder="Type your message here..."
//           className="message-input"
//         />
//         <button onClick={handleSendMessage} className="send-button">
//           Send
//         </button>
//       </div>
//     </div>
//   )
// }

// export default App