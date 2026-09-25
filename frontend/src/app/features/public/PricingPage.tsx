import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, X, Crown, 
  QrCode, Copy, CheckCircle2, Loader2 
} from 'lucide-react';
import { subscriptionService } from '../../core/services/subscription.service';
import type { PlanDto, CheckoutResultDto } from '../../core/services/subscription.service';
import { authService } from '../../core/services/auth.service';
import { SeoHead } from '../../shared/components/SeoHead';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResultDto | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await subscriptionService.getPlans();
        if (res.success && Array.isArray(res.data)) {
          setPlans(res.data);
        } else {
          // Fallback static plans
          setPlans([
            {
              plan: 'FREE',
              name: 'Gói Miễn Phí (Starter)',
              priceVnd: 0,
              maxActiveJobs: 3,
              cvSearchAccess: false,
              aiScoringEnabled: false,
              prioritySupport: false,
              features: ['Đăng tối đa 3 tin tuyển dụng', 'Hiển thị cơ bản trên trang việc làm', 'Quản lý hồ sơ ứng viên tiêu chuẩn', 'Hỗ trợ qua email trong vòng 48h']
            },
            {
              plan: 'PRO',
              name: 'Gói Chuyên Nghiệp (Pro)',
              priceVnd: 990000,
              maxActiveJobs: 15,
              cvSearchAccess: true,
              aiScoringEnabled: false,
              prioritySupport: false,
              features: ['Đăng tối đa 15 tin tuyển dụng hoạt động', 'Huy hiệu tin tuyển dụng Nổi Bật', 'Tìm kiếm và xem hồ sơ ứng viên không giới hạn', 'Xuất báo cáo tuyển dụng Excel/PDF', 'Hỗ trợ ưu tiên qua email/chat']
            },
            {
              plan: 'BUSINESS',
              name: 'Gói Doanh Nghiệp (Business)',
              priceVnd: 2490000,
              maxActiveJobs: 50,
              cvSearchAccess: true,
              aiScoringEnabled: true,
              prioritySupport: true,
              features: ['Đăng tối đa 50 tin tuyển dụng hoạt động', 'AI Scoring tự động sàng lọc & xếp hạng CV', 'Gợi ý ứng viên tài năng tự động bằng AI', 'Quản lý đa chi nhánh và phòng ban', 'Chuyên viên tuyển dụng hỗ trợ 1:1']
            },
            {
              plan: 'ENTERPRISE',
              name: 'Gói Tập Đoàn (Enterprise)',
              priceVnd: 0,
              maxActiveJobs: 999,
              cvSearchAccess: true,
              aiScoringEnabled: true,
              prioritySupport: true,
              features: ['Không giới hạn số lượng tin đăng tuyển', 'Tích hợp API hệ thống ATS / HRIS doanh nghiệp', 'Môi trường máy chủ riêng & cam kết SLA 99.9%', 'Đào tạo nội bộ & thiết kế thương hiệu riêng']
            }
          ]);
        }
      } catch {
        // Handled via fallback
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = async (plan: PlanDto) => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/pricing');
      return;
    }

    if (plan.plan === 'ENTERPRISE') {
      navigate('/contact?topic=SALES');
      return;
    }

    setSelectedPlan(plan);
    setCheckoutModalOpen(true);
    setCheckoutLoading(true);

    try {
      const res = await subscriptionService.createCheckout({
        plan: plan.plan,
        paymentMethod: 'VIETQR'
      });
      if (res.success && res.data) {
        setCheckoutResult(res.data);
      } else {
        // Mock result for offline or local preview
        setCheckoutResult({
          checkoutUrl: '',
          orderCode: `SUB-${Date.now().toString().slice(-6)}`,
          paymentMethod: 'VIETQR',
          amount: billingCycle === 'yearly' ? plan.priceVnd * 12 * 0.8 : plan.priceVnd,
          plan: plan.plan,
          bankAccount: '190368688888',
          bankName: 'Techcombank (Ngân hàng TMCP Kỹ Thương)',
          accountName: 'CONG TY CP CONG NGHE HR PORTAL'
        });
      }
    } catch {
      setCheckoutResult({
        checkoutUrl: '',
        orderCode: `SUB-${Date.now().toString().slice(-6)}`,
        paymentMethod: 'VIETQR',
        amount: billingCycle === 'yearly' ? plan.priceVnd * 12 * 0.8 : plan.priceVnd,
        plan: plan.plan,
        bankAccount: '190368688888',
        bankName: 'Techcombank (Ngân hàng TMCP Kỹ Thương)',
        accountName: 'CONG TY CP CONG NGHE HR PORTAL'
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <SeoHead
        title="Bảng Giá Dịch Vụ Tuyển Dụng & Đăng Tin | HR Portal"
        description="Bảng giá các gói dịch vụ tuyển dụng HR Portal: Đăng tin không giới hạn, AI chấm điểm CV, săn ứng viên tài năng Talent Pool & hỗ trợ chuyên sâu 24/7."
        ogType="website"
      />

      {/* Header */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: '#ffffff',
        padding: '70px 20px 80px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(147, 197, 253, 0.3)',
            borderRadius: '9999px',
            padding: '6px 16px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            color: '#93c5fd'
          }}>
            <Crown size={16} /> Bảng Giá Gói Dịch Vụ Nhà Tuyển Dụng
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Lựa Chọn Gói Dịch Vụ Tuyển Dụng Phù Hợp
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            Tối ưu hóa ngân sách và tăng tốc độ tìm kiếm ứng viên tài năng với các gói dịch vụ linh hoạt từ HR Portal.
          </p>

          {/* Billing cycle toggle */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '4px',
            borderRadius: '12px',
            marginTop: '32px',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                backgroundColor: billingCycle === 'monthly' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Theo tháng
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                backgroundColor: billingCycle === 'yearly' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Theo năm <span style={{ backgroundColor: '#22c55e', color: '#052e16', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>Tiết kiệm 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section style={{ padding: '60px 20px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '24px',
          alignItems: 'stretch'
        }}>
          {plans.map((p) => {
            const isFeatured = p.plan === 'BUSINESS';
            const price = billingCycle === 'yearly' && p.priceVnd > 0 
              ? Math.round(p.priceVnd * 0.8) 
              : p.priceVnd;

            return (
              <div
                key={p.plan}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  padding: '32px 24px',
                  border: isFeatured ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  boxShadow: isFeatured ? '0 12px 30px -5px rgba(37, 99, 235, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {isFeatured && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    letterSpacing: '0.5px'
                  }}>
                    PHỔ BIẾN NHẤT
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    {p.name.split('(')[0]}
                  </h3>
                  <div style={{ minHeight: '60px', marginBottom: '20px' }}>
                    {p.priceVnd > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>
                          {price.toLocaleString('vi-VN')}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>VNĐ / tháng</span>
                      </div>
                    ) : p.plan === 'FREE' ? (
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>
                        Miễn phí
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>Thương lượng</div>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Theo quy mô doanh nghiệp</span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    marginBottom: '24px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#334155'
                  }}>
                    Đăng tối đa {p.maxActiveJobs === 999 ? 'Không giới hạn' : `${p.maxActiveJobs} tin`} hoạt động
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {p.features?.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#475569' }}>
                        <Check size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(p)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isFeatured ? 'none' : '1px solid #cbd5e1',
                    backgroundColor: isFeatured ? '#2563eb' : '#ffffff',
                    color: isFeatured ? '#ffffff' : '#1e293b',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isFeatured) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#94a3b8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isFeatured) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }
                  }}
                >
                  {p.plan === 'FREE' ? 'Sử dụng ngay' : p.plan === 'ENTERPRISE' ? 'Liên hệ báo giá' : 'Nâng cấp gói này'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section style={{ backgroundColor: '#ffffff', padding: '70px 20px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', textAlign: 'center', marginBottom: '40px' }}>
            So Sánh Chi Tiết Quyền Lợi Các Gói
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontSize: '1rem', color: '#1e293b' }}>Tính năng</th>
                  <th style={{ padding: '16px', fontSize: '1rem', color: '#64748b', textAlign: 'center' }}>FREE</th>
                  <th style={{ padding: '16px', fontSize: '1rem', color: '#2563eb', textAlign: 'center' }}>PRO</th>
                  <th style={{ padding: '16px', fontSize: '1rem', color: '#7c3aed', textAlign: 'center' }}>BUSINESS</th>
                  <th style={{ padding: '16px', fontSize: '1rem', color: '#0f766e', textAlign: 'center' }}>ENTERPRISE</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>Số tin tuyển dụng đồng thời</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>3 tin</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>15 tin</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>50 tin</td>
                  <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#0f766e' }}>Không giới hạn</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>Tìm kiếm & mở khóa hồ sơ CV</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><X size={20} color="#cbd5e1" style={{ margin: '0 auto' }} /></td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><Check size={20} color="#059669" style={{ margin: '0 auto' }} /></td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><Check size={20} color="#059669" style={{ margin: '0 auto' }} /></td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><Check size={20} color="#059669" style={{ margin: '0 auto' }} /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>Chấm điểm & xếp hạng AI (AI Scoring)</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><X size={20} color="#cbd5e1" style={{ margin: '0 auto' }} /></td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><X size={20} color="#cbd5e1" style={{ margin: '0 auto' }} /></td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><Check size={20} color="#059669" style={{ margin: '0 auto' }} /></td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><Check size={20} color="#059669" style={{ margin: '0 auto' }} /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>Huy hiệu tin tuyển dụng nổi bật</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><X size={20} color="#cbd5e1" style={{ margin: '0 auto' }} /></td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><Check size={20} color="#059669" style={{ margin: '0 auto' }} /></td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><Check size={20} color="#059669" style={{ margin: '0 auto' }} /></td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><Check size={20} color="#059669" style={{ margin: '0 auto' }} /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>Hỗ trợ kỹ thuật</td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>Email 48h</td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>Email ưu tiên 12h</td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>Hotline & Email 2h</td>
                  <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#0f766e' }}>Chuyên viên riêng 24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Checkout / Payment Modal */}
      {checkoutModalOpen && selectedPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b' }}>
                Thanh Toán Gói {selectedPlan.name.split('(')[0]}
              </h3>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={24} />
              </button>
            </div>

            {checkoutLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Loader2 size={36} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#64748b' }}>Đang khởi tạo cổng thanh toán bảo mật...</p>
              </div>
            ) : checkoutResult ? (
              <div>
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Mã giao dịch:</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{checkoutResult.orderCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Số tiền thanh toán:</span>
                    <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.15rem' }}>
                      {checkoutResult.amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Hình thức:</span>
                    <span style={{ fontWeight: 600, color: '#059669' }}>VietQR / Chuyển khoản ngân hàng</span>
                  </div>
                </div>

                {/* VietQR Quick Display */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '180px',
                    height: '180px',
                    margin: '0 auto 12px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    padding: '8px'
                  }}>
                    <QrCode size={130} color="#1e293b" />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Quét mã VietQR</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#64748b' }}>
                    Sử dụng ứng dụng ngân hàng bất kỳ để quét mã và chuyển tiền tự động
                  </p>
                </div>

                {/* Bank Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ngân hàng</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Techcombank</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Số tài khoản</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2563eb' }}>190368688888</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard('190368688888')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                    >
                      <Copy size={16} /> Sao chép
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nội dung chuyển khoản</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{checkoutResult.orderCode}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(checkoutResult.orderCode)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                    >
                      <Copy size={16} /> Sao chép
                    </button>
                  </div>
                </div>

                {copied && (
                  <div style={{ textAlign: 'center', color: '#059669', fontSize: '0.875rem', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Đã sao chép vào bộ nhớ tạm
                  </div>
                )}

                <button
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    alert('Hệ thống đã ghi nhận giao dịch. Gói cước của bạn sẽ được kích hoạt tự động trong vòng 1-3 phút sau khi ngân hàng xử lý.');
                    navigate('/employer/jobs');
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tôi đã chuyển khoản xong
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
};
