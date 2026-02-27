import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import './App.css';

// ── Inline SVG Icons ──────────────────────────────────────────
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const BotIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="9"  cy="16" r="1" fill="currentColor" />
    <circle cx="15" cy="16" r="1" fill="currentColor" />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6"  x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ZapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const today = new Date();
  const diff = today.getDate() - d.getDate();
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Capability Prompt Cards ───────────────────────────────────
const CAPABILITIES = [
  { icon: '💬', title: 'Natural Conversations',   desc: 'Engage in fluid, context-aware dialogues'         },
  { icon: '📊', title: 'Data Analysis',           desc: 'Get insights from complex data and reports'        },
  { icon: '⚡', title: 'Real-time Streaming',     desc: 'Responses delivered as they\'re generated'         },
  { icon: '🔒', title: 'Secure & Private',        desc: 'Enterprise-grade session-based data protection'    },
];

// ── Main Component ────────────────────────────────────────────
export default function App() {
  const [socket,          setSocket]          = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [input,           setInput]           = useState('');
  const [isConnected,     setIsConnected]     = useState(false);
  const [isStreaming,     setIsStreaming]      = useState(false);
  const [isWaiting,       setIsWaiting]       = useState(false);   // waiting for first chunk
  const [sidebarOpen,     setSidebarOpen]     = useState(true);
  const [copiedId,        setCopiedId]        = useState(null);
  const [currentConvId,   setCurrentConvId]   = useState(null);

  const [conversations, setConversations] = useState(() => {
    try {
      const raw = localStorage.getItem('nexusai-convs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaiting]);

  // Persist conversations
  useEffect(() => {
    localStorage.setItem('nexusai-convs', JSON.stringify(conversations));
  }, [conversations]);

  // Socket lifecycle
  useEffect(() => {
    const sock = io('http://localhost:3000');

    sock.on('connect',    () => setIsConnected(true));
    sock.on('disconnect', () => setIsConnected(false));

    // First chunk arrives → stop waiting indicator, start streaming
    sock.on('ai-message-chunk', (data) => {
      setIsWaiting(false);
      setIsStreaming(true);

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === 'bot' && last.isStreaming) {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, text: data.text };
          return updated;
        }
        return [
          ...prev,
          { id: genId(), text: data.text, sender: 'bot', isStreaming: true, timestamp: new Date() },
        ];
      });
    });

    // Stream complete
    sock.on('ai-message-done', () => {
      setIsStreaming(false);
      setIsWaiting(false);
      setMessages((prev) => {
        if (!prev.length) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: false };
        return updated;
      });
    });

    setSocket(sock);
    return () => sock.disconnect();
  }, []);

  // Send message
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !socket || isStreaming || isWaiting) return;

    const userMsg = { id: genId(), text, sender: 'user', timestamp: new Date() };

    // Create / update conversation record
    if (!currentConvId) {
      const newId  = genId();
      const newConv = {
        id:         newId,
        title:      text.slice(0, 52) + (text.length > 52 ? '…' : ''),
        createdAt:  new Date(),
        msgCount:   1,
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConvId(newId);
    } else {
      setConversations((prev) =>
        prev.map((c) => c.id === currentConvId ? { ...c, msgCount: (c.msgCount || 0) + 1 } : c)
      );
    }

    setMessages((prev) => [...prev, userMsg]);
    socket.emit('ai-message', { input: text });
    setInput('');
    setIsWaiting(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, socket, isStreaming, isWaiting, currentConvId]);

  // Keyboard handler
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Textarea auto-resize
  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  // New chat
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConvId(null);
    setInput('');
    setIsWaiting(false);
    setIsStreaming(false);
    if (socket) socket.emit('clear-chat');
  }, [socket]);

  // Load / switch conversation (UI only — backend keeps one session per socket)
  const handleSelectConv = (convId) => {
    if (convId === currentConvId) return;
    handleNewChat();
    setCurrentConvId(convId);
  };

  // Delete conversation
  const handleDeleteConv = (e, convId) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (convId === currentConvId) handleNewChat();
  };

  // Copy message text
  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  // Group conversations by date
  const groupedConvs = conversations.reduce((acc, conv) => {
    const label = formatDate(conv.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(conv);
    return acc;
  }, {});

  const showTyping = isWaiting || (isStreaming && messages[messages.length - 1]?.sender !== 'bot');

  return (
    <div className="app-root">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>

        {/* Brand */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon"><ZapIcon /></div>
            <div>
              <div className="brand-name">NexusAI</div>
              <div className="brand-version">Enterprise</div>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} title="Close sidebar">
            ×
          </button>
        </div>

        {/* New Chat */}
        <button className="new-chat-btn" onClick={handleNewChat}>
          <PlusIcon />
          New Conversation
        </button>

        {/* Conversations */}
        <div className="conversations-section">
          {conversations.length === 0 ? (
            <div className="no-conversations">
              Start a conversation to see your history here
            </div>
          ) : (
            Object.entries(groupedConvs).map(([date, convs]) => (
              <div key={date}>
                <div className="section-label">{date}</div>
                {convs.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${conv.id === currentConvId ? 'active' : ''}`}
                    onClick={() => handleSelectConv(conv.id)}
                    title={conv.title}
                  >
                    <ChatIcon />
                    <div className="conv-info">
                      <span className="conv-title">{conv.title}</span>
                      <span className="conv-meta">{conv.msgCount || 0} messages</span>
                    </div>
                    <button
                      className="conv-delete"
                      onClick={(e) => handleDeleteConv(e, conv.id)}
                      title="Delete conversation"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="model-badge">
            <ZapIcon />
            <span>Gemini 2.5 Flash Lite</span>
          </div>
          <div className="user-profile">
            <div className="u-avatar">EN</div>
            <div className="user-info">
              <span className="user-name">Enterprise User</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────── */}
      <div className="main-area">

        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            {!sidebarOpen && (
              <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar">
                <MenuIcon />
              </button>
            )}
            <div className="header-title">
              AI Assistant
              <div className={`status-pill ${isConnected ? 'connected' : 'disconnected'}`}>
                <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                {isConnected ? 'Live' : 'Offline'}
              </div>
            </div>
          </div>

          <div className="header-right">
            <span className="model-tag">Gemini 2.5 Flash Lite</span>
            {messages.length > 0 && (
              <button className="clear-btn" onClick={handleNewChat}>
                Clear Chat
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="messages-area">
          {messages.length === 0 && !isWaiting ? (
            /* Empty / Welcome State */
            <div className="empty-state">
              <div className="empty-icon"><BotIcon /></div>
              <h2>How can I assist you today?</h2>
              <p>
                I'm NexusAI — your enterprise intelligence assistant.
                Ask me anything or pick a capability below.
              </p>
              <div className="capability-cards">
                {CAPABILITIES.map((cap, i) => (
                  <div
                    key={i}
                    className="capability-card"
                    onClick={() => {
                      setInput(cap.title + ' — ');
                      textareaRef.current?.focus();
                    }}
                  >
                    <span className="cap-icon">{cap.icon}</span>
                    <div>
                      <div className="cap-title">{cap.title}</div>
                      <div className="cap-desc">{cap.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Message Thread */
            <div className="messages-list">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender}`}>

                  {/* Avatar */}
                  <div className="msg-avatar">
                    {msg.sender === 'bot'
                      ? <div className="bot-avatar"><BotIcon /></div>
                      : <div className="user-avatar">EU</div>
                    }
                  </div>

                  {/* Content */}
                  <div className="message-body">
                    <div className="message-meta">
                      <span className="sender-name">
                        {msg.sender === 'bot' ? 'NexusAI' : 'You'}
                      </span>
                      <span className="msg-time">{formatTime(msg.timestamp)}</span>
                      {msg.isStreaming && (
                        <span className="streaming-badge">Responding…</span>
                      )}
                    </div>

                    <div className={`message-bubble ${msg.sender}`}>
                      {msg.sender === 'bot' ? (
                        <div className="markdown-content">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                          {msg.isStreaming && <span className="cursor-blink">▋</span>}
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>

                    {/* Actions (visible on hover) */}
                    {!msg.isStreaming && (
                      <div className="message-actions">
                        <button
                          className={`action-btn ${copiedId === msg.id ? 'copied' : ''}`}
                          onClick={() => handleCopy(msg.text, msg.id)}
                          title="Copy to clipboard"
                        >
                          {copiedId === msg.id ? <CheckIcon /> : <CopyIcon />}
                          <span>{copiedId === msg.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing / waiting indicator */}
              {showTyping && (
                <div className="typing-row">
                  <div className="bot-avatar"><BotIcon /></div>
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message NexusAI…"
              className="chat-input"
              rows={1}
              disabled={isStreaming || isWaiting}
            />
            <div className="input-controls">
              <span className="char-count">{input.length || ''}</span>
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || isWaiting}
                title="Send message (Enter)"
              >
                <SendIcon />
              </button>
            </div>
          </div>

          <div className="input-footer">
            <span>NexusAI may make mistakes — verify important information.</span>
            <div className="input-hint">
              <span className="hint-key">Enter</span>
              <span>send</span>
              <span>&nbsp;·&nbsp;</span>
              <span className="hint-key">Shift+Enter</span>
              <span>new line</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
