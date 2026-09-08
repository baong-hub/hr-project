import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-page, #f8fafc)',
          padding: '24px',
          fontFamily: 'var(--font-family, system-ui, sans-serif)',
          color: 'var(--color-text-primary, #1e293b)'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: 'var(--color-bg-card, #ffffff)',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--color-border-default, #e2e8f0)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              margin: '0 0 8px 0',
              color: 'var(--color-text-primary, #0f172a)'
            }}>
              Đã có lỗi xảy ra khi hiển thị trang
            </h2>

            <p style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary, #64748b)',
              margin: '0 0 24px 0',
              lineHeight: 1.6
            }}>
              Hệ thống đã chặn lỗi hiển thị để tránh màn hình bị trắng. Bạn có thể tải lại trang hoặc quay về trang chủ.
            </p>

            {this.state.error && (
              <div style={{
                textAlign: 'left',
                backgroundColor: 'var(--color-bg-subtle, #f1f5f9)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#dc2626',
                overflowX: 'auto',
                border: '1px solid var(--color-border-subtle, #cbd5e1)'
              }}>
                <strong>Chi tiết lỗi:</strong> {this.state.error.message}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: 'var(--color-brand-primary, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
              >
                <RefreshCw size={16} /> Tải lại trang
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-primary, #1e293b)',
                  border: '1px solid var(--color-border-default, #cbd5e1)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <Home size={16} /> Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
