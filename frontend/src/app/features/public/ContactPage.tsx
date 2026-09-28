import React, { useState } from 'react';
import { SeoHead } from '../../shared/components/SeoHead';
import { COMPANY_INFO } from '../../config/company-info';
import styles from './ContactPage.module.scss';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    topic: 'SUPPORT',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const faqs = [
    {
      q: 'Doanh nghiệp đăng ký tài khoản tuyển dụng cần thủ tục gì?',
      a: 'Hệ thống hỗ trợ xác thực tài khoản qua email. Sau khi cập nhật thông tin doanh nghiệp, bộ phận hỗ trợ sẽ duyệt tài khoản trong giờ làm việc.'
    },
    {
      q: 'Ứng viên có phải trả bất kỳ khoản phí nào không?',
      a: 'Hoàn toàn không. HR Portal miễn phí cho ứng viên tìm kiếm việc làm, tạo hồ sơ và ứng tuyển.'
    },
    {
      q: 'Tôi muốn báo cáo tin tuyển dụng nghi vấn lừa đảo thì làm thế nào?',
      a: 'Bạn có thể gửi yêu cầu hỗ trợ qua biểu mẫu liên hệ này hoặc bấm nút báo cáo vi phạm trực tiếp trên trang chi tiết công việc.'
    }
  ];

  return (
    <div className={styles.contactPage}>
      <SeoHead
        title="Liên Hệ & Hỗ Trợ | HR Portal"
        description="Gửi yêu cầu hỗ trợ hoặc liên hệ tư vấn tuyển dụng với đội ngũ vận hành HR Portal."
        ogType="website"
      />

      {/* Hero */}
      <section className={styles.hero}>
        <div className="container-public">
          <span className={styles.eyebrow}>Hỗ trợ & Liên hệ</span>
          <h1 className={styles.heroTitle}>Liên Hệ Với Chúng Tôi</h1>
          <p className={styles.heroDesc}>
            Đội ngũ hỗ trợ HR Portal sẵn sàng giải đáp các thắc mắc và hỗ trợ người dùng trong quá trình sử dụng hệ thống.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.section}>
        <div className="container-public">
          <div className={styles.gridTwo}>
            {/* Direct Info & FAQs */}
            <div className={styles.contactInfoBlock}>
              <h2>Thông Tin Liên Hệ</h2>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Đơn vị quản lý</span>
                  <span className={styles.value}>{COMPANY_INFO.legalName}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Địa chỉ</span>
                  <span className={styles.value}>{COMPANY_INFO.address}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Điện thoại / Hotline</span>
                  <span className={styles.value}>{COMPANY_INFO.phone} ({COMPANY_INFO.operatingHours})</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Email hỗ trợ</span>
                  <span className={styles.value}>{COMPANY_INFO.email}</span>
                </div>
              </div>

              <div className={styles.faqSection}>
                <h3>Câu hỏi thường gặp</h3>
                {faqs.map((faq, idx) => (
                  <div key={idx} className={styles.faqItem}>
                    <div className={styles.q}>{faq.q}</div>
                    <div className={styles.a}>{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className={styles.formCard}>
              <h2>Gửi Yêu Cầu Hỗ Trợ</h2>

              {submitted ? (
                <div className={styles.successBox}>
                  Cảm ơn bạn đã gửi yêu cầu! Đội ngũ hỗ trợ sẽ liên hệ phản hồi qua email trong thời gian sớm nhất.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fullName">Họ và tên *</label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email liên hệ *</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0912345678"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="topic">Chủ đề hỗ trợ *</label>
                    <select
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    >
                      <option value="SUPPORT">Hỗ trợ kỹ thuật / Tài khoản</option>
                      <option value="SALES">Tư vấn gói tuyển dụng doanh nghiệp</option>
                      <option value="REPORT">Báo cáo vi phạm / Tin giả mạo</option>
                      <option value="PRIVACY">Yêu cầu quyền dữ liệu (Nghị định 13)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message">Nội dung chi tiết *</label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Vui lòng nêu rõ yêu cầu hoặc thắc mắc của bạn..."
                    />
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
