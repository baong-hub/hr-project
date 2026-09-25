import React, { useState } from 'react';
import { 
  Mail, Phone, MapPin, Send, CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { SeoHead } from '../../shared/components/SeoHead';

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
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  const faqs = [
    {
      q: 'Doanh nghiệp đăng ký bao lâu thì được phê duyệt tài khoản?',
      a: 'Hệ thống tự động xác thực email ngay lập tức. Sau khi cập nhật hồ sơ doanh nghiệp và giấy phép kinh doanh, đội ngũ thẩm định sẽ duyệt trong vòng 2 - 4 giờ làm việc.'
    },
    {
      q: 'Ứng viên có phải trả bất kỳ khoản phí nào khi tìm việc không?',
      a: 'Hoàn toàn không. HR Portal cam kết miễn phí 100% cho ứng viên trong việc tìm kiếm việc làm, tạo CV trực tuyến và ứng tuyển vào các doanh nghiệp.'
    },
    {
      q: 'Tôi muốn báo cáo tin tuyển dụng có dấu hiệu lừa đảo thì làm thế nào?',
      a: 'Bạn có thể nhấn trực tiếp vào nút "Báo cáo vi phạm" tại mỗi trang chi tiết công việc, hoặc gửi email kèm bằng chứng tới bộ phận kiểm duyệt: report@hrportal.vn.'
    },
    {
      q: 'HR Portal hỗ trợ những hình thức thanh toán nào cho gói dịch vụ?',
      a: 'Chúng tôi hỗ trợ thanh toán tự động qua cổng VietQR (quét mã chuyển khoản ngân hàng 24/7), ví điện tử MoMo, thẻ tín dụng/ghi nợ quốc tế và chuyển khoản theo hợp đồng doanh nghiệp.'
    }
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <SeoHead
        title="Liên Hệ & Hỗ Trợ Khách Hàng | HR Portal"
        description="Liên hệ với đội ngũ hỗ trợ HR Portal: Tư vấn giải pháp tuyển dụng doanh nghiệp, báo cáo kỹ thuật và hỗ trợ ứng viên 24/7."
        ogType="website"
      />

      {/* Header */}
      <section style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f766e 100%)',
        color: '#ffffff',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, marginBottom: '16px' }}>
            Liên Hệ Với Chúng Tôi
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#ccfbf1', lineHeight: 1.6 }}>
            Đội ngũ chuyên viên HR Portal luôn sẵn sàng lắng nghe, giải đáp thắc mắc và đồng hành cùng quý khách hàng 24/7.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: '60px 20px', maxWidth: '1140px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          {/* Contact Info Cards */}
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '24px' }}>
              Thông Tin Trực Tiếp
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                display: 'flex',
                gap: '16px',
                padding: '20px',
                borderRadius: '14px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={22} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>Hotline Tư Vấn</h3>
                  <p style={{ color: '#2563eb', fontWeight: 700, fontSize: '1.1rem' }}>1900 6868</p>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>(08:00 - 20:00 từ Thứ Hai đến Chủ Nhật)</p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '16px',
                padding: '20px',
                borderRadius: '14px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={22} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>Hòm Thư Điện Tử</h3>
                  <p style={{ color: '#0f172a', fontSize: '0.925rem' }}>Hỗ trợ chung: <strong>support@hrportal.vn</strong></p>
                  <p style={{ color: '#0f172a', fontSize: '0.925rem' }}>Hợp tác doanh nghiệp: <strong>sales@hrportal.vn</strong></p>
                  <p style={{ color: '#0f172a', fontSize: '0.925rem' }}>Bảo mật & Pháp lý: <strong>dpo@hrportal.vn</strong></p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '16px',
                padding: '20px',
                borderRadius: '14px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={22} color="#ea580c" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>Văn Phòng Làm Việc</h3>
                  <p style={{ color: '#334155', fontSize: '0.9rem', marginBottom: '6px' }}>
                    <strong>Trụ sở Hà Nội:</strong> Tầng 18, Tòa nhà Capital Tower, 109 Trần Hưng Đạo, Hoàn Kiếm, TP. Hà Nội.
                  </p>
                  <p style={{ color: '#334155', fontSize: '0.9rem' }}>
                    <strong>Chi nhánh TP. HCM:</strong> Tầng 25, Bitexco Financial Tower, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Gửi Tin Nhắn Cho Chúng Tôi
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
              Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại trong vòng 30 phút.
            </p>

            {submitted ? (
              <div style={{
                padding: '32px 20px',
                textAlign: 'center',
                backgroundColor: '#ecfdf5',
                borderRadius: '14px',
                border: '1px solid #a7f3d0'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>
                  Gửi Yêu Cầu Thành Công!
                </h3>
                <p style={{ color: '#047857', fontSize: '0.925rem', marginBottom: '20px' }}>
                  Cảm ơn bạn đã liên hệ. Chuyên viên tư vấn của HR Portal sẽ phản hồi bạn qua email hoặc số điện thoại trong thời gian sớm nhất.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ fullName: '', email: '', phone: '', topic: 'SUPPORT', message: '' });
                  }}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      placeholder="0912345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Chủ đề cần hỗ trợ
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="SUPPORT">Hỗ trợ kỹ thuật & tài khoản</option>
                    <option value="SALES">Tư vấn gói dịch vụ & Báo giá doanh nghiệp</option>
                    <option value="PAYMENT">Vấn đề thanh toán & Hóa đơn VAT</option>
                    <option value="COMPLIANCE">Yêu cầu bảo mật dữ liệu (Nghị định 13)</option>
                    <option value="OTHER">Chủ đề khác</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Nội dung tin nhắn <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Mô tả chi tiết câu hỏi hoặc yêu cầu của bạn..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#0f766e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                >
                  <Send size={18} /> {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ backgroundColor: '#ffffff', padding: '60px 20px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>
              Câu Hỏi Thường Gặp
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px' }}>
              Giải đáp nhanh các thắc mắc phổ biến về quy trình và dịch vụ của chúng tôi
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={18} color="#0f766e" /> {faq.q}
                </h3>
                <p style={{ color: '#475569', fontSize: '0.925rem', lineHeight: 1.6, paddingLeft: '26px' }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
