import React, { useState, useEffect } from 'react';
import { reportService } from '../../../core/services/report.service';
import type { EmployerSummary, RecruitmentFunnel } from '../../../core/models/report.model';
import { 
  Calendar, Download, RefreshCw, Briefcase, Eye, FileText, Percent, 
  AlertCircle, CheckCircle2, Clock, Gift
} from 'lucide-react';
import styles from './EmployerDashboardPage.module.scss';
import * as XLSX from 'xlsx';

export const EmployerDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<EmployerSummary | null>(null);
  const [funnel, setFunnel] = useState<RecruitmentFunnel | null>(null);
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [summaryRes, funnelRes] = await Promise.all([
        reportService.getEmployerSummary({ from: fromDate, to: toDate }),
        reportService.getEmployerFunnel({ from: fromDate, to: toDate })
      ]);

      if (summaryRes.data?.success && summaryRes.data.data) {
        setSummary(summaryRes.data.data);
      } else {
        setHasError(true);
      }

      if (funnelRes.data?.success && funnelRes.data.data) {
        setFunnel(funnelRes.data.data);
      } else {
        setHasError(true);
      }
    } catch (err) {
      console.error('Error fetching dashboard data', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const handleExportExcel = () => {
    if (!summary || !funnel) return;

    const summaryData = [
      { 'Chỉ số KPI': 'Tin tuyển dụng đang hoạt động', 'Giá trị': summary.totalActiveJobs },
      { 'Chỉ số KPI': 'Tổng lượt xem tin (Views)', 'Giá trị': summary.totalViews },
      { 'Chỉ số KPI': 'Tổng hồ sơ ứng tuyển (Applications)', 'Giá trị': summary.totalApplications },
      { 'Chỉ số KPI': 'Tỷ lệ ứng tuyển trung bình (%)', 'Giá trị': `${summary.averageApplyRate}%` },
      { 'Chỉ số KPI': 'Tổng số buổi phỏng vấn đã xếp', 'Giá trị': summary.totalInterviews || 0 },
      { 'Chỉ số KPI': 'Phỏng vấn đã hoàn thành', 'Giá trị': summary.completedInterviews || 0 },
      { 'Chỉ số KPI': 'Tổng số đề xuất Offer đã gửi', 'Giá trị': summary.totalOffers || 0 },
      { 'Chỉ số KPI': 'Tuyển dụng thành công (Hired)', 'Giá trị': summary.totalHired || 0 },
      { 'Chỉ số KPI': 'Thời gian tuyển trung bình (Time-to-Hire)', 'Giá trị': `${summary.averageTimeToHireDays || 0} ngày` },
      { 'Chỉ số KPI': 'Tỷ lệ nhận việc (Offer Acceptance)', 'Giá trị': `${summary.offerAcceptanceRate || 0}%` },
    ];

    const funnelData = funnel.stages.map(s => ({
      'Giai đoạn': s.stage,
      'Số lượng hồ sơ': s.count
    }));

    const topJobsData = (summary.topJobs || []).map(j => ({
      'Mã tin': j.jobId,
      'Tiêu đề tin tuyển dụng': j.title,
      'Lượt xem': j.views,
      'Số lượng đơn nộp': j.applications,
      'Tỷ lệ nộp (%)': `${j.applyRate}%`,
      'Trạng thái': j.status
    }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsFunnel = XLSX.utils.json_to_sheet(funnelData);
    const wsTopJobs = XLSX.utils.json_to_sheet(topJobsData);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng quan KPI');
    XLSX.utils.book_append_sheet(wb, wsFunnel, 'Phễu tuyển dụng');
    if (topJobsData.length > 0) {
      XLSX.utils.book_append_sheet(wb, wsTopJobs, 'Top tin tuyển dụng');
    }

    XLSX.writeFile(wb, `BaoCaoTuyenDung_${fromDate}_to_${toDate}.xlsx`);
  };

  if (isLoading && !summary) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.stateText}>Đang tải báo cáo phân tích tuyển dụng...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.stateContainer}>
        <AlertCircle size={40} className={styles.errorIcon} />
        <p className={styles.stateText_error}>Không thể tải dữ liệu báo cáo.</p>
        <button className={styles.btnRetry} onClick={fetchData}>
          <RefreshCw size={16} /> Thử lại
        </button>
      </div>
    );
  }

  // Funnel extraction - backend now returns cumulative counts
  const stages = funnel?.stages || [];
  const appliedCount = stages.find(s => s.stage === 'APPLIED')?.count || 0;
  const screeningCount = stages.find(s => s.stage === 'SCREENING')?.count || 0;
  const shortlistedCount = stages.find(s => s.stage === 'SHORTLISTED')?.count || 0;
  const interviewCount = stages.find(s => s.stage === 'INTERVIEW')?.count || 0;
  const offerCount = stages.find(s => s.stage === 'OFFER')?.count || 0;
  const hiredCount = stages.find(s => s.stage === 'HIRED')?.count || 0;
  const baseCount = appliedCount || 1;

  const funnelPipeline = [
    { label: '1. Nộp hồ sơ (Applied)', count: appliedCount, percent: appliedCount > 0 ? 100 : 0, stageClass: styles.barStage1 },
    { label: '2. Sàng lọc CV (Screening)', count: screeningCount, percent: Math.round((screeningCount / baseCount) * 100), stageClass: styles.barStage2 },
    { label: '3. Sơ tuyển (Shortlisted)', count: shortlistedCount, percent: Math.round((shortlistedCount / baseCount) * 100), stageClass: styles.barStage3 },
    { label: '4. Phỏng vấn (Interview)', count: interviewCount, percent: Math.round((interviewCount / baseCount) * 100), stageClass: styles.barStage4 },
    { label: '5. Đề xuất việc (Offer)', count: offerCount, percent: Math.round((offerCount / baseCount) * 100), stageClass: styles.barStage5 },
    { label: '6. Nhận việc (Hired)', count: hiredCount, percent: Math.round((hiredCount / baseCount) * 100), stageClass: styles.barStage6 },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1>Báo cáo phân tích tuyển dụng</h1>
          <p className={styles.subtitle}>Phân tích toàn diện hiệu suất tuyển dụng, phễu chuyển đổi & chỉ số Time-to-Hire</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.dateFilter}>
            <Calendar size={16} />
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
              className={styles.dateInput}
            />
            <span>đến</span>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
              className={styles.dateInput}
            />
          </div>
          <button className={styles.btnExport} onClick={handleExportExcel} disabled={!summary}>
            <Download size={16} /> Xuất Excel Toàn Diện
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* 8 KPI Cards Grid */}
          <div className={styles.kpis}>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconInfo}`}>
                <Briefcase size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tin đang hoạt động</span>
                <span className={styles.kpiVal}>{summary.totalActiveJobs}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconPrimary}`}>
                <Eye size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Lượt xem tin (Views)</span>
                <span className={styles.kpiVal}>{summary.totalViews.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconPrimary}`}>
                <FileText size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tổng số hồ sơ nộp</span>
                <span className={styles.kpiVal}>{summary.totalApplications.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconSuccess}`}>
                <Percent size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tỷ lệ nộp đơn TB</span>
                <span className={styles.kpiVal}>{summary.averageApplyRate}%</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconInfo}`}>
                <Calendar size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Phỏng vấn (Đã xong)</span>
                <span className={styles.kpiVal}>
                  {summary.totalInterviews || 0} <small>({summary.completedInterviews || 0} xong)</small>
                </span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconWarning}`}>
                <Gift size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Đề xuất việc (Offer)</span>
                <span className={styles.kpiVal}>{summary.totalOffers || 0}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconSuccess}`}>
                <CheckCircle2 size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Đã nhận việc (Hired)</span>
                <span className={styles.kpiVal}>{summary.totalHired || 0}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconInfo}`}>
                <Clock size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Time-to-Hire TB</span>
                <span className={styles.kpiVal}>{summary.averageTimeToHireDays || 0} <small>ngày</small></span>
              </div>
            </div>
          </div>

          {/* Funnel & Conversion Chart */}
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <h3>Phễu tuyển dụng toàn diện (6 Giai đoạn)</h3>
                  <p className={styles.chartSubtitle}>Tỷ lệ chuyển đổi chi tiết qua các vòng tuyển chọn</p>
                </div>
                <div className={styles.acceptanceRate}>
                  Tỷ lệ nhận việc: {summary.offerAcceptanceRate || 0}%
                </div>
              </div>
              
              <div className={styles.funnelContainer}>
                {funnelPipeline.map((f, i) => {
                  const widthPercent = Math.max(8, f.percent);
                  return (
                    <div key={i} className={styles.funnelRow}>
                      <div className={styles.funnelLabel}>{f.label}</div>
                      <div className={styles.funnelBarWrapper}>
                        <div 
                          className={`${styles.funnelBar} ${f.stageClass}`}
                          style={{ '--bar-width': `${widthPercent}%` } as React.CSSProperties}
                        >
                          <span className={styles.funnelBarVal}>{f.count}</span>
                        </div>
                      </div>
                      <div className={styles.funnelPercent}>
                        {f.percent}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Hiệu Suất Tuyển Dụng & Xu Hướng</h3>
              <p className={styles.chartSubtitle}>Biểu đồ trực quan luồng ứng viên qua từng chặng</p>
              
              <div className={styles.svgContainer}>
                <svg viewBox="0 0 400 200" width="100%" height="100%">
                  <line x1="40" y1="20" x2="380" y2="20" stroke="var(--color-border-default)" strokeWidth="1" />
                  <line x1="40" y1="60" x2="380" y2="60" stroke="var(--color-border-default)" strokeWidth="1" />
                  <line x1="40" y1="100" x2="380" y2="100" stroke="var(--color-border-default)" strokeWidth="1" />
                  <line x1="40" y1="140" x2="380" y2="140" stroke="var(--color-border-default)" strokeWidth="1" />
                  <line x1="40" y1="170" x2="380" y2="170" stroke="var(--color-border-strong)" strokeWidth="1.5" />

                  <text x="15" y="25" fill="var(--color-text-muted)" fontSize="10">100%</text>
                  <text x="15" y="65" fill="var(--color-text-muted)" fontSize="10">60%</text>
                  <text x="15" y="105" fill="var(--color-text-muted)" fontSize="10">30%</text>
                  <text x="15" y="145" fill="var(--color-text-muted)" fontSize="10">10%</text>

                  <text x="50" y="185" fill="var(--color-text-secondary)" fontSize="9">Nộp đơn</text>
                  <text x="110" y="185" fill="var(--color-text-secondary)" fontSize="9">Sàng lọc</text>
                  <text x="175" y="185" fill="var(--color-text-secondary)" fontSize="9">Sơ tuyển</text>
                  <text x="240" y="185" fill="var(--color-text-secondary)" fontSize="9">Phỏng vấn</text>
                  <text x="310" y="185" fill="var(--color-text-secondary)" fontSize="9">Offer</text>
                  <text x="360" y="185" fill="var(--color-text-secondary)" fontSize="9">Hired</text>

                  <path 
                    d={`M 60,${170 - (appliedCount > 0 ? 120 : 0)} 
                       L 125,${170 - (appliedCount > 0 ? (screeningCount / baseCount) * 120 : 0)} 
                       L 190,${170 - (appliedCount > 0 ? (shortlistedCount / baseCount) * 120 : 0)} 
                       L 255,${170 - (appliedCount > 0 ? (interviewCount / baseCount) * 120 : 0)} 
                       L 320,${170 - (appliedCount > 0 ? (offerCount / baseCount) * 120 : 0)} 
                       L 370,${170 - (appliedCount > 0 ? (hiredCount / baseCount) * 120 : 0)} 
                       L 370,170 L 60,170 Z`} 
                    fill="var(--color-info-bg)" 
                    opacity="0.6"
                  />

                  <path 
                    d={`M 60,${170 - (appliedCount > 0 ? 120 : 0)} 
                       L 125,${170 - (appliedCount > 0 ? (screeningCount / baseCount) * 120 : 0)} 
                       L 190,${170 - (appliedCount > 0 ? (shortlistedCount / baseCount) * 120 : 0)} 
                       L 255,${170 - (appliedCount > 0 ? (interviewCount / baseCount) * 120 : 0)} 
                       L 320,${170 - (appliedCount > 0 ? (offerCount / baseCount) * 120 : 0)} 
                       L 370,${170 - (appliedCount > 0 ? (hiredCount / baseCount) * 120 : 0)}`} 
                    fill="none" 
                    stroke="var(--color-primary)" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                  />

                  <circle cx="60" cy={170 - (appliedCount > 0 ? 120 : 0)} r="4" fill="var(--color-bg-card)" stroke="var(--color-primary)" strokeWidth="2" />
                  <circle cx="125" cy={170 - (appliedCount > 0 ? (screeningCount / baseCount) * 120 : 0)} r="4" fill="var(--color-bg-card)" stroke="var(--color-info)" strokeWidth="2" />
                  <circle cx="190" cy={170 - (appliedCount > 0 ? (shortlistedCount / baseCount) * 120 : 0)} r="4" fill="var(--color-bg-card)" stroke="var(--color-brand-primary)" strokeWidth="2" />
                  <circle cx="255" cy={170 - (appliedCount > 0 ? (interviewCount / baseCount) * 120 : 0)} r="4" fill="var(--color-bg-card)" stroke="var(--color-warning)" strokeWidth="2" />
                  <circle cx="320" cy={170 - (appliedCount > 0 ? (offerCount / baseCount) * 120 : 0)} r="4" fill="var(--color-bg-card)" stroke="var(--color-warning)" strokeWidth="2" />
                  <circle cx="370" cy={170 - (appliedCount > 0 ? (hiredCount / baseCount) * 120 : 0)} r="4" fill="var(--color-bg-card)" stroke="var(--color-success)" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Top Performing Jobs Table */}
          <div className={styles.tableCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3>Tin tuyển dụng thu hút nhiều ứng viên nhất</h3>
                <p className={styles.tableSubtitle}>Xếp hạng dựa trên lượt xem và số lượng hồ sơ nộp thực tế</p>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vị trí tuyển dụng</th>
                    <th>Lượt xem (Views)</th>
                    <th>Hồ sơ nộp (Applications)</th>
                    <th>Tỷ lệ chuyển đổi</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topJobs && summary.topJobs.length > 0 ? (
                    summary.topJobs.map((j) => (
                      <tr key={j.jobId}>
                        <td className={styles.jobTitleCell}>{j.title}</td>
                        <td>{j.views.toLocaleString()}</td>
                        <td><strong>{j.applications}</strong> hồ sơ</td>
                        <td>
                          <span 
                            className={`${styles.rateBadge} ${j.applyRate > 15 ? styles.rateHigh : styles.rateNormal}`}
                          >
                            {j.applyRate}%
                          </span>
                        </td>
                        <td>
                          <span 
                            className={`${styles.statusBadge} ${j.status === 'PUBLISHED' ? styles.statusPublished : styles.statusOther}`}
                          >
                            {j.status === 'PUBLISHED' ? 'Đang tuyển' : j.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={styles.emptyTableMessage}>
                        Chưa có dữ liệu tin tuyển dụng trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
