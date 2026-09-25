import React from 'react';
import { ShieldCheck, FileText } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

      <main style={{ flex: 1, maxWidth: '900px', margin: '40px auto', padding: '0 20px', width: '100%' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '10px', color: '#2563eb' }}>
              <FileText size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Điều Khoản Dịch Vụ</h1>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Cập nhật lần cuối: 21/09/2026</span>
            </div>
          </div>

          <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '24px' }}>
            Chào mừng bạn đến với <strong>HR Recruitment Portal</strong>. Khi truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ dịch vụ nào trên nền tảng của chúng tôi, bạn đồng ý chịu sự ràng buộc bởi các điều khoản và điều kiện được nêu dưới đây.
          </p>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              1. Quyền và Nghĩa Vụ của Ứng Viên (Người Tìm Việc)
            </h2>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: 1.8, fontSize: '0.9rem' }}>
              <li>Ứng viên cam kết cung cấp thông tin trung thực, chính xác về danh tính, học vấn, kinh nghiệm làm việc và kỹ năng trong hồ sơ ứng tuyển (CV).</li>
              <li>Ứng viên tự chịu trách nhiệm bảo mật mật khẩu tài khoản và không chia sẻ thông tin đăng nhập cho bên thứ ba.</li>
              <li>Nghiêm cấm hành vi sử dụng hồ sơ giả mạo hoặc spam đơn ứng tuyển hàng loạt làm gián đoạn hệ thống.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              2. Quyền và Nghĩa Vụ của Nhà Tuyển Dụng (Doanh Nghiệp)
            </h2>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: 1.8, fontSize: '0.9rem' }}>
              <li>Nhà tuyển dụng cam kết mọi tin tuyển dụng đăng tải đều phản ánh nhu cầu tuyển dụng có thật, minh bạch về mức lương, địa điểm và mô tả công việc.</li>
              <li><strong>Nghiêm cấm tuyệt đối:</strong> Thu bất kỳ khoản phí đặt cọc, phí hồ sơ hoặc tiền giữ chỗ nào từ ứng viên dưới mọi hình thức.</li>
              <li>Nhà tuyển dụng có trách nhiệm bảo mật thông tin cá nhân và CV của ứng viên, chỉ được sử dụng cho mục đích tuyển dụng vào vị trí đã đăng tin.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              3. Phí Dịch Vụ và Thanh Toán
            </h2>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: 1.8, fontSize: '0.9rem' }}>
              <li>Ứng viên được sử dụng toàn bộ tính năng tìm việc, nộp hồ sơ, thi trắc nghiệm AI và nhắn tin hoàn toàn <strong>miễn phí</strong>.</li>
              <li>Doanh nghiệp sử dụng các gói dịch vụ nâng cao (Pro, Business, Enterprise) tuân theo bảng giá công khai được niêm yết tại thời điểm thanh toán.</li>
              <li>Giao dịch thanh toán được xử lý qua cổng thanh toán bảo mật chuẩn VietQR / NAPAS / Thẻ ngân hàng nội địa và quốc tế.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              4. Xử Lý Vi Phạm và Tạm Khóa Tài Khoản
            </h2>
            <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.9rem' }}>
              HR Portal bảo lưu quyền tạm khóa, hủy bỏ hoặc xóa vĩnh viễn các tài khoản vi phạm chính sách cộng đồng, phát tán tin tuyển dụng lừa đảo hoặc vi phạm pháp luật hiện hành mà không cần báo trước.
            </p>
          </section>

          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#15803d'
          }}>
            <ShieldCheck size={24} />
            <span style={{ fontSize: '0.9rem' }}>Mọi tranh chấp phát sinh sẽ được giải quyết trước hết thông qua thương lượng hòa giải dựa trên pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.</span>
          </div>
        </div>
      </main>

    </div>
  );
};
