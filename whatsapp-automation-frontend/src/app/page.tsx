'use client';

import { 
  Search, 
  Filter, 
  MoreVertical, 
  Send, 
  User,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import styles from './page.module.css';
import { useState, useEffect, useRef } from 'react';
import { API } from '@/services/api';
import { socketService } from '@/services/socket';

export default function Inbox() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const data = await API.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedChat) {
        setSelectedChat(data[0].phone);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (phone: string) => {
    try {
      const data = await API.getChatHistory('golden-cafe', phone);
      // Backend returns latest first, we want chronological for display
      setMessages(data.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  // --- REAL-TIME LISTENERS ---
  useEffect(() => {
    const socket = socketService.connect();
    
    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('subscribe:tenant', 'golden-cafe');
    });

    socket.on('disconnect', () => setSocketConnected(false));

    const handleNewMessage = (msg: any) => {
      // 1. Update messages list if it's the current chat
      if (selectedChat === msg.phone) {
        setMessages(prev => {
          // Prevent duplicates (optimistic update vs real socket)
          const exists = prev.some(m => m.content === msg.content && Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 2000);
          return exists ? prev : [...prev, msg];
        });
      }

      // 2. Update conversations list (move to top, update last message)
      setConversations(prev => {
        const index = prev.findIndex(c => c.phone === msg.phone);
        const updatedChat = index !== -1 
          ? { ...prev[index], lastMessage: msg.content, timestamp: msg.createdAt, totalMessages: (prev[index].totalMessages || 0) + 1 }
          : { phone: msg.phone, lastMessage: msg.content, timestamp: msg.createdAt, totalMessages: 1 };
          
        const otherChats = prev.filter(c => c.phone !== msg.phone);
        return [updatedChat, ...otherChats];
      });
    };

    socket.on('message:incoming', handleNewMessage);
    socket.on('message:outgoing', handleNewMessage);

    return () => {
      socket.off('message:incoming');
      socket.off('message:outgoing');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [selectedChat]);

  const handleSend = async () => {
    if (!selectedChat || !inputText.trim() || sending) return;
    
    const messageContent = inputText;
    setInputText(''); // Clear input immediately for better UX
    
    // --- OPTIMISTIC UPDATE ---
    // Hum message ko UI mein turant add kar rahe hain (temporary ID ke saath)
    const optimisticMessage = {
      content: messageContent,
      direction: 'outgoing',
      createdAt: new Date().toISOString(),
      isOptimistic: true 
    };
    setMessages(prev => [...prev, optimisticMessage]);
    
    setSending(true);
    try {
      await API.sendMessage(selectedChat, messageContent);
      
      // Wait a bit for DB to catch up before final refresh
      setTimeout(async () => {
        await fetchHistory(selectedChat);
      }, 800);
      
    } catch (err) {
      // If failed, remove the optimistic message and alert
      setMessages(prev => prev.filter(m => m !== optimisticMessage));
      alert("Failed to send message. Please check connection.");
      setInputText(messageContent); // Restore text
    } finally {
      setSending(false);
    }
  };


  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchHistory(selectedChat);
    }
  }, [selectedChat]);

  const activeChatData = conversations.find(c => c.phone === selectedChat);

  return (
    <div className={styles.inboxContainer}>
      {/* Column 1: Chat List */}
      <div className={styles.chatListColumn}>
        <header className={styles.columnHeader}>
          <div className={styles.headerInfo}>
            <h1>Shared Inbox</h1>
            <button onClick={fetchConversations} className={styles.iconBtn}>
                <RefreshCw size={16} />
            </button>
          </div>
          <div className={styles.searchBar}>
            <Search size={16} color="var(--text-muted)" />
            <input type="text" placeholder="Search conversations..." />
          </div>
          <div className={styles.filters}>
            <button className={styles.filterBtn}><Filter size={14} /> All</button>
            <button className={styles.filterBtn}>Open</button>
          </div>
        </header>

        <main className={styles.chatList}>
          {loading ? (
            <div className={styles.loading}>Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className={styles.emptyState}>No active conversations found</div>
          ) : (
            conversations.map(chat => (
              <div 
                key={chat.phone} 
                className={`${styles.chatCard} ${selectedChat === chat.phone ? styles.activeCard : ''}`}
                onClick={() => setSelectedChat(chat.phone)}
              >
                <div className={styles.avatarContainer}>
                  <div className={styles.avatar}>{chat.phone.slice(-2)}</div>
                  <div className={`${styles.statusIndicator} ${styles.online}`}></div>
                </div>
                <div className={styles.chatInfo}>
                  <div className={styles.chatHeader}>
                    <span className={styles.chatName}>+{chat.phone}</span>
                    <span className={styles.chatTime}>
                        {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={styles.chatFooter}>
                    <p className={styles.lastMsg}>{chat.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* Column 2: Chat Window */}
      <div className={styles.chatWindowColumn}>
        {selectedChat ? (
          <>
            <header className={styles.chatWindowHeader}>
              <div className={styles.selectedUserInfo}>
                <div className={styles.avatarSmall}>{selectedChat.slice(-2)}</div>
                <div>
                  <h3>+{selectedChat}</h3>
                  <p className={`${styles.onlineStatus} ${socketConnected ? styles.live : ''}`}>
                    {socketConnected ? '● Live' : 'Offline'}
                  </p>
                </div>

              </div>
              <div className={styles.actions}>
                <button className={styles.iconBtn}><Search size={20} /></button>
                <button className={styles.iconBtn}><MoreVertical size={20} /></button>
              </div>
            </header>

            <main className={styles.messagesContainer}>
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.direction === 'incoming' ? styles.messageRow : styles.messageRowRight}>
                  <div className={msg.direction === 'incoming' ? styles.messageReceived : styles.messageSent}>
                    {msg.content}
                    <span className={styles.messageTime}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </main>


            <footer className={styles.messageInputArea}>
              <div className={styles.inputWrapper}>
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  className={styles.sendBtn} 
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? <RefreshCw size={18} className={styles.spin} /> : <Send size={18} />}
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className={styles.noSelection}>Select a conversation to start chatting</div>
        )}
      </div>

      {/* Column 3: Customer Sidebar */}
      <div className={styles.customerSidebarColumn}>
        <header className={styles.sidebarHeader}>
          <h2>Customer Context</h2>
        </header>
        
        <div className={styles.sidebarContent}>
          {selectedChat ? (
            <>
              <div className={styles.customerProfile}>
                <div className={styles.avatarLarge}>{selectedChat.slice(-2)}</div>
                <h3>+{selectedChat}</h3>
                <p className={styles.status}>Active User</p>
              </div>

              <div className={styles.divider}></div>

              <section className={styles.activeOrder}>
                <div className={styles.sectionTitle}>
                  <Package size={16} />
                  <span>SESSION INFO</span>
                </div>
                <div className={styles.orderCard}>
                  <div className={styles.orderItem}>
                    <span className={styles.itemName}>Total Interactions</span>
                    <span className={styles.itemPrice}>{activeChatData?.totalMessages}</span>
                  </div>
                  <div className={styles.orderStatus}>
                    <Clock size={14} className={styles.statusIcon} />
                    <span>User is active</span>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className={styles.noInfo}>No context available</div>
          )}
        </div>
      </div>
    </div>
  );
}

