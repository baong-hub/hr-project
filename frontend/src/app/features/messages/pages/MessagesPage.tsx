import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Send, MessageSquare } from 'lucide-react';
import { authService } from '../../../core/services/auth.service';
import { chatSignalRService } from '../../../core/services/signalr.service';
import { messagesService, type ConversationItem, type ChatMessageItem, type ConversationDetail } from '../services/messages.service';
import { toast } from '../../../core/services/toast.service';
import styles from './MessagesPage.module.scss';

export const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvoId = searchParams.get('conversationId') ? Number(searchParams.get('conversationId')) : null;

  const user = authService.getUser();
  const currentUserId = user?.id || 0;
  const roles = (user?.roles as string[]) || [];
  const userRole = (user?.role || user?.accountType || '').toString().toUpperCase();
  const isCandidate = roles.includes('Ứng viên') || userRole === 'CANDIDATE' || userRole === 'USER';

  // State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<number | null>(initialConvoId);
  const [activeConvo, setActiveConvo] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch conversations
  const fetchConversations = async (autoSelect = false) => {
    try {
      const res = await messagesService.getConversations();
      if (res.data?.success && res.data.data) {
        const list: ConversationItem[] = res.data.data || [];
        setConversations(list);

        if (autoSelect && list.length > 0 && !selectedConvoId) {
          setSelectedConvoId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch active conversation detail
  const fetchActiveConversation = async (id: number) => {
    try {
      const res = await messagesService.getConversationById(id);
      if (res.data?.success && res.data.data) {
        const detail: ConversationDetail = res.data.data;
        setActiveConvo(detail);
        setMessages(detail.messages || []);
        setTimeout(scrollToBottom, 100);

        // Update unread in local list
        setConversations(prev =>
          prev.map(c => (c.id === id ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.error('Error fetching conversation detail:', err);
    }
  };

  useEffect(() => {
    fetchConversations(true);
    chatSignalRService.startConnection();

    return () => {
      chatSignalRService.stopConnection();
    };
  }, []);

  useEffect(() => {
    if (selectedConvoId) {
      fetchActiveConversation(selectedConvoId);
      setSearchParams({ conversationId: selectedConvoId.toString() });
      chatSignalRService.joinConversation(selectedConvoId);

      const handleIncomingMessage = (msg: any) => {
        if (msg.conversationId === selectedConvoId) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, {
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              senderName: msg.senderName,
              content: msg.content,
              sentAt: msg.sentAt,
              isRead: true,
              isMine: msg.senderId === currentUserId
            }];
          });
          scrollToBottom();
        }
      };

      chatSignalRService.registerMessageCallback(handleIncomingMessage);

      return () => {
        chatSignalRService.leaveConversation(selectedConvoId);
      };
    }
  }, [selectedConvoId, currentUserId]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvoId || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await messagesService.sendMessage({
        conversationId: selectedConvoId,
        content
      });

      if (res.data?.success && res.data.data) {
        const newMsg: ChatMessageItem = res.data.data;
        setMessages(prev => [...prev, newMsg]);
        setTimeout(scrollToBottom, 50);

        // Update sidebar last message preview
        setConversations(prev =>
          prev.map(c =>
            c.id === selectedConvoId
              ? { ...c, lastMessageContent: content, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      } else {
        toast.error('Gửi tin nhắn thất bại');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Lỗi khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const partnerName = isCandidate ? c.companyName || c.employerName : c.candidateName;
    const term = search.toLowerCase();
    return (
      partnerName?.toLowerCase().includes(term) ||
      c.jobTitle?.toLowerCase().includes(term) ||
      c.lastMessageContent?.toLowerCase().includes(term)
    );
  });

  const getPartnerInfo = (c: ConversationItem | ConversationDetail) => {
    if (isCandidate) {
      return {
        name: c.companyName || c.employerName || 'Doanh nghiệp',
        subText: c.jobTitle ? `Vị trí: ${c.jobTitle}` : 'Nhà tuyển dụng',
        avatar: c.employerAvatar,
        initial: (c.companyName || c.employerName || 'DN').charAt(0).toUpperCase()
      };
    }
    return {
      name: c.candidateName || 'Ứng viên',
      subText: c.jobTitle ? `Ứng tuyển: ${c.jobTitle}` : 'Ứng viên',
      avatar: c.candidateAvatar,
      initial: (c.candidateName || 'UV').charAt(0).toUpperCase()
    };
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className={styles.messagesContainer}>
      {/* Sidebar List */}
      <div className={styles.sidebarList}>
        <div className={styles.sidebarHeader}>
          <h2>
            <MessageSquare size={20} color="var(--color-primary, #2563eb)" />
            Tin nhắn
          </h2>
          <div className={styles.searchBox}>
            <Search size={16} color="var(--color-text-muted, #94a3b8)" />
            <input
              type="text"
              placeholder="Tìm kiếm người liên hệ, công việc..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.conversationList}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
              Đang tải danh sách hội thoại...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              {search ? 'Không tìm thấy cuộc trò chuyện phù hợp.' : 'Bạn chưa có cuộc trò chuyện nào.'}
            </div>
          ) : (
            filteredConversations.map(c => {
              const partner = getPartnerInfo(c);
              const isActive = c.id === selectedConvoId;

              return (
                <div
                  key={c.id}
                  className={`${styles.convoItem} ${isActive ? styles.active : ''}`}
                  onClick={() => setSelectedConvoId(c.id)}
                >
                  <div className={styles.avatar}>
                    {partner.avatar ? (
                      <img src={partner.avatar} alt={partner.name} className={styles.avatar} />
                    ) : (
                      partner.initial
                    )}
                  </div>
                  <div className={styles.convoInfo}>
                    <div className={styles.convoTop}>
                      <span className={styles.convoName}>{partner.name}</span>
                      <span className={styles.convoTime}>{formatTime(c.lastMessageAt)}</span>
                    </div>
                    {c.jobTitle && (
                      <div className={styles.jobBadge}>
                        {c.jobTitle}
                      </div>
                    )}
                    <div className={styles.previewRow}>
                      <p className={styles.lastMessage}>{c.lastMessageContent || 'Bắt đầu trò chuyện'}</p>
                      {c.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>{c.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        {activeConvo ? (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatParticipant}>
                <div className={styles.avatar}>
                  {getPartnerInfo(activeConvo).avatar ? (
                    <img
                      src={getPartnerInfo(activeConvo).avatar!}
                      alt={getPartnerInfo(activeConvo).name}
                      className={styles.avatar}
                    />
                  ) : (
                    getPartnerInfo(activeConvo).initial
                  )}
                </div>
                <div>
                  <h3>{getPartnerInfo(activeConvo).name}</h3>
                  <p>{getPartnerInfo(activeConvo).subText}</p>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className={styles.messagesList}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto' }}>
                  Chưa có tin nhắn nào trong cuộc trò chuyện này. Hãy gửi tin nhắn đầu tiên!
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === currentUserId || msg.isMine;
                  return (
                    <div
                      key={msg.id}
                      className={`${styles.messageRow} ${isMine ? styles.mine : styles.theirs}`}
                    >
                      {!isMine && (
                        <div className={styles.msgAvatar}>
                          {msg.senderAvatar ? (
                            <img src={msg.senderAvatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                          ) : (
                            msg.senderName?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                      )}
                      <div className={styles.bubble}>
                        {msg.content}
                        <div className={styles.msgTime}>
                          {formatTime(msg.sentAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className={styles.chatInputArea}>
              <form onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Nhập nội dung tin nhắn trao đổi..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={!inputText.trim() || sending} title="Gửi tin nhắn">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className={styles.emptyChat}>
            <MessageSquare size={64} />
            <h4>Chọn một cuộc trò chuyện để bắt đầu</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Trao đổi trực tiếp và nhanh chóng giữa Ứng viên và Doanh nghiệp tuyển dụng
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
