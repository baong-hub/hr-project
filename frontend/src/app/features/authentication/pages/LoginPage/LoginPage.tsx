import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../../../../core/services/auth.service';
import styles from './LoginPage.module.scss';
import logoImg from '@/assets/logo.png';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Client-side validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Vui lòng nhập email hợp lệ');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Mật khẩu tối thiểu 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      if (response.success) {
        const user = authService.getUser();
        const role = user?.role || '';
        
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/auth/')) {
          navigate(redirectUrl, { replace: true });
          return;
        }

        // Redirect according to Redirect Flow
        if (role === 'CANDIDATE') {
          navigate('/jobs');
        } else if (
          role === 'EMPLOYER' ||
          role === 'COMPANY_OWNER' ||
          role === 'HR_MANAGER' ||
          role === 'RECRUITER' ||
          role === 'HIRING_MANAGER'
        ) {
          navigate('/employer/jobs');
        } else if (role === 'ADMIN') {
          navigate('/user-roles');
        } else {
          navigate('/');
        }
      } else {
        setErrorMsg(response.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      setErrorMsg('Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Left branding panel */}
        <div className={styles.brandPanel}>
          <div className={styles.brandContent}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoBox}>
                <img src={logoImg} alt="Logo" className={styles.logoImg} />
              </div>
              <span className={styles.brandName}>HR Portal</span>
            </div>
            <p className={styles.brandSlogan}>Kết nối nhân tài - Kiến tạo tương lai</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className={styles.formPanel}>
          <h2 className={styles.title}>Đăng nhập</h2>
          <p className={styles.subtitle}>Chào mừng bạn quay trở lại với HR Portal</p>

          {errorMsg && (
            <div className={`${styles.alertBox} ${styles.alertDanger}`}>
              <AlertCircle size={18} className={styles.authAlertIcon} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className={styles.form}>
            {/* Email field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Địa chỉ Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Mật khẩu</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Utilities */}
            <div className={styles.utilsRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/auth/reset-password" className={styles.forgotLink}>
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit button */}
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className={`animate-spin ${styles.btnSpinner}`} />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập ngay'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className={styles.authLinksFooter}>
            <span className={styles.authFooterText}>
              Chưa có tài khoản?{' '}
              <Link to="/auth/register/candidate" className={styles.authLinkHighlight}>
                Đăng ký Ứng viên
              </Link>
              {' hoặc '}
              <Link to="/auth/register/employer" className={styles.authLinkHighlight}>
                Đăng ký Nhà tuyển dụng
              </Link>
            </span>
            <p className={styles.copyright}>
              © 2026 HR Portal. Kết nối cơ hội nghề nghiệp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
