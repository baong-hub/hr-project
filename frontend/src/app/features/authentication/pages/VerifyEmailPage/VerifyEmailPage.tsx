import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../../../../core/services/auth.service';
import styles from '../LoginPage/LoginPage.module.scss';
import { FormField } from '../../../../shared/components/form-field/FormField';
import logoImg from '@/assets/logo.png';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(token ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('idle');
      return;
    }

    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        if (res.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(res.error?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await authService.resendVerificationEmail(resendEmail);
      setResendSuccess(true);
    } catch {
      setResendSuccess(true);
    } finally {
      setResending(false);
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

        {status === 'loading' && (
          <div>
            <div className={`${styles.statusIconCircle} ${styles.statusIconInfo}`}>
              <Loader2 size={36} className="animate-spin" />
            </div>
            <h2 className={styles.title}>
              Đang xác thực tài khoản...
            </h2>
            <p className={styles.subtitle}>
              Hệ thống đang kiểm tra mã token của bạn, vui lòng đợi trong giây lát.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className={`${styles.statusIconCircle} ${styles.statusIconSuccess}`}>
              <CheckCircle2 size={40} />
            </div>
            <h2 className={`${styles.title} ${styles.successTitle}`}>
              Xác Thực Email Thành Công!
            </h2>
            <p className={styles.subtitle}>
              Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập ngay để bắt đầu sử dụng đầy đủ tính năng của HR Portal.
            </p>
            <Link
              to="/auth/login"
              className={styles.submitBtn}
            >
              <span>Đăng nhập ngay</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {(status === 'error' || status === 'idle') && (
          <div>
            {status === 'error' && (
              <>
                <div className={`${styles.statusIconCircle} ${styles.statusIconDanger}`}>
                  <XCircle size={40} />
                </div>
                <h2 className={`${styles.title} ${styles.dangerTitle}`}>
                  Xác Thực Không Thành Công
                </h2>
                <p className={styles.subtitle}>
                  {errorMessage || 'Liên kết xác thực đã hết hạn hoặc không tồn tại.'}
                </p>
              </>
            )}

            {status === 'idle' && (
              <>
                <div className={`${styles.statusIconCircle} ${styles.statusIconInfo}`}>
                  <Mail size={36} />
                </div>
                <h2 className={styles.title}>
                  Xác Thực Địa Chỉ Email
                </h2>
                <p className={styles.subtitle}>
                  Nhập địa chỉ email của bạn để nhận liên kết xác thực mới.
                </p>
              </>
            )}

            {resendSuccess ? (
              <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                <span>
                  Nếu email khớp với tài khoản trong hệ thống, chúng tôi đã gửi liên kết xác nhận mới tới hộp thư của bạn. Vui lòng kiểm tra (kể cả thư mục Spam/Rác).
                </span>
              </div>
            ) : (
              <form onSubmit={handleResend} className={styles.resendForm}>
                <FormField
                  label="Email nhận xác thực"
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email của bạn..."
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={resending}
                  className={styles.submitBtn}
                >
                  {resending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
                </button>
              </form>
            )}

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
export default VerifyEmailPage;
