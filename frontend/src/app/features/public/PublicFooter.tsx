import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, MapPin, Building, Sparkles, TrendingUp, Zap, Flame } from 'lucide-react';
import { COMPANY_INFO } from '../../config/company-info';
import styles from './PublicFooter.module.scss';
import logoImg from '@/assets/logo.png';

const VALUE_PILLARS = [
  {
    icon: Sparkles,
    title: 'AI So Khớp Nhanh Chóng',
    desc: 'Tự động chấm điểm và so khớp kỹ năng giữa hồ sơ ứng viên và yêu cầu tuyển dụng với độ chính xác cao.',
  },
  {
    icon: ShieldCheck,
    title: 'Doanh Nghiệp Đã Xác Thực',
    desc: '100% doanh nghiệp và tin tuyển dụng được kiểm duyệt minh bạch, nói không với tin ảo và lừa đảo.',
  },
  {
    icon: TrendingUp,
    title: 'Thị Trường Lương Minh Bạch',
    desc: 'Dữ liệu khảo sát lương thực tế từ hàng nghìn vị trí, giúp bạn tự tin nắm bắt mức thu nhập xứng đáng.',
  },
  {
    icon: Zap,
    title: 'Quy Trình Ứng Tuyển 1-Chạm',
    desc: 'Nộp hồ sơ trực tiếp tới nhà tuyển dụng, nhận phản hồi trạng thái hồ sơ theo thời gian thực.',
  },
];

const TRENDING_KEYWORDS = [
  { label: 'ReactJS', query: 'React' },
  { label: 'Node.js', query: 'Node' },
  { label: 'Java', query: 'Java' },
  { label: 'Python / AI', query: 'Python' },
  { label: 'Frontend Developer', query: 'Frontend' },
  { label: 'Marketing Online', query: 'Marketing' },
  { label: 'Kế toán tổng hợp', query: 'Kế toán' },
  { label: 'Nhân viên kinh doanh', query: 'Kinh doanh' },
  { label: 'Chuyên viên Nhân sự', query: 'HR' },
  { label: 'Việc làm Remote', query: 'Remote' },
];

