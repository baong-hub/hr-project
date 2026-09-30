import React, { useState } from 'react';
import { Mail, User, Eye, Edit2, PauseCircle, Sparkles, Check } from 'lucide-react';
import { JobCardBase } from '../../shared/components/job-card/JobCardBase';
import { JobCard } from '../../shared/components/job-card/JobCard';
import { Modal } from '../../shared/components/modal/Modal';
import { StatusBadge } from '../../shared/components/status-badge/StatusBadge';
import { FormField } from '../../shared/components/form-field/FormField';
import type { JobDto } from '../../core/models/job.model';
import styles from './ComponentShowcasePage.module.scss';

const MOCK_JOB_1: JobDto = {
  id: 101,
  title: 'Senior Frontend Engineer (React 19 / TypeScript)',
  companyName: 'TechVision Global Inc.',
  salaryFrom: 35000000,
  salaryTo: 50000000,
  city: 'Hồ Chí Minh',
  experienceLevel: '3-5 năm',
  createdAt: new Date().toISOString(),
  isFeatured: true,
  isUrgent: true,
  status: 'PUBLISHED'
} as any;

const MOCK_JOB_2: JobDto = {
  id: 102,
  title: 'Chuyên viên Nhân sự Tuyển dụng (Senior Talent Acquisition)',
  companyName: 'Tập đoàn Bán lẻ VinConnect',
  salaryFrom: 18000000,
  salaryTo: 25000000,
  city: 'Hà Nội',
  experienceLevel: '2 năm',
  createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  isFeatured: false,
  isUrgent: false,
  status: 'PAUSED'
} as any;

