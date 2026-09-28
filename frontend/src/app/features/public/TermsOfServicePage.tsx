import React from 'react';
import { SeoHead } from '../../shared/components/SeoHead';
import { COMPANY_INFO } from '../../config/company-info';
import styles from './ProsePage.module.scss';

export const TermsOfServicePage: React.FC = () => {
  const tableOfContents = [
    { id: 'dieu-1', title: '1. Chấp Nhận Điều Khoản' },
    { id: 'dieu-2', title: '2. Quy Định Dành Cho Ứng Viên' },
    { id: 'dieu-3', title: '3. Quy Định Dành Cho Nhà Tuyển Dụng' },
    { id: 'dieu-4', title: '4. Quyền Hạn & Trách Nhiệm Của Nền Tảng' },
    { id: 'dieu-5', title: '5. Thông Tin Đơn Vị Quản Lý' }
  ];

  return (
    <div className={styles.prosePage}>
      <SeoHead
        title="Điều Khoản Dịch Vụ | HR Portal"
        description="Điều khoản và quy định sử dụng dịch vụ trên nền tảng tuyển dụng HR Portal. Quy định quyền và trách nhiệm của ứng viên và nhà tuyển dụng."
        ogType="article"
      />

      <div className={styles.readerLayout}>
        {/* Fixed Table of Contents on Desktop */}
        <aside className={styles.tocSidebar} aria-label="Mục lục điều khoản">
          <div className={styles.tocTitle}>Mục Lục</div>
          <nav>
            <ul className={styles.tocList}>
              {tableOfContents.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className={styles.tocLink}>
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content Column (720px) */}
        <main className={styles.contentCol}>
          <article className={styles.paperCard}>
            <div className={styles.headerBlock}>
              <h1>Điều Khoản Sử Dụng Dịch Vụ</h1>
              <span className={styles.subtitle}>
                Áp dụng cho mọi Người dùng Ứng viên và Nhà tuyển dụng trên HR Portal
              </span>
            </div>

            <section className={styles.section} id="dieu-1">
              <h2>1. Chấp Nhận Điều Khoản</h2>
              <p>
                Khi truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ dịch vụ nào trên nền tảng HR Portal, bạn xác nhận đã đọc, hiểu rõ và cam kết tuân thủ toàn bộ các quy định trong văn bản Điều khoản dịch vụ này.
              </p>
            </section>

            <section className={styles.section} id="dieu-2">
              <h2>2. Quy Định Dành Cho Ứng Viên</h2>
              <ul>
                <li>Ứng viên có trách nhiệm cung cấp thông tin trung thực, chính xác về học vấn, kinh nghiệm làm việc và các kỹ năng nghề nghiệp trong hồ sơ ứng tuyển (CV).</li>
                <li>Không đăng tải nội dung vi phạm pháp luật, ngôn từ phân biệt đối xử hoặc tệp đính kèm chứa phần mềm gây hại.</li>
                <li>Ứng viên được sử dụng các tính năng tìm kiếm việc làm, tạo hồ sơ, ứng tuyển và theo dõi kết quả hoàn toàn miễn phí.</li>
                <li>Ứng viên tự chịu trách nhiệm bảo mật thông tin đăng nhập và thông báo kịp thời cho ban quản trị nếu phát hiện tài khoản có dấu hiệu bị xâm nhập.</li>
              </ul>
            </section>

            <section className={styles.section} id="dieu-3">
              <h2>3. Quy Định Dành Cho Nhà Tuyển Dụng</h2>
              <ul>
                <li>Nhà tuyển dụng cam kết mọi tin đăng tuyển đều xuất phát từ nhu cầu tuyển dụng có thật, nêu rõ chức danh, địa điểm và mô tả công việc.</li>
                <li><strong>Tuyệt đối nghiêm cấm:</strong> Yêu cầu ứng viên nộp bất kỳ khoản tiền đặt cọc, phí giữ chỗ hoặc lệ phí phỏng vấn dưới mọi hình thức.</li>
                <li>Nghiêm cấm đăng tin tuyển dụng mạo danh tổ chức khác, mô hình đa cấp trái phép hoặc các hoạt động có dấu hiệu lừa đảo.</li>
                <li>Thông tin hồ sơ ứng viên nhận được chỉ được sử dụng cho mục đích tuyển chọn nhân sự của doanh nghiệp và phải tuân thủ quy định bảo vệ dữ liệu cá nhân.</li>
              </ul>
            </section>

            <section className={styles.section} id="dieu-4">
              <h2>4. Quyền Hạn & Trách Nhiệm Của Nền Tảng</h2>
              <ul>
                <li>HR Portal có quyền từ chối phê duyệt hoặc gỡ bỏ các tin tuyển dụng, tạm ngừng tài khoản có dấu hiệu vi phạm tiêu chuẩn cộng đồng hoặc có phản ánh tiêu cực từ người dùng.</li>
                <li>Chúng tôi nỗ lực duy trì vận hành hệ thống ổn định và liên tục, nhưng không chịu trách nhiệm bồi thường cho các gián đoạn dịch vụ xuất phát từ sự cố viễn thông diện rộng hoặc nguyên nhân bất khả kháng.</li>
                <li>Mọi tranh chấp giữa nhà tuyển dụng và ứng viên sẽ được các bên chủ động giải quyết trên tinh thần thiện chí và quy định pháp luật lao động hiện hành.</li>
              </ul>
            </section>

            <section className={styles.section} id="dieu-5">
              <h2>5. Thông Tin Đơn Vị Quản Lý</h2>
              <p>
                Nếu có bất kỳ câu hỏi hoặc thắc mắc nào về Điều khoản dịch vụ, vui lòng liên hệ:
              </p>
              <p>
                <strong>Đơn vị vận hành:</strong> {COMPANY_INFO.legalName}<br />
                <strong>Địa chỉ:</strong> {COMPANY_INFO.address}<br />
                <strong>Email:</strong> {COMPANY_INFO.email} | <strong>Hotline:</strong> {COMPANY_INFO.phone} ({COMPANY_INFO.operatingHours})
              </p>
            </section>
          </article>
        </main>
      </div>
    </div>
  );
};
