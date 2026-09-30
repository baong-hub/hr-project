import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../../../../core/services/auth.service';
import styles from '../LoginPage/LoginPage.module.scss';
import { FormField } from '../../../../shared/components/form-field/FormField';

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
      <div className={`${styles.authSingleCard} ${styles.authFullWidthCard}`}>
        <div className={styles.authHeaderCenter}>
          <span className={styles.authBadge}>
            Dành cho Nhà tuyển dụng
          </span>
          <h2 className={styles.title}>Đăng ký tài khoản tuyển dụng</h2>
          <p className={styles.subtitle}>
            Tạo tài khoản để đăng tin tuyển dụng và tiếp cận hàng ngàn ứng viên chất lượng
          </p>
        </div>

        {errorMsg && (
          <div className={`${styles.alertBox} ${styles.alertDanger}`}>
            <AlertCircle size={18} className={styles.authAlertIcon} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
            <CheckCircle2 size={18} className={styles.authAlertIcon} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.authTwoColGrid}>
            <FormField
              label="Email doanh nghiệp"
              required
              type="email"
              placeholder="email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || !!successMsg}
            />

            <div className={styles.passwordFieldWrapper}>
              <FormField
                label="Mật khẩu"
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 8 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !!successMsg}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || !!successMsg}
                className={styles.eyeToggleBtn}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <FormField
              label="Họ và tên người liên hệ"
              required
              placeholder="Nguyễn Văn B"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading || !!successMsg}
            />

            <FormField
              label="Số điện thoại liên hệ"
              required
              placeholder="0912345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading || !!successMsg}
            />

            <FormField
              label="Chức vụ người đại diện"
              required
              placeholder="Trưởng phòng HR"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              disabled={isLoading || !!successMsg}
            />

            <FormField
              label="Tên doanh nghiệp / Công ty"
              required
              placeholder="Công ty TNHH Hamo"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading || !!successMsg}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading || !!successMsg}>
            {isLoading ? (
              <>
                <Loader2 size={18} className={`animate-spin ${styles.btnSpinner}`} />
                Đang xử lý...
              </>
            ) : (
              'Đăng ký Nhà tuyển dụng'
            )}
          </button>
        </form>

        <div className={styles.authLinksFooter}>
          <span className={styles.authFooterText}>
            Đã có tài khoản?{' '}
            <Link to="/auth/login" className={styles.authLinkHighlight}>
              Đăng nhập ngay
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};
export default RegisterEmployerPage;
