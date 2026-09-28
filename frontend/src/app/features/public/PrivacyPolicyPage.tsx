import React from 'react';
import { SeoHead } from '../../shared/components/SeoHead';
import { COMPANY_INFO } from '../../config/company-info';
import styles from './ProsePage.module.scss';

export const PrivacyPolicyPage: React.FC = () => {
  const tableOfContents = [
    { id: 'muc-1', title: '1. Loại Dữ Liệu Thu Thập' },
    { id: 'muc-2', title: '2. Mục Đích Xử Lý Dữ Liệu' },
    { id: 'muc-3', title: '3. Nguyên Tắc Chia Sẻ Dữ Liệu' },
    { id: 'muc-4', title: '4. Quyền Của Chủ Thể Dữ Liệu' },
    { id: 'muc-5', title: '5. Thông Tin Đơn Vị Quản Lý' }
  ];

  return (
    <div className={styles.prosePage}>
      <SeoHead
        title="Chính Sách Bảo Mật Dữ Liệu Cá Nhân | HR Portal"
        description="Chính sách bảo mật và bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP của HR Portal. Quyền truy cập, chỉnh sửa, xuất và ẩn danh dữ liệu cá nhân."
        ogType="article"
      />

      <div className={styles.readerLayout}>
        {/* Fixed Table of Contents on Desktop */}
        <aside className={styles.tocSidebar} aria-label="Mục lục bài viết">
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
              <h1>Chính Sách Bảo Mật & Bảo Vệ Dữ Liệu Cá Nhân</h1>
              <span className={styles.subtitle}>
                Tuân thủ Nghị định số 13/2023/NĐ-CP của Chính phủ Việt Nam
              </span>
            </div>

            <div className={styles.complianceNotice}>
              <strong>Cam kết pháp lý:</strong> HR Portal cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của mọi Ứng viên và Đại diện Doanh nghiệp theo đúng quy định tại Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.
            </div>

            <section className={styles.section} id="muc-1">
              <h2>1. Loại Dữ Liệu Cá Nhân Thu Thập</h2>
              <p>
                Khi người dùng đăng ký và sử dụng dịch vụ trên nền tảng HR Portal, chúng tôi thu thập các thông tin sau:
              </p>
              <ul>
                <li><strong>Dữ liệu định danh:</strong> Họ và tên, giới tính, ngày tháng năm sinh, ảnh đại diện.</li>
                <li><strong>Dữ liệu liên lạc:</strong> Địa chỉ email, số điện thoại di động, địa chỉ liên hệ.</li>
                <li><strong>Dữ liệu hồ sơ ứng tuyển:</strong> Lịch sử học vấn, bằng cấp, chứng chỉ, kinh nghiệm làm việc, kỹ năng và tệp đính kèm CV (PDF/DOCX).</li>
                <li><strong>Dữ liệu kỹ thuật & phiên truy cập:</strong> Địa chỉ IP, thời điểm đăng nhập, loại trình duyệt nhằm phát hiện truy cập bất thường và bảo mật tài khoản.</li>
              </ul>
            </section>

            <section className={styles.section} id="muc-2">
              <h2>2. Mục Đích Xử Lý Dữ Liệu</h2>
              <ul>
                <li>Tạo lập và quản lý tài khoản người dùng, xác thực danh tính qua email hoặc số điện thoại.</li>
                <li>Chuyển tiếp hồ sơ ứng tuyển của bạn tới nhà tuyển dụng mà bạn chủ động nộp đơn.</li>
                <li>Hỗ trợ tính năng so khớp và gợi ý cơ hội việc làm phù hợp với kỹ năng và kinh nghiệm.</li>
                <li>Gửi thông báo cập nhật tiến trình hồ sơ, thư mời phỏng vấn và kết quả ứng tuyển.</li>
                <li>Phát hiện, ngăn chặn các hành vi gian lận, truy cập trái phép và bảo vệ an ninh hệ thống.</li>
              </ul>
            </section>

            <section className={styles.section} id="muc-3">
              <h2>3. Nguyên Tắc Chia Sẻ Dữ Liệu</h2>
              <p>
                Chúng tôi <strong>không</strong> bán hoặc chia sẻ dữ liệu cá nhân của người dùng cho bên thứ ba vì mục đích tiếp thị thương mại không liên quan. Dữ liệu chỉ được chia sẻ trong các phạm vi:
              </p>
              <ul>
                <li>Cung cấp cho Doanh nghiệp tuyển dụng khi bạn chủ động nộp hồ sơ ứng tuyển hoặc khi bạn bật chế độ cho phép nhà tuyển dụng tìm kiếm hồ sơ.</li>
                <li>Chuyển thông tin mã đơn hàng cho cổng thanh toán trực tuyến nhằm xác minh và xử lý giao dịch mua gói dịch vụ.</li>
                <li>Cung cấp cho cơ quan nhà nước có thẩm quyền khi có yêu cầu bằng văn bản theo đúng trình tự pháp luật Việt Nam.</li>
              </ul>
            </section>

            <section className={styles.section} id="muc-4">
              <h2>4. Quyền Của Chủ Thể Dữ Liệu (Điều 9 Nghị định 13/2023)</h2>
              <p>
                Chủ thể dữ liệu có đầy đủ các quyền hợp pháp đối với dữ liệu cá nhân của mình trên hệ thống:
              </p>
              <ul>
                <li><strong>Quyền truy cập & chỉnh sửa:</strong> Tự xem, cập nhật và hoàn thiện hồ sơ CV cũng như thông tin tài khoản bất kỳ lúc nào tại trang quản trị cá nhân.</li>
                <li><strong>Quyền rút lại sự đồng ý & ẩn danh tài khoản:</strong> Bạn có thể chủ động tắt chế độ tìm kiếm hồ sơ hoặc sử dụng tính năng ẩn danh tài khoản trong mục Cài đặt tài khoản.</li>
                <li><strong>Quyền xuất dữ liệu cá nhân:</strong> Bạn có thể sử dụng chức năng tải xuống bản sao dữ liệu cá nhân đã lưu trữ trên hệ thống dưới định dạng tiêu chuẩn.</li>
                <li><strong>Quyền xóa dữ liệu:</strong> Bạn có quyền gửi yêu cầu đóng vĩnh viễn tài khoản và xóa bỏ các thông tin nhận dạng cá nhân khỏi cơ sở dữ liệu hoạt động.</li>
              </ul>
            </section>

            <section className={styles.section} id="muc-5">
              <h2>5. Thông Tin Đơn Vị Quản Lý & Tiếp Nhận Yêu Cầu</h2>
              <p>
                Để thực thi các quyền dữ liệu cá nhân hoặc gửi thắc mắc liên quan đến quyền riêng tư, vui lòng liên hệ:
              </p>
              <p>
                <strong>Đơn vị vận hành:</strong> {COMPANY_INFO.legalName}<br />
                <strong>Địa chỉ:</strong> {COMPANY_INFO.address}<br />
                <strong>Email chuyên trách dữ liệu:</strong> {COMPANY_INFO.email}<br />
                <strong>Hotline:</strong> {COMPANY_INFO.phone} ({COMPANY_INFO.operatingHours})
              </p>
            </section>
          </article>
        </main>
      </div>
    </div>
  );
};
