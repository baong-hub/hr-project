import React, { useState, useEffect } from 'react';
import { cvsService } from '../../../core/services/cvs.service';
import { authService } from '../../../core/services/auth.service';
import type { UpdateProfileDto } from '../../../core/models/cv.model';
import { 
  User, 
  Tag, 
  FileText, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  CheckCircle2, 
  X,
  AlertCircle
} from 'lucide-react';
import styles from './CandidateProfilePage.module.scss';
import { FormField } from '../../../shared/components/form-field/FormField';

export const CandidateProfilePage: React.FC = () => {
  // Candidate Profile State
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [visibilityStatus, setVisibilityStatus] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');

  const user = authService.getUser();

  // Basic Personal Info states (Dynamic from current user)
  const [personalInfo] = useState({
    fullName: user?.fullName || 'Ứng viên',
    email: user?.email || 'candidate@example.com',
    birthDate: user?.birthDate || 'Chưa cập nhật',
    gender: user?.gender || 'Chưa cập nhật',
    phone: user?.phoneNumber || user?.phone || 'Chưa cập nhật',
    avatarUrl: user?.avatarUrl || ''
  });

  // UI Status
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load existing profile information (Simulated from CV list / search)
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cvsService.getProfile();
        if (res.success && res.data) {
          const profile = res.data;
          setSkills(profile.skills || []);
          setExperienceSummary(profile.objective || '');
          setVisibilityStatus((profile.visibilityStatus as 'PUBLIC' | 'PRIVATE') || 'PRIVATE');
        }
      } catch (err: any) {
        console.error('Không thể tải hồ sơ hiện tại:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Skill tag interactions
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = skillInput.trim().replace(/,/g, '');
      if (value && !skills.includes(value)) {
        if (skills.length >= 15) {
          setError('Tối đa chỉ được thêm 15 kỹ năng.');
          return;
        }
        setSkills([...skills, value]);
        setSkillInput('');
        setError(null);
      }
    }
  };

  const removeSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload: UpdateProfileDto = {
      skills: skills.join(', '),
      experienceSummary: experienceSummary,
      visibilityStatus: visibilityStatus
    };

    try {
      const response = await cvsService.updateProfile(payload);
      if (response.success) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(response.error?.message || 'Cập nhật hồ sơ không thành công.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderCenter}>
        <Loader2 className={styles.loaderIcon} />
        <p>Đang tải thông tin hồ sơ ứng viên...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Hồ sơ năng lực của tôi
        </h1>
        <p className={styles.subtitle}>
          Cập nhật kỹ năng, kinh nghiệm và cấu hình chế độ hiển thị hồ sơ với Nhà tuyển dụng.
        </p>
      </div>

      {success && (
        <div className={styles.successAlert}>
          <CheckCircle2 />
          <span>Cập nhật hồ sơ năng lực thành công!</span>
        </div>
      )}

      {error && (
        <div className={styles.errorAlert}>
          <AlertCircle />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* Card 1: Thông tin cá nhân cơ bản */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <User className={styles.headerIcon} />
            <h2>
              Thông tin cá nhân cơ bản
            </h2>
          </div>

          <div className={styles.personalInfoRow}>
            {personalInfo.avatarUrl ? (
              <img 
                src={personalInfo.avatarUrl} 
                alt="Avatar" 
                className={styles.avatar} 
              />
            ) : null}
            <div className={styles.personalInfoGrid}>
              <div className={styles.infoField}>
                <label>Họ tên</label>
                <div className={`${styles.infoValue} ${styles.infoValueBold}`}>
                  {personalInfo.fullName}
                </div>
              </div>
              <div className={styles.infoField}>
                <label>Email</label>
                <div className={styles.infoValue}>
                  {personalInfo.email}
                </div>
              </div>
              <div className={styles.infoField}>
                <label>Ngày sinh</label>
                <div className={styles.infoValue}>
                  {personalInfo.birthDate}
                </div>
              </div>
              <div className={styles.infoField}>
                <label>Giới tính / Điện thoại</label>
                <div className={styles.infoValue}>
                  {personalInfo.gender} | {personalInfo.phone}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Năng lực & Kinh nghiệm */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Tag className={styles.headerIcon} />
            <h2>
              Năng lực & Kinh nghiệm
            </h2>
          </div>

          {/* Nhập kỹ năng */}
          <div className={styles.skillInputGroup}>
            <FormField
              label="Kỹ năng chuyên môn"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Nhập kỹ năng (ví dụ: ReactJS, SQL, Docker) rồi ấn Enter hoặc dấu phẩy"
              hint="Nhấn Enter hoặc gõ dấu phẩy để thêm kỹ năng vào danh sách"
            />
            
            {/* Danh sách thẻ tag */}
            <div className={styles.tagsContainer}>
              {skills.map((skill, index) => (
                <span 
                  key={index} 
                  className={styles.skillTag}
                >
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => removeSkill(index)}
                    className={styles.removeTagBtn}
                    aria-label={`Xóa kỹ năng ${skill}`}
                  >
                    <X />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <span className={styles.noSkillsText}>Chưa có kỹ năng nào được thêm.</span>
              )}
            </div>
          </div>

          {/* Tóm tắt kinh nghiệm */}
          <FormField
            control="textarea"
            label="Tóm tắt kinh nghiệm làm việc"
            rows={6}
            value={experienceSummary}
            onChange={(e) => setExperienceSummary(e.target.value.slice(0, 4000))}
            placeholder="Tóm tắt ngắn gọn các kinh nghiệm làm việc nổi bật, các dự án đã tham gia..."
            hint={`${experienceSummary.length} / 4000 ký tự`}
            error={experienceSummary.length > 4000 ? 'Vượt quá số ký tự cho phép' : undefined}
          />
        </div>

        {/* Card 3: Trạng thái hiển thị hồ sơ */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FileText className={styles.headerIcon} />
            <h2>
              Trạng thái tìm việc
            </h2>
          </div>

          <div className={styles.visibilityRow}>
            <div>
              <div className={styles.visibilityHeader}>
                {visibilityStatus === 'PUBLIC' ? (
                  <Eye className={styles.eyePublic} />
                ) : (
                  <EyeOff className={styles.eyePrivate} />
                )}
                <h3>
                  Cho phép Nhà tuyển dụng tìm kiếm hồ sơ
                </h3>
              </div>
              <p className={styles.visibilityDesc}>
                Khi bật chế độ này, hồ sơ và các tệp CV chính của bạn sẽ được hiển thị công khai trên thanh tìm kiếm của Nhà tuyển dụng. Bạn có cơ hội nhận lời mời phỏng vấn trực tiếp từ các công ty hàng đầu.
              </p>
            </div>

            {/* Toggle Switch */}
            <button 
              type="button"
              onClick={() => setVisibilityStatus(visibilityStatus === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
              className={`${styles.toggleSwitch} ${visibilityStatus === 'PUBLIC' ? styles.toggleActive : ''}`}
              aria-label="Chuyển trạng thái tìm việc"
            >
              <div className={`${styles.toggleThumb} ${visibilityStatus === 'PUBLIC' ? styles.thumbActive : ''}`} />
            </button>
          </div>
        </div>

        {/* Nút bấm Lưu Thay đổi */}
        <div className={styles.submitRow}>
          <button 
            type="submit"
            disabled={saving}
            className={styles.saveBtn}
          >
            {saving ? (
              <Loader2 className={styles.spin} />
            ) : (
              <Save />
            )}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
};
