import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

// ── SVG Icons ─────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5"  y1="12" x2="19" y2="12" />
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ThumbUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const ThumbDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const BotIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="9"  cy="16" r="1" fill="currentColor" />
    <circle cx="15" cy="16" r="1" fill="currentColor" />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6"  x2="21" y2="6"  />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ZapIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────
const genId      = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fmtTime    = (d) => d ? new Date(d).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '';
const fmtDate    = (d) => {
  if (!d) return '';
  const diff = new Date().getDate() - new Date(d).getDate();
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ── Code Block Icon ───────────────────────────────────────────
const CodeBlockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

// ── Custom Code Block ─────────────────────────────────────────
function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="code-block">
      <div className="code-block-header">
        <div className="code-block-lang">
          <CodeBlockIcon />
          <span>{language || 'code'}</span>
        </div>
        <button className="code-copy-btn" onClick={copy}>
          {copied ? (
            <><CheckIcon /><span>Copied!</span></>
          ) : (
            <><CopyIcon /><span>Copy</span></>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '14px 16px',
          background: '#161616',
          borderRadius: '0 0 10px 10px',
          fontSize: '13px',
          lineHeight: '1.65',
        }}
        codeTagProps={{ style: { fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace' } }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

// ── Markdown Components ───────────────────────────────────────
const MD_COMPONENTS = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const value = String(children).replace(/\n$/, '');
    if (!inline && match) {
      return <CodeBlock language={match[1]} value={value} />;
    }
    return <code className={className} {...props}>{children}</code>;
  },
};

// ── Capability Card Icons ─────────────────────────────────────
const IconConversation = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconAnalysis = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);
const IconStreaming = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconSecure = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

// ── Capability Cards ──────────────────────────────────────────
const CAPS = [
  { Icon: IconConversation, title: 'Natural Conversations',  desc: 'Fluid, context-aware dialogues'            },
  { Icon: IconAnalysis,     title: 'Data Analysis',          desc: 'Insights from complex data & reports'      },
  { Icon: IconStreaming,    title: 'Real-time Streaming',    desc: 'Responses delivered as they\'re generated' },
  { Icon: IconSecure,       title: 'Secure & Private',       desc: 'Enterprise-grade session protection'       },
];

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [socket,        setSocket]        = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [isConnected,   setIsConnected]   = useState(false);
  const [isStreaming,   setIsStreaming]   = useState(false);
  const [isWaiting,     setIsWaiting]     = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [copiedId,      setCopiedId]      = useState(null);
  const [feedback,      setFeedback]      = useState({});   // { [msgId]: 'up' | 'down' }
  const [currentConvId, setCurrentConvId] = useState(null);

  const [conversations, setConversations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexusai-convs') || '[]'); }
    catch { return []; }
  });

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaiting]);

  useEffect(() => {
    localStorage.setItem('nexusai-convs', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    const sock = io('http://localhost:3000');
    sock.on('connect',    () => setIsConnected(true));
    sock.on('disconnect', () => setIsConnected(false));

    sock.on('ai-message-chunk', (data) => {
      setIsWaiting(false);
      setIsStreaming(true);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.sender === 'bot' && last?.isStreaming) {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, text: data.text };
          return updated;
        }
        return [...prev, { id: genId(), text: data.text, sender: 'bot', isStreaming: true, timestamp: new Date() }];
      });
    });

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

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !socket || isStreaming || isWaiting) return;

    if (!currentConvId) {
      const id = genId();
      setConversations((p) => [{ id, title: text.slice(0, 52) + (text.length > 52 ? '…' : ''), createdAt: new Date(), msgCount: 1 }, ...p]);
      setCurrentConvId(id);
    } else {
      setConversations((p) => p.map((c) => c.id === currentConvId ? { ...c, msgCount: (c.msgCount || 0) + 1 } : c));
    }

    setMessages((p) => [...p, { id: genId(), text, sender: 'user', timestamp: new Date() }]);
    socket.emit('ai-message', { input: text });
    setInput('');
    setIsWaiting(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, socket, isStreaming, isWaiting, currentConvId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleNewChat = useCallback(() => {
    setMessages([]); setCurrentConvId(null); setInput('');
    setIsWaiting(false); setIsStreaming(false);
    if (socket) socket.emit('clear-chat');
  }, [socket]);

  const handleSelectConv = (id) => { if (id !== currentConvId) { handleNewChat(); setCurrentConvId(id); } };

  const handleDeleteConv = (e, id) => {
    e.stopPropagation();
    setConversations((p) => p.filter((c) => c.id !== id));
    if (id === currentConvId) handleNewChat();
  };

  const handleCopy = async (text, id) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }
    catch { /* ignore */ }
  };

  const handleFeedback = (id, type) => {
    setFeedback((prev) => ({ ...prev, [id]: prev[id] === type ? null : type }));
  };

  const handleRegenerate = useCallback((msgIndex) => {
    if (isStreaming || isWaiting) return;
    // Find the user message just before this bot message
    let userMsg = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') { userMsg = messages[i]; break; }
    }
    if (!userMsg) return;
    // Remove bot message from UI
    setMessages((prev) => prev.slice(0, msgIndex));
    setIsWaiting(true);
    // Ask server to pop last assistant response and re-process
    socket.emit('regenerate', { input: userMsg.text });
  }, [messages, socket, isStreaming, isWaiting]);

  const grouped = conversations.reduce((acc, c) => {
    const lbl = fmtDate(c.createdAt);
    (acc[lbl] = acc[lbl] || []).push(c);
    return acc;
  }, {});

  const showTyping = isWaiting || (isStreaming && messages[messages.length - 1]?.sender !== 'bot');

  return (
    <div className="app-root">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>

        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon"><ZapIcon /></div>
            <span className="brand-name">NexusAI</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>×</button>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <PlusIcon /> New chat
        </button>

        {/* Nav items */}
        <div className="sidebar-nav">
          <button className="nav-item"><SearchIcon /><span>Search chats</span></button>
        </div>

        {/* Conversations */}
        <div className="conversations-section">
          {conversations.length === 0 ? (
            <div className="no-conversations">No conversations yet</div>
          ) : (
            Object.entries(grouped).map(([date, convs]) => (
              <div key={date}>
                <div className="section-label">{date}</div>
                {convs.map((c) => (
                  <div
                    key={c.id}
                    className={`conversation-item ${c.id === currentConvId ? 'active' : ''}`}
                    onClick={() => handleSelectConv(c.id)}
                    title={c.title}
                  >
                    <ChatIcon />
                    <div className="conv-info">
                      <span className="conv-title">{c.title}</span>
                    </div>
                    <button className="conv-delete" onClick={(e) => handleDeleteConv(e, c.id)}>
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="u-avatar">EN</div>
            <div>
              <span className="user-name">Enterprise User</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────── */}
      <div className="main-area">

        {/* Minimal top bar */}
        <div className="main-topbar">
          <div className="topbar-left">
            {!sidebarOpen && (
              <button className="icon-btn" onClick={() => setSidebarOpen(true)}>
                <MenuIcon />
              </button>
            )}
            <button className="model-selector">
              NexusAI <ChevronDown />
            </button>
          </div>
          <div className="topbar-right">
            <div className={`status-pill ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.length === 0 && !isWaiting ? (
            <div className="empty-state">
              <div className="empty-icon"><ZapIcon size={22} /></div>
              <h2>How can I help you today?</h2>
              <p>Your enterprise AI assistant, powered by Groq.</p>
              <div className="capability-cards">
                {CAPS.map(({ Icon, title, desc }, i) => (
                  <div key={i} className="capability-card"
                    onClick={() => { setInput(title + ' — '); textareaRef.current?.focus(); }}>
                    <span className="cap-icon"><Icon /></span>
                    <div>
                      <div className="cap-title">{title}</div>
                      <div className="cap-desc">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender}`}>

                  <div className="msg-avatar">
                    {msg.sender === 'bot'
                      ? <div className="bot-avatar"><BotIcon /></div>
                      : <div className="user-avatar">EU</div>
                    }
                  </div>

                  <div className="message-body">
                    <div className="message-meta">
                      <span className="sender-name">{msg.sender === 'bot' ? 'NexusAI' : 'You'}</span>
                      <span className="msg-time">{fmtTime(msg.timestamp)}</span>
                      {msg.isStreaming && <span className="streaming-badge">Responding…</span>}
                    </div>

                    <div className={`message-bubble ${msg.sender}`}>
                      {msg.sender === 'bot' ? (
                        <div className="markdown-content">
                          <ReactMarkdown components={MD_COMPONENTS}>{msg.text}</ReactMarkdown>
                          {msg.isStreaming && <span className="cursor-blink">▋</span>}
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>

                    {!msg.isStreaming && (
                      <div className="message-actions">
                        <button className={`action-btn ${copiedId === msg.id ? 'copied' : ''}`}
                          onClick={() => handleCopy(msg.text, msg.id)} title="Copy">
                          {copiedId === msg.id ? <CheckIcon /> : <CopyIcon />}
                        </button>
                        {msg.sender === 'bot' && (
                          <>
                            <button
                              className={`action-btn ${feedback[msg.id] === 'up' ? 'active-up' : ''}`}
                              onClick={() => handleFeedback(msg.id, 'up')}
                              title="Good response">
                              <ThumbUpIcon />
                            </button>
                            <button
                              className={`action-btn ${feedback[msg.id] === 'down' ? 'active-down' : ''}`}
                              onClick={() => handleFeedback(msg.id, 'down')}
                              title="Bad response">
                              <ThumbDownIcon />
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => handleRegenerate(messages.findIndex((m) => m.id === msg.id))}
                              title="Regenerate response">
                              <RefreshIcon />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {showTyping && (
                <div className="typing-row">
                  <div className="bot-avatar"><BotIcon /></div>
                  <div className="typing-dots"><span /><span /><span /></div>
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
              placeholder="Message NexusAI"
              className="chat-input"
              rows={1}
              disabled={isStreaming || isWaiting}
            />
            <div className="input-controls">
              <span className="char-count">{input.length || ''}</span>
              <button className="send-btn" onClick={handleSend}
                disabled={!input.trim() || isStreaming || isWaiting}>
                <SendIcon />
              </button>
            </div>
          </div>
          <div className="input-footer">
            <span>NexusAI can make mistakes. Verify important information.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
