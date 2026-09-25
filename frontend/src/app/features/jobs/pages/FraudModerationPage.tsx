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
        bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        text: `Nguy cơ lừa đảo cao (${score}/100)`
      };
    }
    if (score >= 35) {
      return {
        bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        text: `Cần xem xét (${score}/100)`
      };
    }
    return {
      bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      text: `An toàn (${score}/100)`
    };
  };

  const safetyPercentage = data?.totalJobsCount
    ? Math.round((data.cleanJobsCount / data.totalJobsCount) * 100)
    : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              HR Portal Moderation Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Trung Tâm Kiểm Duyệt & Phòng Chống Gian Lận
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Hệ thống AI & Rule-based tự động rà quét từ khoá lừa đảo, cọc tiền, nhiệm vụ Telegram và quản lý kênh thông báo Zalo ZNS.
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Flagged Jobs */}
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Tin có dấu hiệu rủi ro
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {data?.flaggedRiskJobsCount || 0}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Tin tuyển dụng có điểm rủi ro ≥ 40
          </p>
        </div>

        {/* Card 2: Safety Rate */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Tỉ lệ an toàn toàn sàn
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {safetyPercentage}%
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {data?.cleanJobsCount || 0} / {data?.totalJobsCount || 0} tin đạt chuẩn sạch
          </p>
        </div>

        {/* Card 3: Pending Reports */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Báo cáo vi phạm chờ xử lý
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {data?.pendingViolationReportsCount || 0}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Ứng viên gửi tố cáo trực tiếp
          </p>
        </div>

        {/* Card 4: Zalo OA Integration */}
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Zalo ZNS Service
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {zaloStatus?.isSimulationMode ? 'Sandbox Simulator' : 'Live Production'}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            OA ID: {zaloStatus?.oaId || '184920481029148'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('JOBS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'JOBS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Tin Tuyển Dụng Nghi Vấn ({data?.flaggedJobs?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'REPORTS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flag className="w-4 h-4" />
          Báo Cáo Tố Cáo ({data?.recentViolationReports?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('ZALO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'ZALO'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Tích Hợp Zalo OA & ZNS
        </button>
      </div>

      {/* Tab 1: Flagged Jobs */}
      {activeTab === 'JOBS' && (
        <div className="space-y-4">
          {data?.flaggedJobs && data.flaggedJobs.length > 0 ? (
            data.flaggedJobs.map((job) => {
              const badge = getRiskBadge(job.riskScore);
              const flags = job.fraudWarningFlags
                ? job.fraudWarningFlags.split(',').map((f) => f.trim())
                : [];

              return (
                <div
                  key={job.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
                        >
                          {badge.text}
                        </span>
                        <span className="text-xs text-slate-500">
                          ID: #{job.id} • Đăng ngày {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Trạng thái: {job.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {job.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-blue-500" />
                          {job.companyName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.city}
                        </span>
                        {(job.salaryFrom || job.salaryTo) && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <DollarSign className="w-3.5 h-3.5" />
                            {job.salaryFrom?.toLocaleString('vi-VN')} - {job.salaryTo?.toLocaleString('vi-VN')} VND
                          </span>
                        )}
                      </div>

                      {/* Detected Triggers */}
                      {flags.length > 0 && (
                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                            Cụm từ vi phạm phát hiện:
                          </span>
                          {flags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-md text-[11px] font-medium"
                            >
                              ⚠️ {flag}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-1">
                        {job.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleModerateJob(job.id, 'APPROVE')}
                        disabled={actionLoadingId === job.id}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Phê duyệt an toàn
                      </button>
                      <button
                        onClick={() => handleModerateJob(job.id, 'REJECT_LOCK')}
                        disabled={actionLoadingId === job.id}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Khoá tin vi phạm
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Không có tin tuyển dụng nào có dấu hiệu rủi ro!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tất cả tin tuyển dụng đang lưu hành đều vượt qua bộ rà soát tự động.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Violation Reports */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {data?.recentViolationReports && data.recentViolationReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Mã & Ngày gửi</th>
                    <th className="px-4 py-3">Người báo cáo</th>
                    <th className="px-4 py-3">Mục tiêu tố cáo</th>
                    <th className="px-4 py-3">Lý do & Nội dung</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recentViolationReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200">#{report.id}</span>
                        <div className="text-[11px] text-slate-400">
                          {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {report.reporterName}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">
                        {report.targetTitle}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {report.reason}
                        </span>
                        {report.description && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {report.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            report.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                        {report.status !== 'RESOLVED' && (
                          <>
                            <button
                              onClick={() => handleResolveReport(report.id, false)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Đã kiểm tra
                            </button>
                            <button
                              onClick={() => handleResolveReport(report.id, true)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              Khoá mục vi phạm
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Chưa có báo cáo vi phạm nào từ người dùng.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Zalo OA & ZNS Simulator */}
      {activeTab === 'ZALO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Template Catalog */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Mẫu Thông Báo Zalo Notification Service (ZNS)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Các mẫu ZNS đã đăng ký và tích hợp tự động theo sự kiện tuyển dụng.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-200 dark:border-blue-900/50 rounded-full text-xs font-bold">
                  {zaloStatus?.activeTemplatesCount ?? zaloStatus?.availableTemplates?.length ?? 3} Mẫu đang hoạt động
                </span>
              </div>

              <div className="space-y-3">
                {zaloStatus?.availableTemplates?.map((tmpl) => (
                  <div
                    key={tmpl.templateId}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {tmpl.templateName}
                      </span>
                      <code className="text-[11px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                        {tmpl.templateId}
                      </code>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {tmpl.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[11px] text-slate-400 font-semibold">Tham số:</span>
                      {tmpl.requiredParams.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-mono"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Live Simulator Test Form */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Test Gửi ZNS Qua API
                </h3>
              </div>

              <form onSubmit={handleSendTestZns} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại nhận tin
                  </label>
                  <input
                    type="text"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chọn mẫu thông báo
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {testSending ? 'Đang gửi qua Zalo Cloud...' : 'Bấm Gửi Thử Nghiệm'}
                </button>
              </form>

              {/* Result output */}
              {testResult && (
                <div
                  className={`mt-4 p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    {testResult.success ? 'Gửi thành công' : 'Thất bại'} ({testResult.mode})
                  </div>
                  {testResult.messageId && (
                    <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      Message ID: {testResult.messageId}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500">
                    Thời gian: {new Date(testResult.sentAt).toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