export const ComponentShowcasePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isSaved, setIsSaved] = useState(false);
  const [testInput, setTestInput] = useState('Nguyễn Văn A');
  const [testEmail, setTestEmail] = useState('nguyenvana@gmail.com');
  const [testRole, setTestRole] = useState('developer');
  const [testBio, setTestBio] = useState('Kỹ sư phần mềm đam mê trải nghiệm người dùng.');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Hệ Thống Thành Phần Dùng Chung (Design System Showcase)</h1>
        <p>Bao gồm JobCardBase, Modal, StatusBadge, và FormField chuẩn hóa theo token thiết kế.</p>
      </header>

      {/* 1. JobCardBase & JobCard */}
      <section className={styles.section}>
        <h2>1. JobCard Dùng Chung (JobCardBase & JobCard)</h2>
        <div className={styles.grid}>
          {/* Public context: applies JobCard with Save & Click */}
          <div>
            <h4 style={{ marginBottom: 8, fontSize: '0.875rem' }}>Ngữ cảnh Công khai (Ứng tuyển & Lưu tin)</h4>
            <JobCard
              job={MOCK_JOB_1}
              isSaved={isSaved}
              onToggleSave={() => setIsSaved(!isSaved)}
              renderActions={() => (
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.primary}`}
                  onClick={() => alert('Ứng tuyển ngay!')}
                >
                  Ứng tuyển
                </button>
              )}
            />
          </div>

          {/* Employer context: custom renderActions with Edit / Pause / View */}
          <div>
            <h4 style={{ marginBottom: 8, fontSize: '0.875rem' }}>Ngữ cảnh Nhà tuyển dụng (Sửa / Tạm dừng / Ứng viên)</h4>
            <JobCardBase
              job={MOCK_JOB_2}
              statusBadge={<StatusBadge status="PAUSED" type="job" />}
              renderActions={() => (
                <>
                  <button type="button" className={styles.actionButton}>
                    <Edit2 size={12} /> Sửa
                  </button>
                  <button type="button" className={styles.actionButton}>
                    <PauseCircle size={12} /> Mở lại
                  </button>
                  <button type="button" className={`${styles.actionButton} ${styles.primary}`}>
                    <Eye size={12} /> 14 Ứng viên
                  </button>
                  <button type="button" className={styles.actionButton}>
                    <Sparkles size={12} /> Quảng bá
                  </button>
                </>
              )}
            />
          </div>
        </div>
      </section>

      {/* 2. StatusBadge Showcase */}
      <section className={styles.section}>
        <h2>2. StatusBadge Dùng Chung (Ánh xạ tường minh theo Context)</h2>
        <div className={styles.badgeGrid}>
          <div className={styles.badgeGroup}>
            <strong>Tin tuyển dụng:</strong>
            <StatusBadge status="PUBLISHED" type="job" />
            <StatusBadge status="PAUSED" type="job" />
            <StatusBadge status="CLOSED" type="job" />
            <StatusBadge status="DRAFT" type="job" />
            <StatusBadge status="REJECTED" type="job" />
          </div>

          <div className={styles.badgeGroup}>
            <strong>Đơn ứng tuyển:</strong>
            <StatusBadge status="APPLIED" type="application" />
            <StatusBadge status="SCREENING" type="application" />
            <StatusBadge status="SHORTLISTED" type="application" />
            <StatusBadge status="INTERVIEW" type="application" />
            <StatusBadge status="OFFER" type="application" />
            <StatusBadge status="HIRED" type="application" />
            <StatusBadge status="REJECTED" type="application" />
          </div>

          <div className={styles.badgeGroup}>
            <strong>Phỏng vấn:</strong>
            <StatusBadge status="SCHEDULED" type="interview" />
            <StatusBadge status="CONFIRMED" type="interview" />
            <StatusBadge status="COMPLETED" type="interview" />
            <StatusBadge status="CANCELLED" type="interview" />
            <StatusBadge status="RESCHEDULED" type="interview" />
          </div>

          <div className={styles.badgeGroup}>
            <strong>Thư mời (Offer):</strong>
            <StatusBadge status="SENT" type="offer" />
            <StatusBadge status="ACCEPTED" type="offer" />
            <StatusBadge status="NEGOTIATING" type="offer" />
            <StatusBadge status="REJECTED" type="offer" />
            <StatusBadge status="EXPIRED" type="offer" />
          </div>

          <div className={styles.badgeGroup}>
            <strong>Biến thể hiển thị:</strong>
            <StatusBadge status="SHORTLISTED" type="application" variant="subtle" />
            <StatusBadge status="SHORTLISTED" type="application" variant="outline" />
            <StatusBadge status="SHORTLISTED" type="application" variant="dot" />
            <StatusBadge status="SHORTLISTED" type="application" showDot />
          </div>
        </div>
      </section>

      {/* 3. FormField Showcase */}
      <section className={styles.section}>
        <h2>3. FormField Dùng Chung (Input / Select / Textarea / Validation)</h2>
        <div className={styles.formGrid}>
          <FormField
            label="Họ và tên ứng viên"
            required
            prefixIcon={<User size={16} />}
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Nhập họ và tên đầy đủ"
            hint="Hiển thị trên hồ sơ và CV"
          />

          <FormField
            label="Địa chỉ Email"
            required
            type="email"
            prefixIcon={<Mail size={16} />}
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            error={!testEmail.includes('@') ? 'Địa chỉ email không hợp lệ' : null}
          />

          <FormField
            control="select"
            label="Vị trí ứng tuyển"
            value={testRole}
            onChange={(e) => setTestRole(e.target.value)}
            options={[
              { value: 'developer', label: 'Frontend Developer' },
              { value: 'backend', label: 'Backend Engineer' },
              { value: 'hr', label: 'HR Manager' }
            ]}
          />

          <FormField
            control="textarea"
            label="Giới thiệu bản thân"
            value={testBio}
            onChange={(e) => setTestBio(e.target.value)}
            placeholder="Tóm tắt kinh nghiệm làm việc..."
          />
        </div>
      </section>

      {/* 4. Modal Showcase */}
      <section className={styles.section}>
        <h2>4. Modal Dùng Chung (Esc / Focus Trap / Zero Blur)</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => { setModalSize('sm'); setIsModalOpen(true); }}
          >
            Mở Modal Nhỏ (sm)
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => { setModalSize('md'); setIsModalOpen(true); }}
          >
            Mở Modal Vừa (md)
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => { setModalSize('lg'); setIsModalOpen(true); }}
          >
            Mở Modal Lớn (lg)
          </button>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Xác nhận cập nhật trạng thái tuyển dụng"
          description="Hệ thống sẽ đồng bộ thông tin tới các ứng viên đang theo dõi tin này."
          size={modalSize}
          footer={
            <>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => setIsModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.primary}`}
                onClick={() => {
                  alert('Đã xác nhận!');
                  setIsModalOpen(false);
                }}
              >
                <Check size={14} /> Xác nhận
              </button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>
            Đây là hộp thoại Modal dùng chung. Nền phủ được cấu hình theo <code>--color-overlay</code> (không làm mờ màn hình),
            viền 1px chuẩn theo token, bo góc đồng bộ, hỗ trợ đóng nhanh bằng phím <strong>Escape</strong>, nhấp chuột ngoài vùng phủ,
            và giữ bẫy focus (focus trap) hỗ trợ accessibility hoàn chỉnh.
          </p>
        </Modal>
      </section>
    </div>
  );
};

export default ComponentShowcasePage;
