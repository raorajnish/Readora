import { useState, useEffect, useRef } from "react";
import { MessageSquare, Settings, X, Plus, Send, MoreVertical, Smile, Navigation, Copy, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const ChatSection = ({ bookId, onClose }) => {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [confirmDeleteMe, setConfirmDeleteMe] = useState(false);
  const [confirmDeleteGlobal, setConfirmDeleteGlobal] = useState(false);
  
  const clearKey = `chat_clear_${bookId}_${user?.id}`;
  const clearTime = localStorage.getItem(clearKey) ? parseInt(localStorage.getItem(clearKey)) : 0;
  
  // History loading
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Interaction Menus
  const [optionsMenu, setOptionsMenu] = useState(null);
  const [activeReactMsg, setActiveReactMsg] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchHistory = async (pageNumber) => {
    try {
      setFetching(true);
      const res = await api.get(`/chat/messages/${bookId}/?page=${pageNumber}`);
      setMessages(prev => {
        return pageNumber === 1 ? res.data.messages : [...res.data.messages, ...prev];
      });
      setHasMore(res.data.has_more);
    } catch (e) {
      console.error("History fetch error:", e);
    } finally {
        setFetching(false);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const res = await api.get(`/chat/users/${bookId}/`);
      setOnlineUsersCount(res.data.online_users?.length || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory(1);
    fetchOnlineUsers();
    // eslint-disable-next-line
  }, [bookId]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Only scroll to bottom on page 1 loads or new messages at the bottom
    if (!showSettings && page === 1) {
      scrollToBottom();
    }
  }, [messages, typingUser, showSettings, page]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
    const wsUrl = `${protocol}${host}/ws/chat/${bookId}/`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        if (user) {
            ws.send(JSON.stringify({ type: 'join', username: user.username }));
        }
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "typing") {
        if (data.username !== user?.username) {
            setTypingUser(data.username);
            setTimeout(() => setTypingUser(null), 2000);
        }
      } else if (data.type === "chat_message") {
        if (data.sender_id !== user?.id) {
            ws.send(JSON.stringify({ type: 'seen', message_id: data.id }));
        }
        setMessages((prev) => [...prev, data]);
      } else if (data.type === "unsend") {
        setMessages(prev => prev.filter(m => m.id !== data.message_id));
      } else if (data.type === "mass_unsend") {
        setMessages(prev => prev.filter(m => m.sender_id !== data.user_id));
      } else if (data.type === "system") {
        setMessages(prev => [...prev, { id: Date.now(), is_system: true, content: data.content }]);
        if (data.online_count !== undefined) setOnlineUsersCount(data.online_count);
      } else if (data.type === "online_count_update") {
        setOnlineUsersCount(data.online_count);
      } else if (data.type === "reaction_event") {
        setMessages(prev => prev.map(m => {
            if (m.id === data.message_id) {
                const existing = m.reactions || [];
                return { ...m, reactions: [...existing.filter(r => r.user_id !== data.user_id), { emoji: data.emoji, user_id: data.user_id }] };
            }
            return m;
        }));
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [bookId, user]);

  const sendTyping = () => {
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      socket.send(JSON.stringify({ type: "typing", user_id: user.id, username: user.username }));
    }
  };

  const handleUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedImage(file);
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const doSend = (finalMediaUrl) => {
        if (socket && socket.readyState === WebSocket.OPEN && user) {
          socket.send(JSON.stringify({
            type: "message",
            sender_id: user.id,
            content: input.trim(),
            media_url: finalMediaUrl
          }));
        }
        setInput("");
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (selectedImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX = 800;
                if (width > height) {
                    if (width > MAX) {
                        height *= MAX / width;
                        width = MAX;
                    }
                } else {
                    if (height > MAX) {
                        width *= MAX / height;
                        height = MAX;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
                doSend(compressedUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(selectedImage);
    } else {
        doSend(null);
    }
  };

  const copyText = (text) => {
      navigator.clipboard.writeText(text);
      setOptionsMenu(null);
  };

  const unsendMessage = (msgId) => {
      if (socket) socket.send(JSON.stringify({ type: "unsend", message_id: msgId, user_id: user.id }));
      setOptionsMenu(null);
  };

  const reactMessage = (msgId, emoji) => {
      if (socket) socket.send(JSON.stringify({ type: "reaction", message_id: msgId, user_id: user.id, emoji }));
      setActiveReactMsg(null);
  };

  const renderMessage = (msg, index) => {
    if (msg.is_system) {
        return (
            <div key={msg.id || index} className="flex justify-center my-4">
                <span className="text-xs px-4 py-1.5 rounded-full shadow-sm" style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {msg.content}
                </span>
            </div>
        );
    }

    const isMe = msg.sender_id === user?.id;

    return (
      <div
        key={msg.id || index}
        className={`flex mb-4 relative ${isMe ? "justify-end" : "justify-start"} group`}
        onMouseLeave={() => {
            if (optionsMenu === msg.id) setOptionsMenu(null);
            if (activeReactMsg === msg.id) setActiveReactMsg(null);
        }}
      >
        <div className={`flex gap-1 max-w-[85%] items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          
          {/* Avatar for Others */}
          {!isMe && (
            <div className="shrink-0 mb-1 z-10 w-7 h-7">
              <div className="w-full h-full rounded-full text-xs flex items-center justify-center font-bold shadow-md" style={{ background: "var(--primary)", color: "var(--background)" }}>
                {msg.username ? msg.username[0].toUpperCase() : "U"}
              </div>
            </div>
          )}

          {/* Bubble Core */}
          <div className="flex flex-col relative w-full px-1">
            <div 
              className={`p-3 rounded-2xl relative shadow-sm ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
              style={{
                  background: isMe ? "var(--primary)" : "var(--surface)",
                  color: isMe ? "var(--background)" : "var(--text-primary)",
                  border: isMe ? `1px solid var(--primary)` : "1px solid var(--border)",
              }}
            >
              {msg.media_url && (
                <img 
                  src={msg.media_url} 
                  alt="Attachment" 
                  className="w-full max-w-[200px] rounded-lg mb-2 object-cover border" 
                  style={{maxHeight: '200px', borderColor: "var(--border)"}}
                />
              )}

              {msg.content && (
                <span className="text-sm wrap-break-word whitespace-pre-wrap">
                  {msg.content}
                </span>
              )}
              
              {/* Reactions Display (Anchored to Bubble) */}
              {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`absolute -bottom-3 ${isMe ? "left-4" : "right-4"} border rounded-full px-1.5 py-0.5 shadow-sm text-xs z-20 flex bg-[var(--surface)] text-[var(--secondary)]`} style={{ borderColor: 'var(--border)' }}>
                      {msg.reactions.map((r, i) => <span key={i} className="mx-[1px]">{r.emoji}</span>)}
                  </div>
              )}
            </div>

            {/* Seen / Sent Delivery Marks (Only for own messages) */}
            {isMe && (
              <div className="overflow-hidden flex justify-end mt-1 mr-1">
                  <span className="text-[10px] font-bold" style={{ color: msg.is_seen ? "var(--info)" : "var(--text-muted)" }}>
                      {msg.is_seen ? "✓✓" : "✓"}
                  </span>
              </div>
            )}
          </div>

          {/* Inline Action Buttons */}
          <div className={`flex items-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mb-2 gap-0.5 ${isMe ? "flex-row-reverse mr-1 z-10" : "ml-1 z-10"}`}>
              {!isMe && (
                  <div className="relative">
                      <button onClick={() => setActiveReactMsg(activeReactMsg === msg.id ? null : msg.id)} className="p-1 rounded-full hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--secondary)]">
                          <Smile size={16} />
                      </button>
                      
                      {activeReactMsg === msg.id && (
                          <div className="absolute bottom-full left-0 mb-2 shadow-lg rounded-full px-2 py-1.5 flex gap-2 z-50 border bg-[var(--surface)] border-[var(--border)]">
                              {EMOJIS.map(emoji => (
                                  <span key={emoji} onClick={() => reactMessage(msg.id, emoji)} className="cursor-pointer hover:scale-125 transition-transform text-lg">{emoji}</span>
                              ))}
                          </div>
                      )}
                  </div>
              )}
              
              <div className="relative">
                  <button onClick={() => setOptionsMenu(optionsMenu === msg.id ? null : msg.id)} className="p-1 rounded-full hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--secondary)]">
                      <MoreVertical size={16} />
                  </button>
                  
                  {optionsMenu === msg.id && (
                      <div className={`absolute bottom-full ${isMe ? 'right-0' : 'left-0'} mb-2 shadow-xl rounded-xl py-1 z-50 border w-28 bg-[var(--surface)] border-[var(--border)] overflow-hidden`}>
                          <button onClick={() => copyText(msg.content)} className="w-full text-left px-3 py-2 text-xs hover:opacity-75 transition-colors flex items-center gap-2 text-[var(--text-primary)]"><Copy size={12}/> Copy</button>
                          {isMe && <button onClick={() => unsendMessage(msg.id)} className="w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 text-[var(--danger)] hover:bg-[var(--danger)] hover:bg-opacity-10"><Trash2 size={12}/> Unsend</button>}
                      </div>
                  )}
              </div>
          </div>
        </div>
      </div>
    );
  };

  if (showSettings) {
    return (
      <div className="fixed top-0 bottom-[56px] md:bottom-0 left-0 right-0 z-[60] flex items-center justify-center p-0 md:p-6" style={{ background: "rgba(13,27,42,0.95)", backdropFilter: "blur(6px)" }}>
        <div className="h-full w-full md:h-[600px] md:w-[450px] shadow-2xl flex flex-col md:rounded-2xl overflow-hidden bg-[var(--background)] border border-[var(--border)]">
          <div className="flex justify-between items-center px-4 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
            <button onClick={() => setShowSettings(false)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-75 bg-[var(--surface-alt)] text-[var(--text-primary)]">Back</button>
            <span className="font-bold text-sm text-[var(--text-primary)]">Chat Settings</span>
            <div className="w-12"></div>
          </div>
          <div className="flex-1 p-6 text-[var(--text-primary)]">
            <p className="text-sm opacity-70 mb-5">Manage your chat preferences here.</p>
            
            <div className="flex flex-col gap-3">
              <div 
                onClick={() => !confirmDeleteMe && setConfirmDeleteMe(true)}
                className="w-full py-3 px-4 rounded-xl border border-[var(--border)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)] flex flex-col justify-center cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-medium">Clear Chat For Me</span>
                </div>
                <span className="text-[10px] opacity-60 font-normal">Only hides messages from your view locally</span>
                
                {confirmDeleteMe && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        localStorage.setItem(`chat_clear_${bookId}_${user?.id}`, Date.now().toString());
                        setMessages(prev => [...prev]);
                        setConfirmDeleteMe(false);
                        setShowSettings(false);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[var(--danger)] bg-opacity-10 text-[var(--danger)] text-xs font-semibold hover:bg-opacity-20 transition-colors"
                    >
                      Confirm Clear
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteMe(false);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-semibold hover:opacity-80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div 
                onClick={() => !confirmDeleteGlobal && setConfirmDeleteGlobal(true)}
                className="w-full py-3 px-4 rounded-xl border border-red-500/30 transition-colors hover:bg-[var(--danger)] hover:bg-opacity-10 flex flex-col justify-center cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[var(--danger)] font-medium">Delete My Chats Globally</span>
                </div>
                <span className="text-[10px] opacity-60 font-normal text-[var(--danger)]">Permanently unsends all your messages</span>
                
                {confirmDeleteGlobal && (
                  <div className="mt-3 pt-3 border-t border-red-500/20 flex flex-col gap-2">
                    <p className="text-[10px] text-[var(--danger)] text-center font-medium">This cannot be undone!</p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await api.delete(`/chat/messages/${bookId}/delete/`);
                            setMessages(prev => prev.filter(m => m.sender_id !== user?.id));
                            if (socket) socket.send(JSON.stringify({ type: "delete_user_messages", user_id: user.id }));
                            setConfirmDeleteGlobal(false);
                            setShowSettings(false);
                          } catch (err) {
                            console.error("Delete failed:", err);
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-[var(--danger)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Yes, Delete All
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteGlobal(false);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-transparent border border-red-500/30 text-[var(--text-muted)] text-xs font-semibold hover:opacity-80 transition-opacity"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 bottom-[56px] md:bottom-0 left-0 right-0 z-[60] flex items-center justify-center p-0 md:p-6" style={{ background: "rgba(13,27,42,0.95)", backdropFilter: "blur(6px)" }}>
      <div className="h-full w-full md:h-[600px] md:w-[450px] shadow-2xl flex flex-col md:rounded-2xl overflow-hidden bg-[var(--background)] border md:border md:border-[var(--border)] border-0 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 shrink-0 mt-safe border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]">
          <button onClick={() => setShowSettings(true)} className="p-2 -ml-2 rounded-xl transition-colors hover:font-bold opacity-70 hover:opacity-100">
            <Settings size={20} />
          </button>
          
          <div className="flex flex-col items-center justify-center min-w-[120px]">
             <span className="font-bold text-sm">Notes Editor</span>
             <span className="text-[10px] opacity-70">
              {onlineUsersCount > 0 ? `${onlineUsersCount} online` : 'Connecting...'}
             </span>
          </div>
          
          <button onClick={onClose} className="p-2 -mr-2 rounded-xl transition-colors opacity-70 hover:opacity-100 hover:font-bold">
            <X size={20} />
          </button>
        </div>

        {/* Message View Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col bg-[var(--background)]">
            {hasMore && (
                <div className="flex justify-center mb-6">
                    <button onClick={loadMore} disabled={fetching} className="px-4 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 shadow-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] opacity-90 hover:opacity-100 focus:scale-95 active:scale-95">
                        {fetching ? '...' : <><Navigation size={12} className="rotate-180" /> Load older messages</>}
                    </button>
                </div>
            )}
            {messages.length === 0 && !fetching ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-[var(--text-primary)]">
                    <MessageSquare size={40} className="mb-3" />
                    <p className="text-sm">Start a conversation</p>
                </div>
            ) : (
                messages.filter(m => {
                    if (m.is_system) return true;
                    // if created_at is valid, check if it's strictly newer than clearTime
                    return !m.created_at || new Date(m.created_at).getTime() >= clearTime;
                }).map((msg, idx) => renderMessage(msg, idx))
            )}

            {/* Typing Indicator Bubble Rendered at bottom opposite me */}
            {typingUser && (
                <div className="flex mb-4 relative justify-start">
                  <div className="flex gap-1 max-w-[85%] items-end flex-row">
                    <div className="shrink-0 mb-1 z-10 w-7 h-7">
                      <div className="w-full h-full rounded-full text-xs flex items-center justify-center font-bold shadow-md bg-[var(--primary)] text-[var(--background)] opacity-50">
                        {typingUser[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="flex flex-col relative w-full px-1">
                      <div className="px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm bg-[var(--surface)] border border-[var(--border)] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[var(--secondary)] rounded-full animate-bounce" style={{animationDelay: "0ms"}}></span>
                        <span className="w-1.5 h-1.5 bg-[var(--secondary)] rounded-full animate-bounce" style={{animationDelay: "150ms"}}></span>
                        <span className="w-1.5 h-1.5 bg-[var(--secondary)] rounded-full animate-bounce" style={{animationDelay: "300ms"}}></span>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            <div ref={messagesEndRef} className="pb-2" />
        </div>

        {/* Input Area */}
        <div className="flex flex-col shrink-0 pb-safe border-t border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] relative z-20">
            {selectedImage && (
                <div className="px-4 pt-3 flex items-start">
                    <div className="relative border rounded-lg shadow-sm border-[var(--border)]">
                        <img src={URL.createObjectURL(selectedImage)} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
                        <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-[var(--danger)] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md">×</button>
                    </div>
                </div>
            )}

            <div className="flex items-center p-3 gap-2">
                <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
                
                <button onClick={handleUpload} className="p-2 transition-colors rounded-full hover:opacity-75 shrink-0 opacity-80" style={{ color: "var(--text-primary)" }}>
                    <Plus size={22} />
                </button>

                <div className="flex-1 min-w-0 flex items-center rounded-2xl px-4 py-2 border bg-[var(--surface-alt)] border-[var(--border)] shadow-inner">
                    <input
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            sendTyping();
                        }}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type your notes..."
                        className="w-full bg-transparent border-none outline-none text-sm placeholder:opacity-60"
                        style={{ color: "var(--text-primary)" }}
                    />
                </div>

                <button 
                    onClick={sendMessage}
                    disabled={!input.trim() && !selectedImage}
                    className="p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 disabled:opacity-40 shadow-sm"
                    style={{ 
                        background: (!input.trim() && !selectedImage) ? "var(--surface-alt)" : "var(--primary)",
                        color: (!input.trim() && !selectedImage) ? "var(--text-muted)" : "var(--background)",
                        cursor: (!input.trim() && !selectedImage) ? "not-allowed" : "pointer"
                    }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
