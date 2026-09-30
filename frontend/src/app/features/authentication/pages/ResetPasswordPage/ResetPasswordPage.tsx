import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../../../../core/services/auth.service';
import styles from '../LoginPage/LoginPage.module.scss';
import { FormField } from '../../../../shared/components/form-field/FormField';
import logoImg from '@/assets/logo.png';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token || !email) {
      setErrorMessage('Đường dẫn đặt lại mật khẩu không hợp lệ (thiếu token hoặc email). Vui lòng yêu cầu lại.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authService.resetPassword({
        email,
        token,
        newPassword: password
      });

      if (res.success) {
        setSuccess(true);
      } else {
        setErrorMessage(res.error?.message || 'Không thể đặt lại mật khẩu. Token có thể đã hết hạn.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.authSingleCard}>
        {/* Logo */}
        <div className={styles.brandTitleRow}>
          <img src={logoImg} alt="Logo" className={styles.brandLogoImg} />
          <span className={styles.brandPortalText}>
            HR <span className={styles.authLinkHighlight}>Portal</span>
          </span>
        </div>

        {success ? (
          <div>
            <div className={`${styles.statusIconCircle} ${styles.statusIconSuccess}`}>
              <CheckCircle2 size={40} />
            </div>
            <h2 className={`${styles.title} ${styles.successTitle}`}>
              Đặt Lại Mật Khẩu Thành Công!
            </h2>
            <p className={styles.subtitle}>
              Mật khẩu mới của bạn đã được cập nhật thành công. Bạn có thể sử dụng mật khẩu mới này để đăng nhập vào hệ thống.
            </p>
            <Link
              to="/auth/login"
              className={styles.submitBtn}
            >
              <span>Đăng nhập ngay</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div>
            <h2 className={styles.title}>
              Thiết Lập Mật Khẩu Mới
            </h2>
            <p className={styles.subtitle}>
              {email ? `Dành cho tài khoản: ${email}` : 'Nhập mật khẩu mới của bạn'}
            </p>

            {errorMessage && (
              <div className={`${styles.alertBox} ${styles.alertDanger}`}>
                <AlertCircle size={18} className={styles.authAlertIcon} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.passwordFieldWrapper}>
                <FormField
                  label="Mật khẩu mới"
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeToggleBtn}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className={styles.passwordFieldWrapper}>
                <FormField
                  label="Xác nhận mật khẩu mới"
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={styles.eyeToggleBtn}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitBtn}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className={`animate-spin ${styles.btnSpinner}`} />
                    Đang cập nhật...
                  </>
                ) : (
                  'Lưu mật khẩu mới'
                )}
              </button>
            </form>

            <div className={styles.authLinksFooter}>
              <Link to="/auth/login" className={styles.backToLoginLink}>
                Quay lại Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ResetPasswordPage;
