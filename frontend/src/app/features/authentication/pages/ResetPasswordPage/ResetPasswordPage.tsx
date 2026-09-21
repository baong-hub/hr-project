import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../../../../core/services/auth.service';

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
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <img src="/hr.png" alt="Logo" style={{ height: '36px', width: 'auto' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
            HR <span style={{ color: '#2563eb' }}>Portal</span>
          </span>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
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
              Đặt Lại Mật Khẩu Thành Công!
            </h2>
            <p style={{ color: '#475569', fontSize: '0.925rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Mật khẩu mới của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu mới này để đăng nhập vào hệ thống.
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
        ) : (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px', textAlign: 'center' }}>
              Thiết Lập Mật Khẩu Mới
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
              {email ? `Dành cho tài khoản: ${email}` : 'Nhập mật khẩu mới của bạn'}
            </p>

            {errorMessage && (
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.875rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Xác nhận mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '13px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Lưu mật khẩu mới'
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link to="/auth/login" style={{ fontSize: '0.9rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                Quay lại Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