export const PublicFooter: React.FC = () => {
  const isFilled = (val?: string): boolean => {
    if (!val) return false;
    const trimmed = val.trim();
    return trimmed.length > 0 && !trimmed.startsWith('[CẦN ĐIỀN');
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      const missing: string[] = [];
      if (!isFilled(COMPANY_INFO.legalName)) missing.push('legalName');
      if (!isFilled(COMPANY_INFO.address)) missing.push('address');
      if (!isFilled(COMPANY_INFO.email)) missing.push('email');
      if (!isFilled(COMPANY_INFO.phone)) missing.push('phone');
      if (!isFilled(COMPANY_INFO.taxCode)) missing.push('taxCode');
      if (missing.length > 0) {
        console.warn('[HR Portal Dev] COMPANY_INFO contains unfilled placeholders:', missing.join(', '));
      }
    }
  }, []);

  const hasContactInfo =
    isFilled(COMPANY_INFO.legalName) ||
    isFilled(COMPANY_INFO.address) ||
    isFilled(COMPANY_INFO.email) ||
    isFilled(COMPANY_INFO.phone) ||
    isFilled(COMPANY_INFO.taxCode);

  return (
    <footer className={styles.footer}>
      {/* Top Section: Ecosystem Value Pillars & Trending Tags */}
      <div className={styles.topSection}>
        <div className="container-public">
          <div className={styles.pillarsGrid}>
            {VALUE_PILLARS.map((pillar, idx) => {
              const IconComp = pillar.icon;
              return (
                <div key={idx} className={styles.pillarCard}>
                  <div className={styles.pillarIconBox}>
                    <IconComp size={20} />
                  </div>
                  <h4 className={styles.pillarTitle}>{pillar.title}</h4>
                  <p className={styles.pillarDesc}>{pillar.desc}</p>
                </div>
              );
            })}
          </div>

          <div className={styles.trendingStrip}>
            <span className={styles.trendingLabel}>
              <Flame size={15} color="#f97316" /> Từ khóa xu hướng:
            </span>
            <div className={styles.trendingTagsList}>
              {TRENDING_KEYWORDS.map((item, idx) => (
                <Link
                  key={idx}
                  to={`/jobs?q=${encodeURIComponent(item.query)}`}
                  className={styles.trendingTag}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Navy Slate #1E2130 Background */}
      <div className={styles.bottomSection}>
        <div className="container-public">
          <div className={styles.bottomGrid}>
            {/* Brand Col */}
            <div className={styles.brandCol}>
              <Link to="/" className={styles.logoLink} aria-label="HR Portal Trang chủ">
                <img src={logoImg} alt="HR Portal Logo" className={styles.logoImg} />
              </Link>
              <p className={styles.brandDesc}>
                Nền tảng kết nối cơ hội việc làm và tuyển dụng nhân sự minh bạch, bảo mật và hiệu quả dành cho doanh nghiệp và ứng viên tại Việt Nam.
              </p>
              <Link to="/privacy" className={styles.complianceBadge}>
                <ShieldCheck size={15} />
                <span>Tuân thủ Nghị định 13/2023/NĐ-CP bảo vệ dữ liệu</span>
              </Link>
            </div>

            {/* Col 2: Ứng viên */}
            <div>
              <h4 className={styles.colTitle}>Dành Cho Ứng Viên</h4>
              <ul className={styles.colList}>
                <li>
                  <Link to="/jobs" className={styles.footerLink}>
                    Tìm kiếm việc làm
                  </Link>
                </li>
                <li>
                  <Link to="/companies" className={styles.footerLink}>
                    Danh sách công ty
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className={styles.footerLink}>
                    Cẩm nang nghề nghiệp
                  </Link>
                </li>
                <li>
                  <Link to="/salary-insights" className={styles.footerLink}>
                    Báo cáo mức lương
                  </Link>
                </li>
                <li>
                  <Link to="/auth/register/candidate" className={styles.footerLink}>
                    Tạo hồ sơ ứng viên
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Nhà tuyển dụng */}
            <div>
              <h4 className={styles.colTitle}>Dành Cho Nhà Tuyển Dụng</h4>
              <ul className={styles.colList}>
                <li>
                  <Link to="/pricing" className={styles.footerLink}>
                    Bảng giá dịch vụ
                  </Link>
                </li>
                <li>
                  <Link to="/auth/register/employer" className={styles.footerLink}>
                    Đăng ký nhà tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className={styles.footerLink}>
                    Liên hệ tư vấn tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link to="/about" className={styles.footerLink}>
                    Về nền tảng HR Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Pháp lý & Liên hệ */}
            <div>
              <h4 className={styles.colTitle}>Pháp Lý & Hỗ Trợ</h4>
              <ul className={styles.colList}>
                <li>
                  <Link to="/terms" className={styles.footerLink}>
                    Điều khoản dịch vụ
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className={styles.footerLink}>
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className={styles.footerLink}>
                    Gửi yêu cầu hỗ trợ
                  </Link>
                </li>
              </ul>

              {hasContactInfo && (
                <div className={styles.contactBlock}>
                  {isFilled(COMPANY_INFO.legalName) && (
                    <div className={styles.contactItem}>
                      <Building size={14} />
                      <span>{COMPANY_INFO.legalName}</span>
                    </div>
                  )}
                  {isFilled(COMPANY_INFO.address) && (
                    <div className={styles.contactItem}>
                      <MapPin size={14} />
                      <span>{COMPANY_INFO.address}</span>
                    </div>
                  )}
                  {isFilled(COMPANY_INFO.email) && (
                    <div className={styles.contactItem}>
                      <Mail size={14} />
                      <span>{COMPANY_INFO.email}</span>
                    </div>
                  )}
                  {isFilled(COMPANY_INFO.phone) && (
                    <div className={styles.contactItem}>
                      <Phone size={14} />
                      <span>{COMPANY_INFO.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Copyright bar */}
          <div className={styles.copyrightBar}>
            <span>© {new Date().getFullYear()} {COMPANY_INFO.name}. Bảo lưu mọi quyền.</span>
            <span>Bảo vệ quyền riêng tư & dữ liệu cá nhân theo quy định pháp luật.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
