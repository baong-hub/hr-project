import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Briefcase, Building, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../../../../core/services/auth.service';
import styles from '../LoginPage/LoginPage.module.scss';

export const RegisterEmployerPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [position, setPosition] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side validations
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Vui lòng nhập email hợp lệ');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,50}$/;
    if (!password || !passwordRegex.test(password)) {
      setErrorMsg('Mật khẩu bắt buộc có độ dài tối thiểu 8 ký tự, chứa cả chữ hoa, chữ thường và chữ số');
      return;
    }
    if (!fullName || fullName.trim().length < 2) {
      setErrorMsg('Họ và tên tối thiểu 2 ký tự');
      return;
    }
    const phoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber.trim())) {
      setErrorMsg('Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và gồm 10 chữ số)');
      return;
    }
    if (!position || position.trim().length < 2) {
      setErrorMsg('Chức vụ tối thiểu 2 ký tự');
      return;
    }
    if (!companyName || companyName.trim().length < 5) {
      setErrorMsg('Tên doanh nghiệp tối thiểu 5 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.registerEmployer({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        position: position.trim(),
        companyName: companyName.trim()
      });

      if (response.success) {
        setSuccessMsg('Đăng ký nhà tuyển dụng thành công! Đang chuyển hướng đến đăng nhập...');
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        setErrorMsg(response.error?.message || 'Đăng ký thất bại. Vui lòng kiểm tra thông tin.');
      }
    } catch (err: any) {
      setErrorMsg('Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard} style={{ width: '600px', height: 'auto', padding: '24px 0' }}>
        <div className={styles.formPanel} style={{ width: '100%', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brand-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Dành cho Nhà tuyển dụng
            </span>
            <h2 className={styles.title} style={{ marginTop: '4px' }}>Đăng ký tài khoản tuyển dụng</h2>
            <p className={styles.subtitle}>Tạo tài khoản để đăng tuyển dụng và tìm kiếm nhân sự chất lượng cao</p>
          </div>

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

          {successMsg && (
            <div 
              style={{
                padding: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'rgb(16, 185, 129)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: '16px'
              }}
            >
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Email */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Email đăng ký</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || !!successMsg}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Mật khẩu</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || !!successMsg}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || !!successMsg}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Họ tên */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Họ và tên</label>
                <div className={styles.inputWrapper}>
                  <User size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn B"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading || !!successMsg}
                    required
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Số điện thoại</label>
                <div className={styles.inputWrapper}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading || !!successMsg}
                    required
                  />
                </div>
              </div>

              {/* Chức vụ */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Chức vụ</label>
                <div className={styles.inputWrapper}>
                  <Briefcase size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Trưởng phòng HR"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    disabled={isLoading || !!successMsg}
                    required
                  />
                </div>
              </div>

              {/* Tên doanh nghiệp */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Tên doanh nghiệp</label>
                <div className={styles.inputWrapper}>
                  <Building size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Công ty TNHH Hamo"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isLoading || !!successMsg}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className={styles.submitBtn} disabled={isLoading || !!successMsg}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                  Đang xử lý...
                </>
              ) : (
                'Đăng ký Doanh nghiệp'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className={styles.formFooter} style={{ marginTop: '20px' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Đã có tài khoản?{' '}
              <Link to="/auth/login" style={{ color: 'var(--color-brand-primary-dark)', fontWeight: 600 }}>
                Đăng nhập ngay
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
