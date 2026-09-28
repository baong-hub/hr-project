import React from 'react';
import { SeoHead } from '../../shared/components/SeoHead';
import { COMPANY_INFO } from '../../config/company-info';
import styles from './AboutPage.module.scss';

export const AboutPage: React.FC = () => {
  return (
    <div className={styles.aboutPage}>
      <SeoHead
        title="Về Chúng Tôi | HR Portal"
        description="Giới thiệu về nền tảng tuyển dụng HR Portal. Minh bạch thông tin tuyển dụng, kết nối trực tiếp ứng viên và doanh nghiệp."
        ogType="website"
      />

      {/* Hero */}
      <section className={styles.hero}>
        <div className="container-public">
          <span className={styles.eyebrow}>Giới thiệu nền tảng</span>
          <h1 className={styles.heroTitle}>Về Chúng Tôi — HR Portal</h1>
          <p className={styles.heroDesc}>
            HR Portal là nền tảng công nghệ tuyển dụng trực tuyến, tập trung vào tính minh bạch của thông tin việc làm và tối ưu hóa quy trình kết nối giữa ứng viên và doanh nghiệp.
          </p>
        </div>
      </section>

      {/* Product & Solutions Overview */}
      <section className={styles.section}>
        <div className="container-public">
          <div className={styles.gridTwo}>
            <div className={styles.card}>
              <h3>Hệ Thống Dành Cho Ứng Viên</h3>
              <p>
                HR Portal cung cấp cho người tìm việc công cụ tìm kiếm và lọc việc làm minh bạch về mức lương, địa điểm làm việc và yêu cầu chuyên môn. Ứng viên có thể tạo hồ sơ trực tuyến, nộp CV và theo dõi trạng thái phản hồi từ nhà tuyển dụng theo thời gian thực.
              </p>
            </div>

            <div className={styles.card}>
              <h3>Hệ Thống Dành Cho Nhà Tuyển Dụng</h3>
              <p>
                Cung cấp cho doanh nghiệp giải pháp đăng tin tuyển dụng, tiếp cận nguồn ứng viên phù hợp, quản lý ứng viên theo từng giai đoạn phỏng vấn (Pipeline) và chấm điểm so khớp hồ sơ bằng trí tuệ nhân tạo (AI Matching) nhằm rút ngắn thời gian tuyển dụng.
              </p>
            </div>
          </div>

          {/* Legal Entity Details */}
          <div className={styles.legalCard}>
            <h2 className={styles.legalTitle}>Thông Tin Pháp Nhân Vận Hành</h2>
            <div className={styles.legalGrid}>
              <div className={styles.legalItem}>
                <span className={styles.legalLabel}>Tên đơn vị pháp nhân</span>
                <span className={styles.legalValue}>{COMPANY_INFO.legalName}</span>
              </div>
              <div className={styles.legalItem}>
                <span className={styles.legalLabel}>Mã số thuế</span>
                <span className={styles.legalValue}>{COMPANY_INFO.taxCode}</span>
              </div>
              <div className={styles.legalItem}>
                <span className={styles.legalLabel}>Địa chỉ trụ sở</span>
                <span className={styles.legalValue}>{COMPANY_INFO.address}</span>
              </div>
              <div className={styles.legalItem}>
                <span className={styles.legalLabel}>Điện thoại / Hotline</span>
                <span className={styles.legalValue}>{COMPANY_INFO.phone}</span>
              </div>
              <div className={styles.legalItem}>
                <span className={styles.legalLabel}>Email liên hệ</span>
                <span className={styles.legalValue}>{COMPANY_INFO.email}</span>
              </div>
              <div className={styles.legalItem}>
                <span className={styles.legalLabel}>Thời gian làm việc</span>
                <span className={styles.legalValue}>{COMPANY_INFO.operatingHours}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
