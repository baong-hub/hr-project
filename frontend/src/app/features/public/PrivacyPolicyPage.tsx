import React from 'react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      <PublicNavbar />

      <main style={{ flex: 1, maxWidth: '900px', margin: '40px auto', padding: '0 20px', width: '100%' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '10px', color: '#16a34a' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Chính Sách Bảo Mật & Bảo Vệ Dữ Liệu Cá Nhân</h1>
              <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>Tuân thủ Nghị định số 13/2023/NĐ-CP của Chính phủ Việt Nam</span>
            </div>
          </div>

          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '28px',
            color: '#1e40af',
            fontSize: '0.9rem',
            lineHeight: 1.6
          }}>
            <p style={{ margin: 0 }}>
              <strong>Cam kết pháp lý:</strong> HR Recruitment Portal cam kết bảo vệ tuyệt đối quyền riêng tư và dữ liệu cá nhân của mọi Ứng viên và Đại diện Doanh nghiệp theo đúng các quy định tại Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân (có hiệu lực từ ngày 01/07/2023).
            </p>
          </div>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              1. Loại Dữ Liệu Cá Nhân Thu Thập
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Khi người dùng đăng ký và sử dụng dịch vụ, chúng tôi thu thập các thông tin sau:
            </p>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: 1.8, fontSize: '0.9rem' }}>
              <li><strong>Dữ liệu định danh:</strong> Họ và tên, giới tính, ngày tháng năm sinh, ảnh chân dung (Avatar).</li>
              <li><strong>Dữ liệu liên lạc:</strong> Địa chỉ email, số điện thoại di động, địa chỉ cư trú/làm việc.</li>
              <li><strong>Dữ liệu hồ sơ nghề nghiệp:</strong> Lịch sử học vấn, bằng cấp, chứng chỉ chuyên môn, lịch sử kinh nghiệm làm việc, kỹ năng, mức lương mong muốn và tệp đính kèm CV (PDF).</li>
              <li><strong>Dữ liệu kỹ thuật & Nhật ký:</strong> Địa chỉ IP, thời điểm đăng nhập, loại trình duyệt (nhằm phát hiện truy cập bất thường và bảo mật tài khoản).</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              2. Mục Đích Xử Lý Dữ Liệu
            </h2>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: 1.8, fontSize: '0.9rem' }}>
              <li>Tạo lập tài khoản người dùng và xác thực danh tính qua email/Google.</li>
              <li>Chuyển tiếp hồ sơ ứng tuyển của bạn tới Nhà tuyển dụng mà bạn đã chủ động nộp đơn.</li>
              <li>Sử dụng trí tuệ nhân tạo (AI Matching) gợi ý việc làm phù hợp dựa trên kỹ năng của bạn.</li>
              <li>Gửi thông báo cập nhật trạng thái hồ sơ, thư mời phỏng vấn và nhắc nhở lịch hẹn.</li>
              <li>Ngăn chặn các hành vi giả mạo, tấn công mạng và lừa đảo tuyển dụng.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              3. Chia Sẻ Dữ Liệu Cho Bên Thứ Ba
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Chúng tôi <strong>KHÔNG</strong> bán, trao đổi hoặc cho thuê dữ liệu cá nhân của bạn cho các mục đích tiếp thị thương mại không liên quan. Dữ liệu chỉ được chia sẻ trong các trường hợp:
            </p>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: 1.8, fontSize: '0.9rem' }}>
              <li>Chia sẻ cho Doanh nghiệp tuyển dụng khi bạn bấm nút "Nộp hồ sơ ứng tuyển" hoặc khi bạn bật chế độ "Cho phép Nhà tuyển dụng tìm kiếm hồ sơ".</li>
              <li>Chia sẻ cho cổng thanh toán trực tuyến nhằm xác minh và xử lý giao dịch mua gói dịch vụ.</li>
              <li>Cung cấp cho cơ quan nhà nước có thẩm quyền tại Việt Nam khi có yêu cầu bằng văn bản theo đúng quy định của pháp luật.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              4. Quyền của Chủ Thể Dữ Liệu (Theo Điều 9 Nghị định 13)
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Bạn có đầy đủ các quyền hợp pháp đối với dữ liệu cá nhân của mình, bao gồm:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '12px' }}>
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#1e293b' }}>Quyền được biết & đồng ý:</strong> Biết rõ dữ liệu nào đang được xử lý.
              </div>
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#1e293b' }}>Quyền truy cập & chỉnh sửa:</strong> Tự cập nhật CV, thông tin trong mục Hồ Sơ.
              </div>
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#1e293b' }}>Quyền rút lại sự đồng ý:</strong> Bật/tắt trạng thái hiển thị hồ sơ bất kỳ lúc nào.
              </div>
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#1e293b' }}>Quyền xóa dữ liệu:</strong> Yêu cầu xóa vĩnh viễn tài khoản và các bản ghi CV lưu trữ.
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              5. Biện Pháp Kỹ Thuật Bảo Mật
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Hệ thống áp dụng các tiêu chuẩn an ninh thông tin nghiêm ngặt: Mã hóa dữ liệu truyền tải qua HTTPS/TLS, mã hóa AES-256 các thông tin nhạy cảm trong cơ sở dữ liệu, kiểm soát truy cập RBAC đa tầng và tường lửa chống tấn công DDOS/Brute-force.
            </p>
          </section>

          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '20px',
            fontSize: '0.85rem',
            color: '#64748b'
          }}>
            Để thực hiện các quyền của chủ thể dữ liệu hoặc giải đáp thắc mắc về chính sách bảo mật, vui lòng liên hệ Bộ phận Bảo vệ Dữ liệu Cá nhân của chúng tôi qua email: <strong>privacy@hamo.vn</strong> hoặc Hotline: <strong>1900 6868</strong>.
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
