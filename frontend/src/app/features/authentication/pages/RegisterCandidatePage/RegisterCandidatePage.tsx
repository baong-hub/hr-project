import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../../../../core/services/auth.service';
import styles from '../LoginPage/LoginPage.module.scss';
import { FormField } from '../../../../shared/components/form-field/FormField';

export const RegisterCandidatePage: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side validations
    if (!fullName || fullName.trim().length < 2) {
      setErrorMsg('Họ và tên tối thiểu 2 ký tự');
      return;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Vui lòng nhập email hợp lệ');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,50}$/;
    if (!password || !passwordRegex.test(password)) {
      setErrorMsg('Mật khẩu bắt buộc có độ dài tối thiểu 8 ký tự, chứa cả chữ hoa, chữ thường và chữ số');
      return;
    }
    const phoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber.trim())) {
      setErrorMsg('Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và gồm 10 chữ số)');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.registerCandidate({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: phoneNumber.trim()
      });

      if (response.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...');
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        setErrorMsg(response.error?.message || 'Đăng ký tài khoản thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      setErrorMsg('Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.authSingleCard}>
        <div className={styles.authHeaderCenter}>
          <span className={styles.authBadge}>
            Dành cho Ứng viên
          </span>
          <h2 className={styles.title}>Đăng ký tài khoản</h2>
          <p className={styles.subtitle}>
            Tạo tài khoản để ứng tuyển hàng nghìn công việc hấp dẫn
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
          <FormField
            label="Họ và tên"
            required
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading || !!successMsg}
          />

          <FormField
            label="Địa chỉ Email"
            required
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || !!successMsg}
          />

          <FormField
            label="Số điện thoại"
            required
            placeholder="0901234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading || !!successMsg}
          />

          <div className={styles.passwordFieldWrapper}>
            <FormField
              label="Mật khẩu"
              required
              type={showPassword ? 'text' : 'password'}
              placeholder="Tối thiểu 8 ký tự (hoa, thường, số)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || !!successMsg}
              hint="Bao gồm ít nhất 8 ký tự, có chữ hoa, thường và số"
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

          <button type="submit" className={styles.submitBtn} disabled={isLoading || !!successMsg}>
            {isLoading ? (
              <>
                <Loader2 size={18} className={`animate-spin ${styles.btnSpinner}`} />
                Đang xử lý...
              </>
            ) : (
              'Đăng ký tài khoản'
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
export default RegisterCandidatePage;
