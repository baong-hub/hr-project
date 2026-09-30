import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, QrCode, Copy, CheckCircle2, Loader2, X } from 'lucide-react';
import { subscriptionService } from '../../core/services/subscription.service';
import type { PlanDto, CheckoutResultDto } from '../../core/services/subscription.service';
import { authService } from '../../core/services/auth.service';
import { SeoHead } from '../../shared/components/SeoHead';
import styles from './PricingPage.module.scss';

const FALLBACK_PLANS: PlanDto[] = [
  {
    plan: 'FREE',
    name: 'Khởi Nghiệp (Miễn Phí)',
    displayName: 'Khởi Nghiệp (Miễn Phí)',
    priceVnd: 0,
    monthlyPriceVnd: 0,
    maxActiveJobs: 3,
    maxJobs: 3,
    cvSearchAccess: false,
    maxCvViews: 10,
    aiScoringEnabled: false,
    aiScreening: false,
    prioritySupport: false,
    features: [
      'Đăng tối đa 3 tin tuyển dụng',
      'Hiển thị cơ bản trên trang việc làm',
      'Quản lý hồ sơ ứng viên tiêu chuẩn',
      'Hỗ trợ qua email'
    ]
  },
  {
    plan: 'PRO',
    name: 'Chuyên Nghiệp (Pro)',
    displayName: 'Chuyên Nghiệp (Pro)',
    priceVnd: 1990000,
    monthlyPriceVnd: 1990000,
    maxActiveJobs: 15,
    maxJobs: 15,
    cvSearchAccess: true,
    maxCvViews: 100,
    aiScoringEnabled: true,
    aiScreening: true,
    prioritySupport: true,
    features: [
      'Đăng tối đa 15 tin tuyển dụng hoạt động',
      'Huy hiệu tin tuyển dụng Nổi Bật',
      'Tìm kiếm và xem hồ sơ ứng viên không giới hạn',
      'Xuất báo cáo tuyển dụng Excel',
      'Hỗ trợ ưu tiên qua email/chat'
    ]
  },
  {
    plan: 'BUSINESS',
    name: 'Doanh Nghiệp (Business)',
    displayName: 'Doanh Nghiệp (Business)',
    priceVnd: 4990000,
    monthlyPriceVnd: 4990000,
    maxActiveJobs: 50,
    maxJobs: 50,
    cvSearchAccess: true,
    maxCvViews: 500,
    aiScoringEnabled: true,
    aiScreening: true,
    prioritySupport: true,
    features: [
      'Đăng tối đa 50 tin tuyển dụng hoạt động',
      'AI Scoring tự động sàng lọc & xếp hạng CV',
      'Gợi ý ứng viên tài năng tự động',
      'Quản lý đa chi nhánh và phòng ban',
      'Chuyên viên tuyển dụng hỗ trợ 1:1'
    ]
  },
  {
    plan: 'ENTERPRISE',
    name: 'Tập Đoàn (Enterprise)',
    displayName: 'Tập Đoàn (Enterprise)',
    priceVnd: 0,
    monthlyPriceVnd: 9990000,
    maxActiveJobs: 9999,
    maxJobs: 9999,
    cvSearchAccess: true,
    maxCvViews: 2500,
    aiScoringEnabled: true,
    aiScreening: true,
    prioritySupport: true,
    features: [
      'Không giới hạn số lượng tin đăng tuyển',
      'Tích hợp hệ thống doanh nghiệp',
      'Cam kết hỗ trợ vận hành riêng',
      'Thiết kế giải pháp theo yêu cầu'
    ]
  }
];

