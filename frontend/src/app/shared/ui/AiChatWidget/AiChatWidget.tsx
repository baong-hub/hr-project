import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot } from 'lucide-react';
import { aiService } from '../../../core/services/ai.service';
import styles from './AiChatWidget.module.scss';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý AI Tuyển dụng & Nghề nghiệp 🤖✨\n\nTôi có thể hỗ trợ bạn tìm kiếm việc làm, tối ưu CV, tư vấn phỏng vấn hoặc soạn thảo tin tuyển dụng nhanh chóng. Bạn cần hỗ trợ gì hôm nay?'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isThinking]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsThinking(true);
    try {
      const res = await aiService.chat({
        message: query
      });

      if (res.data?.success && res.data.data?.reply) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: res.data.data.reply
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const fallbackMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Xin lỗi, hiện tại tôi chưa thể xử lý yêu cầu này. Vui lòng thử lại sau giây lát!'
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Có lỗi kết nối đến Trợ lý AI. Vui lòng thử lại sau.'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const quickPrompts = [
    '💡 Cách viết CV nổi bật cho vị trí Lập trình viên?',
    '🎯 Các câu hỏi phỏng vấn phổ biến và cách trả lời?',
    '✍️ Hướng dẫn cách tạo tin tuyển dụng thu hút ứng viên giỏi'
  ];

  return (
    <div className={styles.chatWidgetContainer}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={styles.floatingTrigger}
          title="Trợ lý AI Tuyển dụng"
        >
          <div className={styles.pulseRing} />
          <Sparkles size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerTitleInfo}>
              <div className={styles.aiAvatar}>
                <Sparkles size={18} />
              </div>
              <div>
                <h4>HR AI Assistant</h4>
                <p>Trợ lý thông minh trực tuyến</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={styles.closeBtn}
              title="Đóng chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className={styles.messagesArea}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${msg.sender === 'user' ? styles.user : styles.bot}`}
              >
                {msg.sender === 'bot' && (
                  <div className={styles.botIcon}>
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.user : styles.bot}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Quick suggestions on welcome */}
            {messages.length === 1 && (
              <div className={styles.quickPrompts}>
                <span>Gợi ý câu hỏi nhanh:</span>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Thinking indicator */}
            {isThinking && (
              <div className={`${styles.messageRow} ${styles.bot}`}>
                <div className={styles.botIcon}>
                  <Bot size={16} />
                </div>
                <div className={styles.typingDots}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className={styles.inputContainer}>
            <input
              type="text"
              placeholder="Nhập câu hỏi cho trợ lý AI..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isThinking || !inputMessage.trim()}
              className={styles.sendBtn}
              title="Gửi"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
