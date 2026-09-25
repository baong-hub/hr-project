import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Minimize2 } from 'lucide-react';
import { aiService } from '../../../core/services/ai.service';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export const AiCareerAdvisorWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ Lý Tư Vấn Nghề Nghiệp AI. Bạn cần tư vấn về định hướng công việc, cải thiện CV hay thương lượng mức lương?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = authService.isAuthenticated();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isAuthenticated) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      const res = await aiService.chat({ message: textToSend });
      if (res.data?.success && res.data?.data) {
        const replyText = (res.data.data as any).reply || 'Tôi đã tiếp nhận thông tin của bạn.';
        const aiMsg: Message = {
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        toast.error('Lỗi phản hồi từ Trợ lý AI.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối Trợ lý AI.');
    } finally {
      setLoading(false);
    }
  };

  const quickChips = [
    '💡 Gợi ý viết CV nổi bật',
    '📊 Mức lương thị trường vị trí IT',
    '🚀 Kỹ năng IT cần bổ sung năm 2026',
    '💬 Mẹo đàm phán lương hiệu quả'
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          title="Mở Trợ Lý Tư Vấn Nghề Nghiệp AI"
        >
          <Bot size={28} />
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#10b981',
            border: '2px solid #ffffff'
          }} />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          height: '540px',
          maxHeight: 'calc(100vh - 48px)',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.22)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            padding: '16px 20px',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>AI Career Advisor</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.73rem', opacity: 0.9 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                  Đang trực tuyến • Powered by Gemini AI
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff' }}
            >
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#f8fafc'
          }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: msg.sender === 'user' ? '#2563eb' : '#7c3aed',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  flexShrink: 0
                }}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                <div style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: msg.sender === 'user' ? '#2563eb' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  fontSize: '0.84rem',
                  lineHeight: '1.45',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                  <div style={{
                    fontSize: '0.65rem',
                    opacity: 0.7,
                    marginTop: '4px',
                    textAlign: msg.sender === 'user' ? 'right' : 'left'
                  }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} />
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ animation: 'spin 1s linear infinite', color: '#7c3aed' }} /> AI đang suy nghĩ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div style={{ padding: '8px 12px', background: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#4f46e5',
                  background: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  borderRadius: '12px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Nhập câu hỏi tư vấn..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: !inputMessage.trim() || loading ? '#cbd5e1' : '#4f46e5',
                color: '#ffffff',
                border: 'none',
                cursor: !inputMessage.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
