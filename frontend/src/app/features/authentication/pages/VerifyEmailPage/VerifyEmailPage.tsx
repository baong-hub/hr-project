import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../../../../core/services/auth.service';

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
      setResendSuccess(true); // Always show positive to avoid email enumeration
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '40px 32px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          <img src="/hr.png" alt="Logo" style={{ height: '36px', width: 'auto' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
            HR <span style={{ color: '#2563eb' }}>Portal</span>
          </span>
        </div>

        {status === 'loading' && (
          <div>
            <Loader2 size={48} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Đang xác thực tài khoản...
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.925rem' }}>
              Hệ thống đang kiểm tra mã token của bạn, vui lòng đợi trong giây lát.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle2 size={40} color="#059669" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>
              Xác Thực Email Thành Công!
            </h2>
            <p style={{ color: '#475569', fontSize: '0.925rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập ngay để bắt đầu tìm kiếm việc làm hoặc đăng tin tuyển dụng.
            </p>
            <Link
              to="/auth/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 600,
                textDecoration: 'none',
                boxSizing: 'border-box'
              }}
            >
              Đăng nhập ngay <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {(status === 'error' || status === 'idle') && (
          <div>
            {status === 'error' && (
              <>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <XCircle size={40} color="#dc2626" />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
                  Xác Thực Không Thành Công
                </h2>
                <p style={{ color: '#475569', fontSize: '0.925rem', marginBottom: '24px' }}>
                  {errorMessage || 'Liên kết xác thực đã hết hạn hoặc không tồn tại.'}
                </p>
              </>
            )}

            {status === 'idle' && (
              <>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <Mail size={36} color="#2563eb" />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  Xác Thực Địa Chỉ Email
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.925rem', marginBottom: '24px' }}>
                  Nhập email tài khoản của bạn để nhận liên kết xác thực mới.
                </p>
              </>
            )}

            {resendSuccess ? (
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                fontSize: '0.925rem',
                marginBottom: '20px'
              }}>
                Nếu email khớp với tài khoản trong hệ thống, chúng tôi đã gửi liên kết xác nhận mới tới hộp thư của bạn. Vui lòng kiểm tra (kể cả thư mục Spam/Rác).
              </div>
            ) : (
              <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <input
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email của bạn..."
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="submit"
                  disabled={resending}
                  style={{
                    width: '100%',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {resending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
                </button>
              </form>
            )}

            <Link to="/auth/login" style={{ fontSize: '0.9rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
              Quay lại Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