const normalizePlan = (raw: any): PlanDto => {
  let planCode = 'FREE';
  if (typeof raw?.plan === 'string' && raw.plan.trim()) {
    planCode = raw.plan.toUpperCase();
  } else if (typeof raw?.plan === 'number') {
    const enumMap = ['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'];
    planCode = enumMap[raw.plan] || 'FREE';
  } else if (typeof raw?.name === 'string' && raw.name.trim()) {
    const upper = raw.name.toUpperCase();
    if (['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'].includes(upper)) {
      planCode = upper;
    }
  }

  const rawPrice = typeof raw?.priceVnd === 'number'
    ? raw.priceVnd
    : (typeof raw?.monthlyPriceVnd === 'number' ? raw.monthlyPriceVnd : 0);

  const maxJobs = raw?.maxActiveJobs ?? raw?.maxJobs ?? (
    planCode === 'ENTERPRISE' ? 9999 : planCode === 'BUSINESS' ? 50 : planCode === 'PRO' ? 15 : 3
  );

  const cvAccess = typeof raw?.cvSearchAccess === 'boolean'
    ? raw.cvSearchAccess
    : (typeof raw?.maxCvViews === 'number' ? raw.maxCvViews > 0 : planCode !== 'FREE');

  const aiEnabled = typeof raw?.aiScoringEnabled === 'boolean'
    ? raw.aiScoringEnabled
    : (typeof raw?.aiScreening === 'boolean' ? raw.aiScreening : planCode !== 'FREE');

  const priority = typeof raw?.prioritySupport === 'boolean'
    ? raw.prioritySupport
    : (planCode === 'BUSINESS' || planCode === 'ENTERPRISE');

  const feats = Array.isArray(raw?.features) && raw.features.length > 0
    ? raw.features
    : (Array.isArray(raw?.highlights) && raw.highlights.length > 0 ? raw.highlights : []);

  const planName = raw?.displayName || raw?.name || (
    planCode === 'FREE' ? 'Khởi Nghiệp (Miễn Phí)' :
    planCode === 'PRO' ? 'Chuyên Nghiệp (Pro)' :
    planCode === 'BUSINESS' ? 'Doanh Nghiệp (Business)' :
    'Tập Đoàn (Enterprise)'
  );

  return {
    plan: planCode,
    name: planName,
    displayName: planName,
    priceVnd: rawPrice,
    monthlyPriceVnd: rawPrice,
    maxActiveJobs: maxJobs,
    maxJobs: maxJobs,
    cvSearchAccess: Boolean(cvAccess),
    maxCvViews: raw?.maxCvViews ?? (cvAccess ? 100 : 0),
    aiScoringEnabled: Boolean(aiEnabled),
    aiScreening: Boolean(aiEnabled),
    prioritySupport: Boolean(priority),
    features: feats,
    highlights: feats,
  };
};

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
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setPlans(res.data.map(normalizePlan));
        } else {
          setPlans(FALLBACK_PLANS.map(normalizePlan));
        }
      } catch {
        setPlans(FALLBACK_PLANS.map(normalizePlan));
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

    const price = typeof plan.priceVnd === 'number' ? plan.priceVnd : (plan.monthlyPriceVnd ?? 0);
    if (price === 0 || plan.plan === 'FREE') {
      navigate('/jobs/create');
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
      }
    } catch {
      // Error handling
    } finally {
      setCheckoutLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (plan: PlanDto) => {
    if (plan.plan === 'ENTERPRISE') return 'Thỏa thuận';
    const price = typeof plan?.priceVnd === 'number' ? plan.priceVnd : (plan?.monthlyPriceVnd ?? 0);
    if (!price || price === 0) return '0 đ';
    const finalPrice = billingCycle === 'yearly' ? price * 0.8 : price;
    return `${Math.round(finalPrice).toLocaleString('vi-VN')} đ`;
  };

  // Helper to identify recommended plan
  const isRecommendedPlan = (planCode: string) => planCode === 'PRO';

  // Order plans predictably: FREE, PRO, BUSINESS, ENTERPRISE
  const displayPlans = [...plans].sort((a, b) => {
    const order: Record<string, number> = { FREE: 1, PRO: 2, BUSINESS: 3, ENTERPRISE: 4 };
    return (order[a.plan] || 99) - (order[b.plan] || 99);
  });

  return (
    <div className={styles.pricingPage}>
      <SeoHead
        title="Bảng Giá Dịch Vụ Tuyển Dụng | HR Portal"
        description="Bảng so sánh chi tiết các gói tuyển dụng dành cho doanh nghiệp. Minh bạch tính năng, không phát sinh chi phí ẩn."
        ogType="website"
      />

      {/* Hero */}
      <section className={styles.hero}>
        <div className="container-public">
          <span className={styles.eyebrow}>Bảng giá minh bạch</span>
          <h1 className={styles.heroTitle}>Bảng So Sánh Gói Dịch Vụ Tuyển Dụng</h1>
          <p className={styles.heroDesc}>
            Các gói dịch vụ được thiết kế theo đúng quy mô và nhu cầu tuyển dụng thực tế của doanh nghiệp, giúp bạn tối ưu chi phí và tiếp cận ứng viên nhanh chóng.
          </p>

          <div className={styles.cycleToggle}>
            <button
              type="button"
              className={`${styles.cycleBtn} ${billingCycle === 'monthly' ? styles.active : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Thanh toán theo tháng
            </button>
            <button
              type="button"
              className={`${styles.cycleBtn} ${billingCycle === 'yearly' ? styles.active : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              Thanh toán theo năm (Tiết kiệm 20%)
            </button>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className={styles.section}>
        <div className="container-public">
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th className={styles.featureColHeader}>
                      Tính năng & Quyền lợi
                    </th>
                    {displayPlans.map((p) => {
                      const isRec = isRecommendedPlan(p.plan);
                      return (
                        <th
                          key={p.plan}
                          className={`${styles.planColHeader} ${isRec ? `${styles.recommendedCol} ${styles.recommendedTopBorder}` : ''}`}
                        >
                          <div className={styles.badgeWrap}>
                            {isRec && (
                              <span className={styles.recommendedBadge}>Khuyên dùng</span>
                            )}
                          </div>
                          <div className={styles.planName}>{p.name}</div>
                          <div className={styles.planPrice}>
                            <span className="tabular-nums">{formatPrice(p)}</span>
                            {((p.priceVnd || p.monthlyPriceVnd || 0) > 0) && (
                              <span className={styles.unit}>/ {billingCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className={isRec ? styles.btnPrimary : styles.btnSecondary}
                            onClick={() => handleSelectPlan(p)}
                          >
                            {p.plan === 'ENTERPRISE'
                              ? 'Liên hệ tư vấn'
                              : (p.priceVnd || p.monthlyPriceVnd || 0) === 0
                              ? 'Bắt đầu miễn phí'
                              : 'Chọn gói này'}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {/* Category: Đăng tin & Tiếp cận */}
                  <tr className={styles.categoryRow}>
                    <td colSpan={displayPlans.length + 1}>Đăng tin & Quảng bá</td>
                  </tr>

                  <tr className={styles.dataRow}>
                    <td className={styles.featureNameCell}>
                      Tin tuyển dụng hoạt động đồng thời
                      <span className={styles.featureSub}>Số lượng tin đăng có thể nhận ứng tuyển cùng lúc</span>
                    </td>
                    {displayPlans.map((p) => (
                      <td
                        key={p.plan}
                        className={`${styles.valCell} ${isRecommendedPlan(p.plan) ? styles.recommendedCol : ''}`}
                      >
                        <span className="tabular-nums">
                          {p.maxActiveJobs >= 999 ? 'Không giới hạn' : `${p.maxActiveJobs} tin`}
                        </span>
                      </td>
                    ))}
                  </tr>

                  <tr className={styles.dataRow}>
                    <td className={styles.featureNameCell}>
                      Huy hiệu tin tuyển dụng Nổi bật
                      <span className={styles.featureSub}>Ưu tiên vị trí hiển thị và thu hút ứng viên</span>
                    </td>
                    {displayPlans.map((p) => {
                      const hasBadge = p.plan !== 'FREE';
                      return (
                        <td
                          key={p.plan}
                          className={`${styles.valCell} ${isRecommendedPlan(p.plan) ? styles.recommendedCol : ''}`}
                        >
                          {hasBadge ? (
                            <Check size={18} className={styles.iconCheck} />
                          ) : (
                            <span className={styles.dash}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Category: Quản lý hồ sơ & Dữ liệu */}
                  <tr className={styles.categoryRow}>
                    <td colSpan={displayPlans.length + 1}>Hồ sơ ứng viên & Dữ liệu</td>
                  </tr>

                  <tr className={styles.dataRow}>
                    <td className={styles.featureNameCell}>
                      Tìm kiếm và xem hồ sơ ứng viên
                      <span className={styles.featureSub}>Tra cứu kho CV ứng viên đang tìm việc</span>
                    </td>
                    {displayPlans.map((p) => (
                      <td
                        key={p.plan}
                        className={`${styles.valCell} ${isRecommendedPlan(p.plan) ? styles.recommendedCol : ''}`}
                      >
                        {p.cvSearchAccess ? (
                          <Check size={18} className={styles.iconCheck} />
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className={styles.dataRow}>
                    <td className={styles.featureNameCell}>
                      Quản lý ứng viên theo Pipeline
                      <span className={styles.featureSub}>Theo dõi ứng viên qua các giai đoạn phỏng vấn</span>
                    </td>
                    {displayPlans.map((p) => (
                      <td
                        key={p.plan}
                        className={`${styles.valCell} ${isRecommendedPlan(p.plan) ? styles.recommendedCol : ''}`}
                      >
                        <Check size={18} className={styles.iconCheck} />
                      </td>
                    ))}
                  </tr>

                  <tr className={styles.dataRow}>
                    <td className={styles.featureNameCell}>
                      Xuất báo cáo ứng viên (Excel)
                      <span className={styles.featureSub}>Trích xuất dữ liệu danh sách ứng viên nhanh chóng</span>
                    </td>
                    {displayPlans.map((p) => {
                      const hasExport = p.plan !== 'FREE';
                      return (
                        <td
                          key={p.plan}
                          className={`${styles.valCell} ${isRecommendedPlan(p.plan) ? styles.recommendedCol : ''}`}
                        >
                          {hasExport ? (
                            <Check size={18} className={styles.iconCheck} />
                          ) : (
                            <span className={styles.dash}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Category: Trí tuệ nhân tạo (AI) */}
                  <tr className={styles.categoryRow}>
                    <td colSpan={displayPlans.length + 1}>Công nghệ & Trí tuệ nhân tạo (AI)</td>
                  </tr>

                  <tr className={styles.dataRow}>
                    <td className={styles.featureNameCell}>
                      AI Match & Chấm điểm CV tự động
                      <span className={styles.featureSub}>Tự động so khớp kỹ năng CV với yêu cầu công việc</span>
                    </td>
                    {displayPlans.map((p) => (
                      <td
                        key={p.plan}
                        className={`${styles.valCell} ${isRecommendedPlan(p.plan) ? styles.recommendedCol : ''}`}
                      >
                        {p.aiScoringEnabled ? (
                          <Check size={18} className={styles.iconCheck} />
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Category: Hỗ trợ & Vận hành */}
                  <tr className={styles.categoryRow}>
                    <td colSpan={displayPlans.length + 1}>Hỗ trợ & Vận hành</td>
                  </tr>

                  <tr className={styles.dataRow}>
                    <td className={styles.featureNameCell}>
                      Kênh và mức độ hỗ trợ
                      <span className={styles.featureSub}>Thời gian và phương thức phản hồi</span>
                    </td>
                    {displayPlans.map((p) => {
                      let supportText = 'Email tiêu chuẩn';
                      if (p.plan === 'PRO') supportText = 'Email & Chat ưu tiên';
                      else if (p.plan === 'BUSINESS') supportText = 'Chuyên viên tư vấn 1:1';
                      else if (p.plan === 'ENTERPRISE') supportText = 'Hỗ trợ riêng 24/7 & SLA';

                      return (
                        <td
                          key={p.plan}
                          className={`${styles.valCell} ${isRecommendedPlan(p.plan) ? `${styles.recommendedCol} ${styles.recommendedBottomBorder}` : ''}`}
                        >
                          {supportText}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.tableNote}>
              * Tất cả bảng giá niêm yết chưa bao gồm thuế GTGT (VAT) theo quy định hiện hành. Để yêu cầu xuất hóa đơn điện tử hoặc tư vấn giải pháp tích hợp riêng cho tập đoàn, vui lòng liên hệ bộ phận kinh doanh.
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {checkoutModalOpen && selectedPlan && (
        <div className={styles.modalOverlay} onClick={() => setCheckoutModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Thanh toán: {selectedPlan.name}</div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setCheckoutModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {checkoutLoading ? (
              <div className={styles.modalLoading}>
                <Loader2 size={32} className={styles.spinner} />
                <p>Đang tạo thông tin giao dịch VietQR...</p>
              </div>
            ) : checkoutResult ? (
              <div className={styles.qrContainer}>
                <QrCode size={32} />
                <p>Quét mã VietQR để thanh toán</p>
                {checkoutResult.qrCodeUrl && (
                  <img src={checkoutResult.qrCodeUrl} alt="VietQR" />
                )}
                <div className={styles.transferContentText}>
                  Nội dung chuyển khoản: <strong>{checkoutResult.orderCode}</strong>
                </div>
                <button
                  type="button"
                  className={`${styles.btnSecondary} ${styles.copyBtn}`}
                  onClick={() => copyToClipboard(checkoutResult.orderCode)}
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {copied ? 'Đã sao chép' : 'Sao chép nội dung'}
                </button>
              </div>
            ) : null}

            <div className={styles.modalActions}>
              <button type="button" className={styles.closeBtn} onClick={() => setCheckoutModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
