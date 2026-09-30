import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Ban,
  RefreshCw,
  Send,
  Building,
  DollarSign,
  MapPin,
  MessageCircle,
  Radio
} from 'lucide-react';
import {
  moderationService,
  type FraudModerationDashboardData,
  type ZaloZnsStatusData,
  type ZnsTestSendResult
} from '../../../core/services/moderation.service';
import { toast } from '../../../core/services/toast.service';
import { SeoHead } from '../../../shared/components/SeoHead';
import styles from './FraudModerationPage.module.scss';

export const FraudModerationPage: React.FC = () => {
  const [data, setData] = useState<FraudModerationDashboardData | null>(null);
  const [zaloStatus, setZaloStatus] = useState<ZaloZnsStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'JOBS' | 'REPORTS' | 'ZALO'>('JOBS');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // ZNS Test Form State
  const [testPhone, setTestPhone] = useState('0987654321');
  const [selectedTemplate, setSelectedTemplate] = useState('ZNS_INTERVIEW_INVITE_V1');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<ZnsTestSendResult | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, zaloRes] = await Promise.all([
        moderationService.getDashboard(),
        moderationService.getZaloStatus().catch(() => null)
      ]);
      setData(dashRes);
      if (zaloRes) setZaloStatus(zaloRes);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu kiểm duyệt và phòng chống gian lận.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleModerateJob = async (jobId: number, action: 'APPROVE' | 'REJECT_LOCK') => {
    const actionText = action === 'APPROVE' ? 'Phê duyệt an toàn' : 'Khoá tin vi phạm lừa đảo';
    if (!window.confirm(`Xác nhận ${actionText} cho tin tuyển dụng ID #${jobId}?`)) {
      return;
    }

    setActionLoadingId(jobId);
    try {
      await moderationService.moderateJob(
        jobId,
        action,
        action === 'APPROVE'
          ? 'Đã kiểm duyệt bởi Quản trị viên: Nội dung đạt tiêu chuẩn.'
          : 'Đã khoá tự động do vi phạm chính sách kiểm duyệt gian lận.'
      );
      toast.success(`Đã thực hiện: ${actionText}`);
      fetchDashboardData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi kiểm duyệt tin.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolveReport = async (reportId: number, hideTarget: boolean) => {
    if (!window.confirm('Xác nhận xử lý báo cáo vi phạm này?')) return;
    try {
      await moderationService.resolveReport(reportId, 'Đã được Quản trị viên xử lý và ghi nhận.', hideTarget);
      toast.success('Báo cáo đã được xử lý.');
      fetchDashboardData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xử lý báo cáo.');
    }
  };

  const handleSendTestZns = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error('Vui lòng nhập số điện thoại.');
      return;
    }

    setTestSending(true);
    setTestResult(null);
    try {
      const res = await moderationService.testSendZns(testPhone.trim(), selectedTemplate);
      setTestResult(res);
      if (res.success) {
        toast.success(`Đã gửi ZNS thành công qua kênh ${res.mode}!`);
      } else {
        toast.error(`Gửi ZNS thất bại: ${res.errorMessage}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi kết nối dịch vụ Zalo ZNS.');
    } finally {
      setTestSending(false);
    }
  };

  const getRiskBadge = (score: number = 0) => {
    if (score >= 70) {
      return {
        className: styles.riskBadgeHigh,
        text: `Nguy cơ lừa đảo cao (${score}/100)`
      };
    }
    if (score >= 35) {
      return {
        className: styles.riskBadgeMedium,
        text: `Cần xem xét (${score}/100)`
      };
    }
    return {
      className: styles.riskBadgeLow,
      text: `An toàn (${score}/100)`
    };
  };

  const safetyPercentage = data?.totalJobsCount
    ? Math.round((data.cleanJobsCount / data.totalJobsCount) * 100)
    : 100;

  return (
    <div className={styles.pageContainer}>
      <SeoHead
        title="Trung Tâm Kiểm Duyệt & Phòng Chống Gian Lận | HR Portal"
        description="Quản trị rà soát tin tuyển dụng lừa đảo, cọc tiền, nhiệm vụ bất thường và kiểm soát thông báo Zalo ZNS."
        ogType="website"
      />

      {/* Top Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <div className={styles.bannerInfo}>
            <div className={styles.suiteBadge}>
              <ShieldAlert size={14} />
              HR Portal Moderation Suite
            </div>
            <h1 className={styles.bannerTitle}>
              Trung Tâm Kiểm Duyệt & Phòng Chống Gian Lận
            </h1>
            <p className={styles.bannerDesc}>
              Hệ thống AI & Rule-based tự động rà quét từ khoá lừa đảo, cọc tiền, nhiệm vụ Telegram và quản lý kênh thông báo Zalo ZNS.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className={styles.refreshBtn}
          >
            <RefreshCw size={14} className={loading ? styles.spinning : ''} />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Flagged Jobs */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={`${styles.kpiLabel} ${styles.labelRose}`}>
              Tin có dấu hiệu rủi ro
            </span>
            <div className={`${styles.kpiIconWrap} ${styles.iconWrapRose}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            {data?.flaggedRiskJobsCount || 0}
          </div>
          <p className={styles.kpiSub}>
            Tin tuyển dụng có điểm rủi ro ≥ 40
          </p>
        </div>

        {/* Card 2: Safety Rate */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={`${styles.kpiLabel} ${styles.labelEmerald}`}>
              Tỉ lệ an toàn toàn sàn
            </span>
            <div className={`${styles.kpiIconWrap} ${styles.iconWrapEmerald}`}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            {safetyPercentage}%
          </div>
          <p className={styles.kpiSub}>
            {data?.cleanJobsCount || 0} / {data?.totalJobsCount || 0} tin đạt chuẩn sạch
          </p>
        </div>

        {/* Card 3: Pending Reports */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={`${styles.kpiLabel} ${styles.labelAmber}`}>
              Báo cáo vi phạm chờ xử lý
            </span>
            <div className={`${styles.kpiIconWrap} ${styles.iconWrapAmber}`}>
              <Flag size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            {data?.pendingViolationReportsCount || 0}
          </div>
          <p className={styles.kpiSub}>
            Ứng viên gửi tố cáo trực tiếp
          </p>
        </div>

        {/* Card 4: Zalo OA Integration */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={`${styles.kpiLabel} ${styles.labelBlue}`}>
              Zalo ZNS Service
            </span>
            <div className={`${styles.kpiIconWrap} ${styles.iconWrapBlue}`}>
              <Radio size={18} />
            </div>
          </div>
          <div className={styles.kpiValueStatus}>
            <span className={styles.pulseDot} />
            {zaloStatus?.isSimulationMode ? 'Sandbox Simulator' : 'Live Production'}
          </div>
          <p className={styles.kpiSub}>
            OA ID: {zaloStatus?.oaId || '184920481029148'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          onClick={() => setActiveTab('JOBS')}
          className={`${styles.tabBtn} ${activeTab === 'JOBS' ? styles.tabBtnActive : ''}`}
        >
          <AlertTriangle size={16} />
          Tin Tuyển Dụng Nghi Vấn ({data?.flaggedJobs?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REPORTS')}
          className={`${styles.tabBtn} ${activeTab === 'REPORTS' ? styles.tabBtnActive : ''}`}
        >
          <Flag size={16} />
          Báo Cáo Tố Cáo ({data?.recentViolationReports?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ZALO')}
          className={`${styles.tabBtn} ${activeTab === 'ZALO' ? styles.tabBtnActive : ''}`}
        >
          <MessageCircle size={16} />
          Tích Hợp Zalo OA & ZNS
        </button>
      </div>

      {/* Tab 1: Flagged Jobs */}
      {activeTab === 'JOBS' && (
        <div className={styles.jobsContainer}>
          {data?.flaggedJobs && data.flaggedJobs.length > 0 ? (
            data.flaggedJobs.map((job) => {
              const badge = getRiskBadge(job.riskScore);
              const flags = job.fraudWarningFlags
                ? job.fraudWarningFlags.split(',').map((f) => f.trim())
                : [];

              return (
                <div key={job.id} className={styles.jobCard}>
                  <div className={styles.jobCardLayout}>
                    <div className={styles.jobMain}>
                      <div className={styles.jobBadges}>
                        <span className={`${styles.riskBadge} ${badge.className}`}>
                          {badge.text}
                        </span>
                        <span className={styles.jobMetaText}>
                          ID: #{job.id} • Đăng ngày {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className={styles.statusPill}>
                          Trạng thái: {job.status}
                        </span>
                      </div>

                      <h3 className={styles.jobTitle}>
                        {job.title}
                      </h3>

                      <div className={styles.jobMetaRow}>
                        <span className={styles.metaItem}>
                          <Building size={14} className={styles.buildingIcon} />
                          {job.companyName}
                        </span>
                        <span className={styles.metaItem}>
                          <MapPin size={14} />
                          {job.city}
                        </span>
                        {(job.salaryFrom || job.salaryTo) && (
                          <span className={`${styles.metaItem} ${styles.salaryHighlight}`}>
                            <DollarSign size={14} />
                            {job.salaryFrom?.toLocaleString('vi-VN')} - {job.salaryTo?.toLocaleString('vi-VN')} VND
                          </span>
                        )}
                      </div>

                      {/* Detected Triggers */}
                      {flags.length > 0 && (
                        <div className={styles.triggerRow}>
                          <span className={styles.triggerLabel}>
                            Cụm từ vi phạm phát hiện:
                          </span>
                          {flags.map((flag, idx) => (
                            <span key={idx} className={styles.triggerPill}>
                              ⚠️ {flag}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className={styles.jobDescription}>
                        {job.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className={styles.jobActions}>
                      <button
                        type="button"
                        onClick={() => handleModerateJob(job.id, 'APPROVE')}
                        disabled={actionLoadingId === job.id}
                        className={styles.btnApprove}
                      >
                        <CheckCircle2 size={14} />
                        Phê duyệt an toàn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModerateJob(job.id, 'REJECT_LOCK')}
                        disabled={actionLoadingId === job.id}
                        className={styles.btnReject}
                      >
                        <Ban size={14} />
                        Khoá tin vi phạm
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <ShieldCheck className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>
                Không có tin tuyển dụng nào có dấu hiệu rủi ro!
              </h3>
              <p className={styles.emptySubtitle}>
                Tất cả tin tuyển dụng đang lưu hành đều vượt qua bộ rà soát tự động.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Violation Reports */}
      {activeTab === 'REPORTS' && (
        <div className={styles.tableCard}>
          {data?.recentViolationReports && data.recentViolationReports.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.reportsTable}>
                <thead>
                  <tr>
                    <th>Mã & Ngày gửi</th>
                    <th>Người báo cáo</th>
                    <th>Mục tiêu tố cáo</th>
                    <th>Lý do & Nội dung</th>
                    <th>Trạng thái</th>
                    <th className={styles.thRight}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentViolationReports.map((report) => (
                    <tr key={report.id}>
                      <td className={styles.tdNowrap}>
                        <div className={styles.reportIdCol}>#{report.id}</div>
                        <div className={styles.reportDate}>
                          {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td>
                        <div className={styles.reporterName}>
                          {report.reporterName}
                        </div>
                      </td>
                      <td>
                        <div className={styles.targetTitle}>
                          {report.targetTitle}
                        </div>
                      </td>
                      <td className={styles.reasonCell}>
                        <div className={styles.reasonTitle}>
                          {report.reason}
                        </div>
                        {report.description && (
                          <div className={styles.reasonDesc}>
                            {report.description}
                          </div>
                        )}
                      </td>
                      <td className={styles.tdNowrap}>
                        <span
                          className={
                            report.status === 'RESOLVED'
                              ? styles.statusTagResolved
                              : styles.statusTagPending
                          }
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className={styles.tdNowrap}>
                        <div className={styles.tableActions}>
                          {report.status !== 'RESOLVED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleResolveReport(report.id, false)}
                                className={styles.btnCheckReport}
                              >
                                Đã kiểm tra
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResolveReport(report.id, true)}
                                className={styles.btnLockTarget}
                              >
                                Khoá mục vi phạm
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Flag className={`${styles.emptyIcon} ${styles.flagIcon}`} />
              <h3 className={styles.emptyTitle}>
                Chưa có báo cáo vi phạm nào từ người dùng.
              </h3>
              <p className={styles.emptySubtitle}>
                Hệ thống tiếp nhận phản hồi và tố cáo trực tiếp của ứng viên tại trang chi tiết công việc.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Zalo OA & ZNS Simulator */}
      {activeTab === 'ZALO' && (
        <div className={styles.zaloLayout}>
          {/* Column 1: Template Catalog */}
          <div className={styles.zaloSectionCard}>
            <div className={styles.zaloHeaderRow}>
              <div>
                <h3 className={styles.zaloTitle}>
                  Mẫu Thông Báo Zalo Notification Service (ZNS)
                </h3>
                <p className={styles.zaloSubtitle}>
                  Các mẫu ZNS đã đăng ký và tích hợp tự động theo sự kiện tuyển dụng.
                </p>
              </div>
              <span className={styles.activeBadge}>
                {zaloStatus?.activeTemplatesCount ?? zaloStatus?.availableTemplates?.length ?? 3} Mẫu đang hoạt động
              </span>
            </div>

            <div className={styles.templatesList}>
              {zaloStatus?.availableTemplates?.map((tmpl) => (
                <div key={tmpl.templateId} className={styles.templateItem}>
                  <div className={styles.templateItemHeader}>
                    <span className={styles.templateItemName}>
                      {tmpl.templateName}
                    </span>
                    <span className={styles.templateItemCode}>
                      {tmpl.templateId}
                    </span>
                  </div>
                  <p className={styles.templateItemDesc}>
                    {tmpl.description}
                  </p>
                  <div className={styles.paramsRow}>
                    <span className={styles.paramsLabel}>Tham số:</span>
                    {tmpl.requiredParams.map((p) => (
                      <span key={p} className={styles.paramPill}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Live Simulator Test Form */}
          <div className={styles.zaloSectionCard}>
            <div className={styles.testFormTitle}>
              <Send size={16} className={styles.sendIcon} />
              Test Gửi ZNS Qua API
            </div>

            <form onSubmit={handleSendTestZns}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Số điện thoại nhận tin
                </label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="VD: 0912345678"
                  className={styles.fieldInput}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Chọn mẫu thông báo
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className={styles.fieldSelect}
                >
                  {zaloStatus?.availableTemplates && zaloStatus.availableTemplates.length > 0 ? (
                    zaloStatus.availableTemplates.map((t) => (
                      <option key={t.templateId} value={t.templateId}>
                        {t.templateName} ({t.templateId})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="ZNS_INTERVIEW_INVITE_V1">Mời phỏng vấn & Nhắc lịch (ZNS_INTERVIEW_INVITE_V1)</option>
                      <option value="ZNS_OFFER_ISSUED_V1">Thư mời nhận việc (ZNS_OFFER_ISSUED_V1)</option>
                      <option value="ZNS_APPLICATION_STATUS_V1">Cập nhật tiến độ ứng tuyển (ZNS_APPLICATION_STATUS_V1)</option>
                    </>
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={testSending}
                className={styles.btnSendTest}
              >
                <Send size={14} />
                {testSending ? 'Đang gửi qua Zalo Cloud...' : 'Bấm Gửi Thử Nghiệm'}
              </button>
            </form>

            {/* Result output */}
            {testResult && (
              <div
                className={
                  testResult.success
                    ? styles.testResultSuccess
                    : styles.testResultError
                }
              >
                <div className={styles.resultTitle}>
                  {testResult.success ? (
                    <CheckCircle2 size={16} className={styles.resultSuccessIcon} />
                  ) : (
                    <AlertTriangle size={16} className={styles.resultErrorIcon} />
                  )}
                  {testResult.success ? 'Gửi thành công' : 'Thất bại'} ({testResult.mode})
                </div>
                {testResult.messageId && (
                  <div className={styles.resultMessageId}>
                    Message ID: {testResult.messageId}
                  </div>
                )}
                <div className={styles.resultSentAt}>
                  Thời gian: {new Date(testResult.sentAt).toLocaleTimeString('vi-VN')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
