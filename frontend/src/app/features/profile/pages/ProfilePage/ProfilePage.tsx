import React, { useEffect, useState } from 'react';
import { profileService, type UserProfile } from '../../../../core/services/profile.service';
import styles from './ProfilePage.module.scss';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  // Form states for Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility states
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await profileService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load profile', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // AC3 Rules checks
  const rules = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^\w\s]/.test(newPassword),
  };

  const isPasswordValid =
    rules.length &&
    rules.hasUpper &&
    rules.hasLower &&
    rules.hasNumber &&
    rules.hasSpecial;

  const isMatch = confirmPassword.length > 0 && confirmPassword === newPassword;
  const isFormValid = oldPassword.length > 0 && isPasswordValid && isMatch;

  const handleSubmitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!isFormValid) return;

    try {
      setSubmitting(true);
      const res = await profileService.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setSuccessMsg(res.data?.message || 'Đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.error?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Mật khẩu cũ không chính xác hoặc dữ liệu không hợp lệ.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Hồ sơ cá nhân & Bảo mật</h1>
        <p>Xem chi tiết chức danh cá nhân và tự thay đổi mật khẩu bảo mật tài khoản</p>
      </div>

      <div className={styles.grid}>
        {/* Cột 1: Thông tin cá nhân (AC1) */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span>👤</span> Thông tin cá nhân
          </h2>

          {loadingProfile ? (
            <p>Đang tải thông tin cá nhân...</p>
          ) : (
            <>
              <div className={styles.avatarSection}>
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className={styles.avatarCircle} />
                ) : (
                  <div className={styles.avatarCircle}>{getInitials(profile?.fullName)}</div>
                )}
                <div className={styles.userInfoHeading}>
                  <h3>{profile?.fullName || 'N/A'}</h3>
                  <span>@{profile?.username}</span>
                </div>
              </div>

              <div className={styles.infoGroup}>
                <div className={styles.infoRow}>
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    readOnly
                    className={styles.readOnlyInput}
                    value={profile?.fullName || 'N/A'}
                  />
                </div>

                <div className={styles.infoRow}>
                  <label>Mã nhân viên</label>
                  <input
                    type="text"
                    readOnly
                    className={styles.readOnlyInput}
                    value={profile?.staffCode || 'N/A'}
                  />
                </div>

                <div className={styles.infoRow}>
                  <label>Phòng ban</label>
                  <input
                    type="text"
                    readOnly
                    className={styles.readOnlyInput}
                    value={profile?.departmentName || 'N/A'}
                  />
                </div>

                <div className={styles.infoRow}>
                  <label>Chức vụ</label>
                  <div className={styles.tagContainer}>
                    {profile?.positionNames && profile.positionNames.length > 0 ? (
                      profile.positionNames.map((pos, idx) => (
                        <span key={idx} className={styles.tag}>
                          {pos}
                        </span>
                      ))
                    ) : (
                      <span className={styles.tag}>N/A</span>
                    )}
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <label>Email liên hệ</label>
                  <input
                    type="text"
                    readOnly
                    className={styles.readOnlyInput}
                    value={profile?.email || 'N/A'}
                  />
                </div>

                <div className={styles.infoRow}>
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    readOnly
                    className={styles.readOnlyInput}
                    value={profile?.phone || 'N/A'}
                  />
                </div>
              </div>

              <div className={styles.readOnlyNotice}>
                <span>🔒</span>
                <span>Thông tin chức danh được quản lý bởi Phòng HR/Quản trị viên và không thể tự chỉnh sửa.</span>
              </div>
            </>
          )}
        </div>

        {/* Cột 2: Đổi mật khẩu (AC2 & AC3) */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span>🔑</span> Đổi mật khẩu
          </h2>

          {successMsg && <div className={styles.alertSuccess}>✓ {successMsg}</div>}
          {errorMsg && <div className={styles.alertError}>✕ {errorMsg}</div>}

          <form onSubmit={handleSubmitChangePassword} className={styles.form}>
            {/* Mật khẩu cũ */}
            <div className={styles.formGroup}>
              <label>
                Mật khẩu cũ <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showOld ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.toggleBtn}
                  onClick={() => setShowOld(!showOld)}
                >
                  {showOld ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div className={styles.formGroup}>
              <label>
                Mật khẩu mới <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.toggleBtn}
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? 'Ẩn' : 'Hiện'}
                </button>
              </div>

              {/* Checklist AC3 */}
              <div className={styles.rulesList}>
                <span className={styles.ruleTitle}>Quy tắc bảo mật mật khẩu (AC3):</span>
                <div className={`${styles.ruleItem} ${rules.length ? styles.valid : styles.invalid}`}>
                  <span className={styles.icon}>{rules.length ? '✓' : '○'}</span>
                  <span>Tối thiểu 8 ký tự</span>
                </div>
                <div className={`${styles.ruleItem} ${rules.hasUpper ? styles.valid : styles.invalid}`}>
                  <span className={styles.icon}>{rules.hasUpper ? '✓' : '○'}</span>
                  <span>Chứa ít nhất 1 chữ cái viết hoa (A-Z)</span>
                </div>
                <div className={`${styles.ruleItem} ${rules.hasLower ? styles.valid : styles.invalid}`}>
                  <span className={styles.icon}>{rules.hasLower ? '✓' : '○'}</span>
                  <span>Chứa ít nhất 1 chữ cái viết thường (a-z)</span>
                </div>
                <div className={`${styles.ruleItem} ${rules.hasNumber ? styles.valid : styles.invalid}`}>
                  <span className={styles.icon}>{rules.hasNumber ? '✓' : '○'}</span>
                  <span>Chứa ít nhất 1 chữ số (0-9)</span>
                </div>
                <div className={`${styles.ruleItem} ${rules.hasSpecial ? styles.valid : styles.invalid}`}>
                  <span className={styles.icon}>{rules.hasSpecial ? '✓' : '○'}</span>
                  <span>Chứa ít nhất 1 ký tự đặc biệt (@, #, $, %, !...)</span>
                </div>
              </div>
            </div>

            {/* Nhập lại mật khẩu mới */}
            <div className={styles.formGroup}>
              <label>
                Nhập lại mật khẩu mới <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.toggleBtn}
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              {confirmPassword.length > 0 && !isMatch && (
                <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  ✕ Mật khẩu nhập lại không trùng khớp với mật khẩu mới
                </span>
              )}
            </div>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={!isFormValid || submitting}
            >
              {submitting ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
