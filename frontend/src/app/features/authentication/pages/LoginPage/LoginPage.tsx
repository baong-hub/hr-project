import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../../../../core/services/auth.service';
import styles from './LoginPage.module.scss';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
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
                <img src="/hr.png" alt="Logo" className={styles.logoImg} style={{ maxWidth: '80%' }} />
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
            <div 
              style={{
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'rgb(239, 68, 68)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: '16px'
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className={styles.form}>
            {/* Email field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Địa chỉ Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="text"
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
              <a href="#forgot" className={styles.forgotLink}>
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit button */}
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập ngay'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className={styles.formFooter} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Chưa có tài khoản?{' '}
              <Link to="/auth/register/candidate" style={{ color: 'var(--color-brand-primary-dark)', fontWeight: 600 }}>
                Đăng ký Ứng viên
              </Link>
              {' hoặc '}
              <Link to="/auth/register/employer" style={{ color: 'var(--color-brand-primary-dark)', fontWeight: 600 }}>
                Đăng ký Nhà tuyển dụng
              </Link>
            </span>
            <p className={styles.copyright} style={{ marginTop: '16px' }}>
              © 2026 HR Portal. Kết nối cơ hội nghề nghiệp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
