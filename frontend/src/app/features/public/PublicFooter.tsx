import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, MapPin, Building } from 'lucide-react';
import { COMPANY_INFO } from '../../config/company-info';
import { metaService, type ProvinceItem, type IndustryItem, STATIC_PROVINCES, STATIC_INDUSTRIES } from '../../core/services/meta.service';
import styles from './PublicFooter.module.scss';
import logoImg from '@/assets/logo.png';

export const PublicFooter: React.FC = () => {
  const [industries, setIndustries] = useState<IndustryItem[]>(STATIC_INDUSTRIES.slice(0, 12));
  const [provinces, setProvinces] = useState<ProvinceItem[]>(STATIC_PROVINCES.slice(0, 12));

  useEffect(() => {
    metaService.getIndustries().then((data) => {
      if (data && data.length > 0) {
        setIndustries(data.slice(0, 12));
      }
    });

    metaService.getProvinces().then((data) => {
      if (data && data.length > 0) {
        // Prefer 6 cities first, then next 6 provinces
        const cities = data.filter((p) => p.type === 'city');
        const others = data.filter((p) => p.type === 'province');
        setProvinces([...cities, ...others].slice(0, 12));
      }
    });
  }, []);

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
      {/* Top Section: Quick SEO Links (White surface background) */}
      <div className={styles.topSection}>
        <div className="container-public">
          <div className={styles.topSectionGrid}>
            {/* Column 1: Việc làm theo ngành */}
            <div>
              <h4 className={styles.sectionHeading}>Việc làm theo ngành nghề</h4>
              <ul className={styles.seoLinksGrid}>
                {industries.map((ind) => (
                  <li key={ind.code}>
                    <Link
                      to={`/jobs?industry=${encodeURIComponent(ind.code)}`}
                      className={styles.seoLink}
                      title={ind.name}
                    >
                      {ind.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Việc làm theo địa điểm */}
            <div>
              <h4 className={styles.sectionHeading}>Việc làm theo địa điểm</h4>
              <ul className={styles.seoLinksGrid}>
                {provinces.map((prov) => (
                  <li key={prov.code}>
                    <Link
                      to={`/jobs?province=${encodeURIComponent(prov.code)}`}
                      className={styles.seoLink}
                      title={prov.name}
                    >
                      Việc làm tại {prov.name}
                    </Link>
                  </li>
                ))}
              </ul>
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
