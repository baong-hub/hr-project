import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, HeartHandshake, Shield, Sparkles, Globe 
} from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';

export const AboutPage: React.FC = () => {
  const values = [
    {
      title: 'Minh Bạch & Chuẩn Mực',
      desc: 'Mọi thông tin tuyển dụng, mức lương và tiến trình ứng tuyển đều được công khai, rõ ràng, tôn trọng sự minh bạch cho cả hai phía.',
      icon: Shield,
      color: '#2563eb',
      bg: '#eff6ff'
    },
    {
      title: 'Ứng Dụng Trí Tuệ Nhân Tạo (AI)',
      desc: 'Tích hợp AI chấm điểm, phân tích độ phù hợp của CV và tự động hóa chuỗi quy trình phỏng vấn giúp tiết kiệm 70% thời gian tuyển dụng.',
      icon: Sparkles,
      color: '#7c3aed',
      bg: '#f5f3ff'
    },
    {
      title: 'Bảo Vệ Dữ Liệu Tuyệt Đối',
      desc: 'Cam kết tuân thủ 100% Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Quyền riêng tư và an toàn thông tin luôn là ưu tiên hàng đầu.',
      icon: Target,
      color: '#059669',
      bg: '#ecfdf5'
    },
    {
      title: 'Đồng Hành & Hỗ Trợ Tận Tâm',
      desc: 'Đội ngũ chuyên viên tư vấn nhân sự luôn sẵn sàng hỗ trợ ứng viên viết CV chuẩn và giúp doanh nghiệp tối ưu chiến dịch tuyển dụng.',
      icon: HeartHandshake,
      color: '#ea580c',
      bg: '#fff7ed'
    }
  ];

  const milestones = [
    { year: '2023', title: 'Khởi đầu sứ mệnh', desc: 'Ra mắt phiên bản đầu tiên hỗ trợ tuyển dụng nhân sự nội bộ cho các tập đoàn đối tác.' },
    { year: '2024', title: 'Tích hợp trí tuệ nhân tạo', desc: 'Ứng dụng mô hình AI Matching tự động phân tích CV và kỹ năng ứng viên với độ chính xác cao.' },
    { year: '2025', title: 'Mở rộng thị trường toàn quốc', desc: 'Đạt mốc 5,000+ doanh nghiệp tin cậy sử dụng và hơn 250,000 ứng viên đăng ký tài khoản.' },
    { year: '2026', title: 'Hệ sinh thái nhân sự toàn diện', desc: 'Hoàn thiện hệ sinh thái: Cổng thanh toán gói dịch vụ, cổng xác thực đa kênh, lịch phỏng vấn và bảo mật dữ liệu cấp cao.' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      <PublicNavbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #1e40af 100%)',
        color: '#ffffff',
        padding: '70px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Về Chúng Tôi — HR Portal
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#cbd5e1', lineHeight: 1.6, maxWidth: '750px', margin: '0 auto' }}>
            Chúng tôi xây dựng giải pháp công nghệ nhân sự đột phá nhằm xóa bỏ rào cản giữa doanh nghiệp và người tìm việc, giúp mỗi nhân tài tìm đúng bệ phóng và mỗi doanh nghiệp tìm đúng người đồng hành.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={{ padding: '70px 20px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Target size={26} color="#2563eb" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
              Sứ Mệnh Của Chúng Tôi
            </h2>
            <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.975rem' }}>
              Nâng tầm thị trường lao động Việt Nam thông qua công nghệ hiện đại. Cung cấp nền tảng minh bạch, nhanh chóng và công bằng, giúp ứng viên khẳng định giá trị bản thân và doanh nghiệp xây dựng đội ngũ vững mạnh.
            </p>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Globe size={26} color="#059669" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
              Tầm Nhìn Đến 2030
            </h2>
            <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.975rem' }}>
              Trở thành nền tảng quản trị và tuyển dụng nhân sự số 1 tại Việt Nam và Đông Nam Á, ứng dụng chuẩn mực quốc tế về AI, bảo mật thông tin và trải nghiệm người dùng không giới hạn.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section style={{ backgroundColor: '#ffffff', padding: '70px 20px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b' }}>
              Giá Trị Cốt Lõi Định Hình Sản Phẩm
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '8px' }}>
              Những nguyên tắc nền tảng chúng tôi luôn gìn giữ trong từng dòng mã nguồn và tính năng
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Icon size={24} color={v.color} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>{v.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap / Milestones */}
      <section style={{ padding: '70px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b' }}>Chặng Đường Phát Triển</h2>
          <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '8px' }}>Hành trình không ngừng đổi mới và nâng cấp chất lượng dịch vụ</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {milestones.map((m, idx) => (
            <div key={idx} style={{
              display: 'flex',
              gap: '24px',
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#2563eb',
                minWidth: '80px',
                textAlign: 'center',
                padding: '10px 16px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff'
              }}>
                {m.year}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{m.title}</h3>
                <p style={{ fontSize: '0.925rem', color: '#64748b' }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 20px', backgroundColor: '#1e293b', color: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '16px' }}>Sẵn Sàng Trải Nghiệm Cùng HR Portal?</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '32px' }}>
            Tham gia ngay cộng đồng hơn 250,000 nhân sự và 5,000 doanh nghiệp đang phát triển vượt bậc cùng chúng tôi.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/jobs" style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '14px 28px', borderRadius: '12px', fontWeight: 600, textDecoration: 'none' }}>
              Khám phá việc làm
            </Link>
            <Link to="/contact" style={{ backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #475569', padding: '14px 28px', borderRadius: '12px', fontWeight: 600, textDecoration: 'none' }}>
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
