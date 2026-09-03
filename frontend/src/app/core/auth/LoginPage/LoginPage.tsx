import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Button } from '../../../shared/ui/Button/Button';
import styles from './LoginPage.module.scss';
import { LogIn, Lock, User, Eye, EyeOff, Database, Mail } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFormParam = searchParams.get('is_form') === '1';

  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dbChoice = 'crm';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [companyEmailDomain, setCompanyEmailDomain] = useState<string>('');
  const [isCompanyEmailLoginEnabled, setIsCompanyEmailLoginEnabled] = useState<boolean>(false);
  const [isFormMode, setIsFormMode] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem('dbChoice', dbChoice);
    
    // Tải cấu hình public từ backend
    authService.getPublicConfig().then(res => {
      if (res.success && res.data) {
        const domain = res.data.companyEmailDomain || '';
        const enabled = !!res.data.isCompanyEmailDomainLoginEnabled && !!domain.trim();
        setCompanyEmailDomain(domain);
        setIsCompanyEmailLoginEnabled(enabled);

        // Nếu có param is_form=1 trên url => Bắt buộc hiển thị Form login
        if (isFormParam) {
          setIsFormMode(true);
        } else if (enabled) {
          // Nếu không có is_form=1 và có đuôi mail công ty => Ưu tiên đăng nhập bằng email công ty
          setIsFormMode(false);
        } else {
          setIsFormMode(true);
        }
      }
    }).catch(() => {
      if (isFormParam) setIsFormMode(true);
    });
  }, [isFormParam]);

  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';

  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!googleClientId || isFormMode) return;
    const scriptId = 'google-jssdk';

    const renderGoogleBtn = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleTokenCallback,
          auto_select: false,
        });

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = '';
          (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
            locale: 'vi',
          });
        }
      }
    };

    if (!(window as any).google?.accounts?.id) {
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleBtn;
        document.body.appendChild(script);
      }
    } else {
      renderGoogleBtn();
    }
  }, [googleClientId, isFormMode]);

  const handleGoogleTokenCallback = async (response: any) => {
    if (!response.credential) return;
    setError('');
    setLoading(true);
    try {
      const res = await authService.googleLogin({ googleToken: response.credential });
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error?.message || 'Xác thực tài khoản Google không thành công');
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message || err.response?.data?.message;
      setError(serverMsg || 'Đăng nhập bằng Google G-Suite thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleBtnClick = () => {
    setError('');
    if (!googleClientId) {
      setError('Hệ thống chưa cấu hình VITE_GOOGLE_CLIENT_ID. Vui lòng khai báo trên Google Cloud Console theo hướng dẫn.');
      setShowManualInput(true);
      return;
    }

    if (googleButtonRef.current) {
      const btn = googleButtonRef.current.querySelector('div[role="button"], iframe') as HTMLElement;
      if (btn) {
        btn.click();
        return;
      }
    }

    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    } else {
      setError('Đang tải thư viện Google OAuth. Vui lòng thử lại sau vài giây.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(credentials);
      if (response.success) {
        navigate('/');
      } else {
        setError(response.error?.message || 'Đăng nhập không thành công');
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message || err.response?.data?.message;
      setError(serverMsg || 'Có lỗi xảy ra khi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCompanyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let targetEmail = companyEmail.trim();
    if (!targetEmail) {
      setError('Vui lòng nhập Email công ty của bạn');
      return;
    }
    if (!companyPassword) {
      setError('Vui lòng nhập Mật khẩu của bạn');
      return;
    }

    const cleanDomain = companyEmailDomain.startsWith('@') ? companyEmailDomain.slice(1) : companyEmailDomain;
    if (!targetEmail.includes('@') && cleanDomain) {
      targetEmail = `${targetEmail}@${cleanDomain}`;
    }

    setLoading(true);
    try {
      const response = await authService.googleLogin({ email: targetEmail, password: companyPassword });
      if (response.success) {
        navigate('/');
      } else {
        setError(response.error?.message || 'Xác thực Email công ty không thành công');
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message || err.response?.data?.message;
      setError(serverMsg || 'Đăng nhập bằng Email công ty thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.brandSection}>
          <div className={styles.logo}>
            <img src="/hr.png" alt="Logo" className={styles.logoImg} />
            <span className={styles.logoText}>HR</span>
          </div>
          <p className={styles.brandSlogan}>Hệ thống tìm việc & tuyển dụng</p>
        </div>

        <div className={styles.form}>
          <h2>Đăng nhập</h2>
          <p className={styles.subtitle}>
            {isFormMode ? 'Sử dụng tài khoản nhân viên được cấp' : 'Xác thực đăng nhập nhanh dành cho nhân viên'}
          </p>

          {error && <div className={styles.errorBanner}>{error}</div>}

          {!isFormMode ? (
            /* Mode 1: Company Email Domain / Google SSO Login */
            <div className={styles.ssoContainer}>
              <div ref={googleButtonRef} style={{ minHeight: '44px', display: 'flex', justifyContent: 'center' }} />

              <button
                type="button"
                className={styles.googleBtnPrimary}
                onClick={handleGoogleBtnClick}
                disabled={loading}
                style={{ display: 'none' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{loading ? 'Đang xác thực Google...' : 'Đăng nhập với Google G-Suite'}</span>
              </button>

              {showManualInput && (
                <form onSubmit={handleSubmitCompanyEmail} className={styles.devFallbackForm}>
                  <div className={styles.divider}>
                    <span>XÁC THỰC THỦ CÔNG (DEV)</span>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email công ty</label>
                    <div className={styles.inputWrapper}>
                      <Mail className={styles.inputIcon} size={18} />
                      <input
                        type="text"
                        value={companyEmail}
                        onChange={e => setCompanyEmail(e.target.value)}
                        placeholder={`nhanvien@${companyEmailDomain.replace(/^@/, '')}`}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mật khẩu</label>
                    <div className={styles.inputWrapper}>
                      <Lock className={styles.inputIcon} size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={companyPassword}
                        onChange={e => setCompanyPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className={styles.toggleVisibility}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className={styles.submitBtn}
                    loading={loading}
                    icon={!loading && <LogIn size={18} />}
                  >
                    Xác thực Email
                  </Button>
                </form>
              )}

              <div className={styles.modeToggleLink}>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/login?is_form=1');
                    setIsFormMode(true);
                  }}
                >
                  Đăng nhập bằng Tên đăng nhập & Mật khẩu (Form)
                </button>
              </div>
            </div>
          ) : (
            /* Mode 2: Username & Password Form */
            <form onSubmit={handleSubmitForm}>
              <div className={styles.formGroup}>
                <label>Tên đăng nhập</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={18} />
                  <input 
                    type="text" 
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    placeholder="Ví dụ: admin" 
                    required 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Mật khẩu</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button" 
                    className={styles.toggleVisibility}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Cơ sở dữ liệu (Database)</label>
                <div className={styles.inputWrapper}>
                  <Database className={styles.inputIcon} size={18} />
                  <select
                    name="dbChoice"
                    value={dbChoice}
                    disabled
                  >
                    <option value="crm">CSDL Khách hàng (crm)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formOptions}>
                <label className={styles.rememberMe}>
                  <input type="checkbox" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a href="#" className={styles.forgotPass}>Quên mật khẩu?</a>
              </div>

              <Button 
                type="submit" 
                className={styles.submitBtn} 
                loading={loading}
                icon={!loading && <LogIn size={18} />}
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
              </Button>

              {isCompanyEmailLoginEnabled && (
                <div className={styles.modeToggleLink}>
                  <button
                    type="button"
                    onClick={() => setIsFormMode(false)}
                  >
                    Chuyển sang Đăng nhập bằng Email công ty (@{companyEmailDomain.replace(/^@/, '')})
                  </button>
                </div>
              )}
            </form>
          )}

          <div className={styles.footer}>
            <p>&copy; 2026 HAMO Group. Bảo mật thông tin khách hàng là trên hết.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
