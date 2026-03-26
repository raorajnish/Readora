import { useState, useEffect, useRef } from "react";
import { MessageSquare, Settings, X, Plus, Send, MoreVertical, Smile, Navigation, Copy, Trash2, Reply } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Toast from "./Toast";

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
  const [toast, setToast] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  
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
    if ((!input.trim() && !selectedImage) || isSending) return;
    setIsSending(true);

    const doSend = (finalMediaUrl) => {
        if (socket && socket.readyState === WebSocket.OPEN && user) {
          socket.send(JSON.stringify({
            type: "message",
            sender_id: user.id,
            content: input.trim(),
            media_url: finalMediaUrl,
            reply_to: replyingTo?.id
          }));
        }
         setInput("");
        setSelectedImage(null);
        setReplyingTo(null);
        setIsSending(false);
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
      setToast({ message: "Text copied to clipboard", type: "success" });
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
        id={`msg-${msg.id}`}
        key={msg.id || index}
        className={`flex mb-4 relative ${isMe ? "justify-end" : "justify-start"} group`}
      >
        <div className={`flex gap-2.5 max-w-[85%] items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          
          {/* Avatar for Others */}
          {!isMe && (
            <div className="shrink-0 mb-1 z-10 w-7 h-7">
              <div className="w-full h-full rounded-full text-xs flex items-center justify-center font-bold shadow-md" style={{ background: "var(--primary)", color: "var(--text-muted)" }}>
                {msg.username ? msg.username[0].toUpperCase() : "U"}
              </div>
            </div>
          )}

          {/* Bubble Core */}
          <div className="flex flex-col relative w-full px-1">
            <div 
              className={`p-2.5 rounded-2xl relative shadow-sm ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
              style={{
                  background: isMe ? "var(--primary)" : "var(--surface)",
                  color: isMe ? "var(--text-muted)" : "var(--text-primary)",
                  border: isMe ? `1px solid var(--primary)` : "1px solid var(--border)",
              }}
            >
              {msg.reply_content && (
                  <div className={`mb-2 p-2 rounded-lg border-l-4 text-xs bg-black/5 flex flex-col gap-0.5 border-(--secondary) opacity-80 cursor-pointer hover:bg-black/10 transition-colors`} onClick={() => {
                        const target = document.getElementById(`msg-${msg.reply_to}`);
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}>
                      <span className="font-bold text-(--secondary)">{msg.reply_username || "Unknown"}</span>
                      <span className="truncate max-w-full text-(--text-muted)">{msg.reply_content}</span>
                  </div>
              )}
              {msg.media_url && (
                <img 
                  src={msg.media_url} 
                  alt="Attachment" 
                  onClick={() => setFullscreenImage(msg.media_url)}
                  className="w-full max-w-[200px] rounded-lg mb-1 object-cover border cursor-pointer hover:opacity-90 transition-opacity" 
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
                  <div className={`absolute -bottom-3 ${isMe ? "left-4" : "right-4"} rounded-full px-1.5 py-0.5 shadow-sm text-xs z-10 flex bg-(--surface) text-(--secondary) border border-(--border)`}>
                      {msg.reactions.map((r, i) => <span key={i} className="mx-px">{r.emoji}</span>)}
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
          <div className={`flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mb-2 gap-1 ${isMe ? "flex-row-reverse mr-1 z-10" : "ml-1 z-10"}`}>
              {!isMe && (
                  <>
                      <div className="relative">
                          <button onClick={() => setActiveReactMsg(activeReactMsg === msg.id ? null : msg.id)} className="p-1 rounded-full hover:bg-(--surface) transition-colors text-(--text-muted) hover:text-(--secondary)">
                              <Smile size={16} />
                          </button>
                          
                          {activeReactMsg === msg.id && (
                              <div className="absolute bottom-full -left-24 mb-2 shadow-lg rounded-full px-2 py-1.5 flex gap-2 z-50 bg-(--surface) border-(--border)">
                                  {EMOJIS.map(emoji => (
                                      <span key={emoji} onClick={() => reactMessage(msg.id, emoji)} className="cursor-pointer hover:scale-125 transition-transform text-lg">{emoji}</span>
                                  ))}
                              </div>
                          )}
                      </div>

                      <button onClick={() => setReplyingTo({ id: msg.id, content: msg.content, username: msg.username })} className="p-1 rounded-full hover:bg-(--surface) transition-colors text-(--text-muted) hover:text-(--secondary)">
                          <Reply size={16} />
                      </button>
                  </>
              )}
              
              <div className="relative">
                  <button onClick={() => setOptionsMenu(optionsMenu === msg.id ? null : msg.id)} className="p-1 rounded-full hover:bg-(--surface) transition-colors text-(--text-muted) hover:text-(--secondary)">
                      <MoreVertical size={16} />
                  </button>
                  
                  {optionsMenu === msg.id && (
                      <div className={`absolute bottom-full ${isMe ? '-right-12' : 'left-0'} mb-1 shadow-xl rounded-xl py-1 z-100 w-28 bg-(--surface) border-(--border) overflow-hidden`}>
                          <button onClick={() => copyText(msg.content)} className="w-full text-left px-3 py-2 text-xs hover:opacity-75 transition-colors flex items-center gap-2 text-(--text-primary)"><Copy size={12}/> Copy</button>
                          {isMe && <button onClick={() => unsendMessage(msg.id)} className="w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 text-(--danger) hover:bg-(--danger) hover:bg-opacity-10"><Trash2 size={12}/> Unsend</button>}
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
      <div className="fixed top-0 bottom-[56px] md:bottom-0 left-0 right-0 z-60 flex items-center justify-center p-0 md:p-6" style={{ background: "rgba(13,27,42,0.95)", backdropFilter: "blur(6px)" }}>
        <div className="h-full w-full md:h-[600px] md:w-[450px] shadow-2xl flex flex-col md:rounded-2xl overflow-hidden bg-(--background) border border-(--border)">
          <div className="flex justify-between items-center px-4 py-4 border-b border-(--border) bg-(--surface)">
            <button onClick={() => setShowSettings(false)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-75 bg-(--surface-alt) text-(--text-primary)">Back</button>
            <span className="font-bold text-sm text-(--text-primary)">Annotation Settings</span>
            <div className="w-12"></div>
          </div>
          <div className="flex-1 p-6 text-(--text-primary)">
            <p className="text-sm opacity-70 mb-5">Manage your annotation preferences here.</p>
            
            <div className="flex flex-col gap-3">
              <div 
                onClick={() => !confirmDeleteMe && setConfirmDeleteMe(true)}
                className="w-full py-3 px-4 rounded-xl border border-(--border) text-(--text-primary) transition-colors hover:bg-(--surface-alt) flex flex-col justify-center cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-medium">Clear Annotations For Me</span>
                </div>
                <span className="text-[10px] opacity-60 font-normal">Only hides annotations from your view locally</span>
                
                {confirmDeleteMe && (
                  <div className="mt-3 pt-3 border-t border-(--border) flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        localStorage.setItem(`chat_clear_${bookId}_${user?.id}`, Date.now().toString());
                        setMessages(prev => [...prev]);
                        setConfirmDeleteMe(false);
                        setShowSettings(false);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-(--danger) text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      Confirm Clear
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteMe(false);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-(--surface) border border-(--border) text-(--text-muted) text-xs font-semibold hover:opacity-80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div 
                onClick={() => !confirmDeleteGlobal && setConfirmDeleteGlobal(true)}
                className="w-full py-3 px-4 rounded-xl border border-red-500/30 transition-colors hover:bg-(--surface-alt) hover:bg-opacity-10 flex flex-col justify-center cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-(--danger) font-medium">Delete My Annotations In This Room</span>
                </div>
                <span className="text-[10px] opacity-60 font-normal text-(--danger)">Permanently deletes all your annotations in this room</span>
                
                {confirmDeleteGlobal && (
                  <div className="mt-3 pt-3 border-t border-red-500/20 flex flex-col gap-2">
                    <p className="text-[10px] text-(--danger) text-center font-medium">This cannot be undone!</p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (isDeleting) return;
                          try {
                            setIsDeleting(true);
                            await api.delete(`/chat/messages/${bookId}/delete/`);
                            setMessages(prev => prev.filter(m => m.sender_id !== user?.id));
                            if (socket) socket.send(JSON.stringify({ type: "delete_user_messages", user_id: user.id }));
                            setConfirmDeleteGlobal(false);
                            setToast({ message: "Annotations deleted successfully", type: "success" });
                            setShowSettings(false);
                          } catch (err) {
                            console.error("Delete failed:", err);
                            setToast({ message: "Failed to delete annotations", type: "error" });
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                        disabled={isDeleting}
                        className="flex-1 py-1.5 rounded-lg bg-(--danger) text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Yes, Delete All"
                        )}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteGlobal(false);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-transparent border border-red-500/30 text-(--text-muted) text-xs font-semibold hover:opacity-80 transition-opacity"
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
    <div className="fixed top-0 bottom-[56px] md:bottom-0 left-0 right-0 z-60 flex items-center justify-center p-0 md:p-6" style={{ background: "rgba(13,27,42,0.95)", backdropFilter: "blur(6px)" }}>
      <div className="h-full w-full md:h-[600px] md:w-[450px] shadow-2xl flex flex-col md:rounded-2xl overflow-hidden bg-(--background) border md:border md:border-(--border) border-0 relative ">
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 shrink-0 mt-safe border-b border-(--border) bg-(--surface) text-(--text-primary)">
          <button onClick={() => setShowSettings(true)} className="p-2 -ml-2 rounded-xl transition-colors hover:font-bold opacity-70 hover:opacity-100">
            <Settings size={20} />
          </button>
          
          <div className="flex flex-col items-center justify-center min-w-[120px]">
             <span className="font-bold text-sm">Annotations</span>
             <span className="text-[10px] opacity-70">
              {onlineUsersCount > 0 ? `${onlineUsersCount} online` : 'Connecting...'}
             </span>
          </div>
          
          <button onClick={onClose} className="p-2 -mr-2 rounded-xl transition-colors opacity-70 hover:opacity-100 hover:font-bold">
            <X size={20} />
          </button>
        </div>

        {/* Message View Area */}
        <div className="flex-1 overflow-y-auto p-4 pt-12 custom-scrollbar flex flex-col bg-(--background)">
            {hasMore && (
                <div className="flex justify-center mb-6">
                    <button onClick={loadMore} disabled={fetching} className="px-4 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 shadow-sm font-medium bg-(--surface) border border-(--border) text-(--text-primary) opacity-90 hover:opacity-100 focus:scale-95 active:scale-95">
                        {fetching ? '...' : <><Navigation size={12} className="rotate-180" /> Load older messages</>}
                    </button>
                </div>
            )}
            {messages.length === 0 && !fetching ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-(--text-primary)">
                    <MessageSquare size={40} className="mb-3" />
                    <p className="text-sm">Start writing annotations</p>
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
                  <div className="flex gap-2.5 max-w-[85%] items-end flex-row">
                    <div className="shrink-0 mb-1 z-10 w-7 h-7">
                      <div className="w-full h-full rounded-full text-xs flex items-center justify-center font-bold shadow-md bg-(--primary) text-(--background) opacity-50">
                        {typingUser[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="flex flex-col relative w-full px-1">
                      <div className="px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm bg-(--surface) border border-(--border) flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-(--secondary) rounded-full animate-bounce" style={{animationDelay: "0ms"}}></span>
                        <span className="w-1.5 h-1.5 bg-(--secondary) rounded-full animate-bounce" style={{animationDelay: "150ms"}}></span>
                        <span className="w-1.5 h-1.5 bg-(--secondary) rounded-full animate-bounce" style={{animationDelay: "300ms"}}></span>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            <div ref={messagesEndRef} className="pb-2" />
        </div>

           <div className="flex flex-col shrink-0 pb-safe border-t border-(--border) bg-(--surface) text-(--text-primary) relative z-20">
            {selectedImage && (
                <div className="px-4 pt-3 flex items-start">
                    <div className="relative border rounded-lg shadow-sm border-[var(--border)]">
                        <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="w-16 h-16 object-cover rounded-md" />
                        <button 
                            disabled={isSending}
                            onClick={() => {
                                setSelectedImage(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 disabled:opacity-50"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}

            {replyingTo && (
                <div className="px-4 py-2 bg-(--surface-alt) border-t border-(--border) flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-col border-l-2 border-(--secondary) pl-3 py-1 min-w-0">
                        <span className="text-[10px] font-bold text-(--secondary)">Replying to {replyingTo.username}</span>
                        <span className="text-xs text-(--text-primary) truncate opacity-80">{replyingTo.content || "Image"}</span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-black/5 rounded-full transition-colors text-(--text-muted)">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="flex items-center p-3 gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <button 
                  disabled={isSending}
                  onClick={handleUpload} 
                  className="p-2 rounded-xl transition-all hover:bg-(--surface-alt) text-(--text-muted) hover:text-(--secondary) disabled:opacity-50"
                >
                    <Plus size={22} />
                </button>

                <div className="flex-1 min-w-0 flex items-center rounded-2xl px-4 py-2 border bg-(--surface-alt) border-(--border) shadow-inner">
                    <input
                        disabled={isSending}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            sendTyping();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder={isSending ? "Uploading image..." : "Write a message..."}
                        className="w-full bg-transparent text-sm focus:outline-none py-1"
                    />
                </div>

                <button 
                    disabled={(!input.trim() && !selectedImage) || isSending}
                    onClick={sendMessage}
                    className="p-2.5 rounded-xl transition-all shadow-md active:scale-90 flex items-center justify-center disabled:opacity-50"
                    style={{ background: "var(--primary)", color: "var(--background)" }}
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </div>
        </div>
      </div>
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-120 flex flex-col items-center justify-center bg-black/90 p-4 md:p-10 animate-in fade-in duration-200"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="flex-1 w-full flex items-center justify-center p-4">
            <img 
              src={fullscreenImage} 
              alt="Fullscreen Preview" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <button 
            onClick={() => setFullscreenImage(null)}
            className="mt-4 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all backdrop-blur-md flex items-center gap-2 border border-white/20"
          >
            <X size={18} />
            Close
          </button>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default ChatSection;
