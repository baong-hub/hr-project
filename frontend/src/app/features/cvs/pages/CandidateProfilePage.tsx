import React, { useState, useEffect } from 'react';
import { cvsService } from '../../../core/services/cvs.service';
import { authService } from '../../../core/services/auth.service';
import type { UpdateProfileDto, CandidateProfileDto } from '../../../core/models/cv.model';
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
        // Lấy danh sách CV để xác định xem Candidate đã có profile chưa
        const cvsResponse = await cvsService.getCvs();
        if (cvsResponse.success && cvsResponse.data && cvsResponse.data.length > 0) {
          // Lấy thông tin ứng viên từ CV đầu tiên hoặc gọi search để tự lấy
          const candidateId = cvsResponse.data[0].candidateId;
          // Gọi API tìm kiếm ứng viên của chính mình
          const searchResponse = await cvsService.searchCandidates({ search: personalInfo.fullName });
          if (searchResponse.success && searchResponse.data) {
            const myProfile = searchResponse.data.find((p: CandidateProfileDto) => p.id === candidateId);
            if (myProfile) {
              setSkills(myProfile.skills || []);
              setExperienceSummary(myProfile.objective || '');
              setVisibilityStatus(myProfile.visibilityStatus as 'PUBLIC' | 'PRIVATE');
            }
          }
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
        <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#10b981', width: '40px', height: '40px' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Đang tải thông tin hồ sơ ứng viên...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Hồ sơ năng lực của tôi
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Cập nhật kỹ năng, kinh nghiệm và cấu hình chế độ hiển thị hồ sơ với Nhà tuyển dụng.
        </p>
      </div>

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid #10b981',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          color: '#10b981'
        }}>
          <CheckCircle2 style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>Cập nhật hồ sơ năng lực thành công!</span>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger-default)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          color: 'var(--color-danger-default)'
        }}>
          <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Card 1: Thông tin cá nhân cơ bản */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--color-border-default)', paddingBottom: '16px', marginBottom: '20px' }}>
            <User style={{ color: '#10b981', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Thông tin cá nhân cơ bản
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <img 
              src={personalInfo.avatarUrl} 
              alt="Avatar" 
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #10b981' }} 
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Họ tên</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)', fontWeight: 500 }}>
                  {personalInfo.fullName}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Email</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)' }}>
                  {personalInfo.email}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Ngày sinh</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)' }}>
                  {personalInfo.birthDate}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Giới tính / Điện thoại</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)' }}>
                  {personalInfo.gender} | {personalInfo.phone}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Năng lực & Kinh nghiệm */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--color-border-default)', paddingBottom: '16px', marginBottom: '20px' }}>
            <Tag style={{ color: '#10b981', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Năng lực & Kinh nghiệm
            </h2>
          </div>

          {/* Nhập kỹ năng */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Kỹ năng chuyên môn
            </label>
            <input 
              type="text" 
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Nhập kỹ năng (ví dụ: ReactJS, SQL, Docker) rồi ấn Enter hoặc dấu phẩy"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            
            {/* Danh sách thẻ tag */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {skills.map((skill, index) => (
                <span 
                  key={index} 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    borderRadius: '50px',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => removeSkill(index)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: '#10b981'
                    }}
                  >
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Chưa có kỹ năng nào được thêm.</span>
              )}
            </div>
          </div>

          {/* Tóm tắt kinh nghiệm */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                Tóm tắt kinh nghiệm làm việc
              </label>
              <span style={{ fontSize: '12px', color: experienceSummary.length > 4000 ? 'var(--color-danger-default)' : 'var(--color-text-secondary)' }}>
                {experienceSummary.length} / 4000 ký tự
              </span>
            </div>
            <textarea 
              rows={6}
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value.slice(0, 4000))}
              placeholder="Tóm tắt ngắn gọn các kinh nghiệm làm việc nổi bật, các dự án đã tham gia..."
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Card 3: Trạng thái hiển thị hồ sơ */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--color-border-default)', paddingBottom: '16px', marginBottom: '20px' }}>
            <FileText style={{ color: '#10b981', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Trạng thái tìm việc
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {visibilityStatus === 'PUBLIC' ? (
                  <Eye style={{ color: '#10b981', width: '20px', height: '20px' }} />
                ) : (
                  <EyeOff style={{ color: 'var(--color-text-muted)', width: '20px', height: '20px' }} />
                )}
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Cho phép Nhà tuyển dụng tìm kiếm hồ sơ
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Khi bật chế độ này, hồ sơ và các tệp CV chính của bạn sẽ được hiển thị công khai trên thanh tìm kiếm của Nhà tuyển dụng. Bạn có cơ hội nhận lời mời phỏng vấn trực tiếp từ các công ty hàng đầu.
              </p>
            </div>

            {/* Toggle Switch */}
            <button 
              type="button"
              onClick={() => setVisibilityStatus(visibilityStatus === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
              style={{
                border: 'none',
                width: '56px',
                height: '30px',
                borderRadius: '50px',
                backgroundColor: visibilityStatus === 'PUBLIC' ? '#10b981' : 'var(--color-border-default)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                flexShrink: 0
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                position: 'absolute',
                top: '3px',
                left: visibilityStatus === 'PUBLIC' ? '29px' : '3px',
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
        </div>

        {/* Nút bấm Lưu Thay đổi */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button 
            type="submit"
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
              transition: 'background-color 0.2s',
              outline: 'none'
            }}
          >
            {saving ? (
              <Loader2 style={{ animation: 'spin 1s linear infinite', width: '20px', height: '20px' }} />
            ) : (
              <Save style={{ width: '20px', height: '20px' }} />
            )}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
};
