import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Briefcase, Building, Users, ShieldCheck, 
  Sparkles, ArrowRight, CheckCircle2, TrendingUp,
  Cpu, BarChart3
} from 'lucide-react';
import { SeoHead } from '../../shared/components/SeoHead';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.append('keyword', keyword.trim());
    if (location.trim()) params.append('location', location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  const categories = [
    { name: 'Công nghệ thông tin', icon: Cpu, count: '3,450+ việc làm', color: '#2563eb', bg: '#eff6ff' },
    { name: 'Kinh doanh & Bán hàng', icon: TrendingUp, count: '2,890+ việc làm', color: '#059669', bg: '#ecfdf5' },
    { name: 'Tài chính & Ngân hàng', icon: BarChart3, count: '1,720+ việc làm', color: '#d97706', bg: '#fffbeb' },
    { name: 'Marketing & Truyền thông', icon: Sparkles, count: '1,430+ việc làm', color: '#7c3aed', bg: '#f5f3ff' },
    { name: 'Nhân sự & Hành chính', icon: Users, count: '980+ việc làm', color: '#db2777', bg: '#fdf2f8' },
    { name: 'Kỹ thuật & Sản xuất', icon: Briefcase, count: '1,150+ việc làm', color: '#0891b2', bg: '#ecfeff' }
  ];

  const benefitsCandidate = [
    'Khám phá việc làm lương cao từ 5,000+ doanh nghiệp uy tín',
    'AI gợi ý việc làm phù hợp chính xác theo năng lực và CV',
    'Tạo và cập nhật CV chuyên nghiệp nhanh chóng với công nghệ số',
    'Bảo mật thông tin cá nhân chuẩn Nghị định 13/2023/NĐ-CP'
  ];

  const benefitsEmployer = [
    'Đăng tin tuyển dụng không giới hạn với các gói linh hoạt',
    'Hệ thống AI Scoring tự động sàng lọc và xếp hạng ứng viên',
    'Quản lý phỏng vấn và gửi thư mời làm việc tập trung tiện lợi',
    'Báo cáo phân tích tuyển dụng và hiệu suất chi tiết theo thời gian thực'
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <SeoHead
        title="HR Portal — Nền tảng Tuyển dụng & Kết nối Nhân tài AI Hàng Đầu"
        description="Khám phá hơn 10,000+ việc làm chất lượng cao từ các doanh nghiệp hàng đầu. AI Matching & Scoring tự động, bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP."
        ogType="website"
        ogImage="/hr.png"
      />

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)',
        color: '#ffffff',
        padding: '70px 20px 90px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          right: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(147, 197, 253, 0.3)',
            borderRadius: '9999px',
            padding: '6px 16px',
            marginBottom: '24px',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#93c5fd'
          }}>
            <Sparkles size={16} /> Nền tảng tuyển dụng thế hệ mới tích hợp AI
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '20px',
            letterSpacing: '-1px'
          }}>
            Kết Nối Nhân Tài, <br />
            <span style={{
              background: 'linear-gradient(90deg, #60a5fa, #38bdf8, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Kiến Tạo Đỉnh Cao Sự Nghiệp
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#cbd5e1',
            maxWidth: '750px',
            margin: '0 auto 40px',
            lineHeight: 1.6
          }}>
            Hàng ngàn cơ hội nghề nghiệp chất lượng cao từ các tập đoàn hàng đầu. Ứng dụng AI phân tích CV, khớp lệnh tuyển dụng tức thì và minh bạch.
          </p>

          {/* Search Box */}
          <form 
            onSubmit={handleSearch}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '10px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              maxWidth: '860px',
              margin: '0 auto',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px' }}>
              <Search size={22} color="#64748b" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Vị trí tuyển dụng, kỹ năng, công ty..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  color: '#1e293b',
                  padding: '12px 0'
                }}
              />
            </div>

            <div style={{ width: '1px', height: '36px', backgroundColor: '#e2e8f0' }} className="hidden-mobile" />

            <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px' }}>
              <MapPin size={22} color="#64748b" />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: '#1e293b',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  padding: '12px 0'
                }}
              >
                <option value="">Tất cả địa điểm</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Cần Thơ">Cần Thơ</option>
                <option value="Hải Phòng">Hải Phòng</option>
                <option value="Bình Dương">Bình Dương</option>
                <option value="Remote">Làm việc từ xa (Remote)</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
                flex: '0 0 auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              <Search size={18} /> Tìm việc ngay
            </button>
          </form>

          {/* Quick Stats Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px',
            marginTop: '60px',
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>15,000+</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '4px' }}>Việc làm chất lượng</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>5,000+</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '4px' }}>Doanh nghiệp tuyển dụng</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>250,000+</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '4px' }}>Ứng viên tài năng</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc' }}>98.5%</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '4px' }}>Tỷ lệ hài lòng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section style={{ padding: '70px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b' }}>
            Khám phá việc làm theo ngành nghề nổi bật
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '8px' }}>
            Hàng ngàn cơ hội việc làm hấp dẫn trong các lĩnh vực có nhu cầu tuyển dụng cao nhất
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(cat.name)}`)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = cat.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: cat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={28} color={cat.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                    {cat.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{cat.count}</p>
                </div>
                <ArrowRight size={18} color="#94a3b8" />
              </div>
            );
          })}
        </div>
      </section>

      {/* Dual Value Proposition */}
      <section style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '48px' }}>
          {/* For Candidates */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontWeight: 600,
                fontSize: '0.875rem',
                marginBottom: '16px'
              }}>
                <Users size={16} /> Dành cho Ứng viên
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                Tìm kiếm công việc mơ ước nhanh hơn bao giờ hết
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Công nghệ AI phân tích hồ sơ giúp bạn kết nối trực tiếp với nhà tuyển dụng phù hợp, không tốn thời gian rải CV vô định.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                {benefitsCandidate.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.925rem', color: '#334155' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/auth/register/candidate"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '14px 24px',
                borderRadius: '12px',
                fontWeight: 600,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Tạo hồ sơ ứng viên ngay <ArrowRight size={18} />
            </Link>
          </div>

          {/* For Employers */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontWeight: 600,
                fontSize: '0.875rem',
                marginBottom: '16px'
              }}>
                <Building size={16} /> Dành cho Doanh nghiệp
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                Tối ưu hóa quy trình tuyển dụng và chi phí
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Đăng tin, nhận hồ sơ, chấm điểm tự động bằng AI, đặt lịch phỏng vấn và gửi offer trên một giao diện thống nhất.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                {benefitsEmployer.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.925rem', color: '#334155' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                to="/pricing"
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  textDecoration: 'none',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                Xem bảng giá
              </Link>
              <Link
                to="/auth/register/employer"
                style={{
                  flex: 1,
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                Đăng tin tuyển dụng <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Compliance Badge */}
      <section style={{ padding: '60px 20px', backgroundColor: '#f1f5f9' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <ShieldCheck size={32} color="#2563eb" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
            Bảo Mật Dữ Liệu Tuân Thủ Nghiêm Ngặt Nghị Định 13/2023/NĐ-CP
          </h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '750px', margin: '0 auto 24px' }}>
            Mọi thông tin hồ sơ ứng viên và dữ liệu tuyển dụng của doanh nghiệp đều được mã hóa theo tiêu chuẩn ngân hàng AES-256, lưu trữ trên hệ thống máy chủ nội địa an toàn và đảm bảo quyền kiểm soát thông tin cá nhân của người dùng.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <Link to="/privacy" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', fontSize: '0.925rem' }}>
              Xem Chính sách bảo mật &rarr;
            </Link>
            <Link to="/terms" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', fontSize: '0.925rem' }}>
              Xem Điều khoản dịch vụ &rarr;
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
