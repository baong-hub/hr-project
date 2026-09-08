import React, { useState, useEffect } from 'react';
import { reportService } from '../../../core/services/report.service';
import type { EmployerSummary, RecruitmentFunnel } from '../../../core/models/report.model';
import { Calendar, Download, RefreshCw, Briefcase, Eye, FileText, Percent, AlertCircle } from 'lucide-react';
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
        reportService.getEmployerFunnel()
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
      { 'Chỉ số': 'Tin tuyển dụng đang hoạt động', 'Giá trị': summary.totalActiveJobs },
      { 'Chỉ số': 'Tổng lượt xem tin (Views)', 'Giá trị': summary.totalViews },
      { 'Chỉ số': 'Tổng hồ sơ ứng tuyển (Applications)', 'Giá trị': summary.totalApplications },
      { 'Chỉ số': 'Tỷ lệ ứng tuyển trung bình (%)', 'Giá trị': `${summary.averageApplyRate}%` },
    ];

    const funnelData = funnel.stages.map(s => ({
      'Giai đoạn': s.stage,
      'Số lượng': s.count
    }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsFunnel = XLSX.utils.json_to_sheet(funnelData);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng quan');
    XLSX.utils.book_append_sheet(wb, wsFunnel, 'Phễu tuyển dụng');

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

  const stages = funnel?.stages || [];
  const submittedCount = stages.find(s => s.stage === 'SUBMITTED')?.count || 0;
  const reviewingCount = stages.find(s => s.stage === 'REVIEWING')?.count || 0;
  const shortlistedCount = stages.find(s => s.stage === 'SHORTLISTED')?.count || 0;
  const acceptedCount = stages.find(s => s.stage === 'ACCEPTED')?.count || 0;

  const funnelData = [
    { label: 'Hồ sơ nộp (Submitted)', count: submittedCount, percent: 100, color: 'var(--color-brand-primary)' },
    { label: 'Đang duyệt (Reviewing)', count: reviewingCount, percent: submittedCount > 0 ? Math.round((reviewingCount / submittedCount) * 100) : 0, color: '#f39c12' },
    { label: 'Sơ tuyển (Shortlisted)', count: shortlistedCount, percent: reviewingCount > 0 ? Math.round((shortlistedCount / reviewingCount) * 100) : 0, color: '#3498db' },
    { label: 'Nhận việc (Accepted)', count: acceptedCount, percent: shortlistedCount > 0 ? Math.round((acceptedCount / shortlistedCount) * 100) : 0, color: 'var(--color-success)' }
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1>Báo cáo phân tích tuyển dụng</h1>
          <p className={styles.subtitle}>Phân tích hiệu suất tuyển dụng của công ty</p>
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
            <Download size={16} /> Xuất Excel
          </button>
        </div>
      </div>

      {summary && (
        <>
          <div className={styles.kpis}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(201, 169, 97, 0.1)' }}>
                <Briefcase size={22} style={{ color: 'var(--color-brand-primary)' }} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tin tuyển dụng đang chạy</span>
                <span className={styles.kpiVal}>{summary.totalActiveJobs}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)' }}>
                <Eye size={22} style={{ color: '#3498db' }} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Lượt xem tin (Views)</span>
                <span className={styles.kpiVal}>{summary.totalViews.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)' }}>
                <FileText size={22} style={{ color: '#f39c12' }} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tổng số hồ sơ nộp</span>
                <span className={styles.kpiVal}>{summary.totalApplications.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)' }}>
                <Percent size={22} style={{ color: 'var(--color-success)' }} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tỷ lệ ứng tuyển trung bình</span>
                <span className={styles.kpiVal}>{summary.averageApplyRate}%</span>
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3>Phễu tuyển dụng (Conversion Funnel)</h3>
              <p className={styles.chartSubtitle}>Tỷ lệ chuyển đổi giữa các bước ứng tuyển</p>
              
              <div className={styles.funnelContainer}>
                {funnelData.map((f, i) => (
                  <div key={i} className={styles.funnelRow}>
                    <div className={styles.funnelLabel}>{f.label}</div>
                    <div className={styles.funnelBarWrapper}>
                      <div 
                        className={styles.funnelBar} 
                        style={{ 
                          width: `${Math.max(10, f.percent)}%`,
                          backgroundColor: f.color
                        }}
                      >
                        <span className={styles.funnelBarVal}>{f.count}</span>
                      </div>
                    </div>
                    <div className={styles.funnelPercent}>
                      {i === 0 ? 'Gốc' : `${f.percent}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Xu hướng tương tác</h3>
              <p className={styles.chartSubtitle}>Biểu đồ phân phối lượt nộp đơn</p>
              
              <div className={styles.svgContainer}>
                <svg viewBox="0 0 400 200" width="100%" height="100%">
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f2f6" strokeWidth="1" />
                  <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f2f6" strokeWidth="1" />
                  <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f2f6" strokeWidth="1" />
                  <line x1="40" y1="140" x2="380" y2="140" stroke="#f1f2f6" strokeWidth="1" />
                  <line x1="40" y1="170" x2="380" y2="170" stroke="#a4b0be" strokeWidth="1.5" />

                  <text x="15" y="25" fill="#747d8c" fontSize="10">100%</text>
                  <text x="15" y="65" fill="#747d8c" fontSize="10">60%</text>
                  <text x="15" y="105" fill="#747d8c" fontSize="10">30%</text>
                  <text x="15" y="145" fill="#747d8c" fontSize="10">10%</text>

                  <text x="60" y="185" fill="#747d8c" fontSize="10">Nộp đơn</text>
                  <text x="160" y="185" fill="#747d8c" fontSize="10">Sơ loại</text>
                  <text x="260" y="185" fill="#747d8c" fontSize="10">Phỏng vấn</text>
                  <text x="350" y="185" fill="#747d8c" fontSize="10">Nhận việc</text>

                  <defs>
                    <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-brand-primary)" />
                      <stop offset="100%" stopColor="var(--color-brand-secondary)" />
                    </linearGradient>
                    <linearGradient id="gradient-area" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path 
                    d={`M 60,${170 - (submittedCount > 0 ? 120 : 0)} 
                       L 160,${170 - (submittedCount > 0 ? (reviewingCount / submittedCount) * 120 : 0)} 
                       L 260,${170 - (submittedCount > 0 ? (shortlistedCount / submittedCount) * 120 : 0)} 
                       L 350,${170 - (submittedCount > 0 ? (acceptedCount / submittedCount) * 120 : 0)} 
                       L 350,170 L 60,170 Z`} 
                    fill="url(#gradient-area)" 
                  />

                  <path 
                    d={`M 60,${170 - (submittedCount > 0 ? 120 : 0)} 
                       L 160,${170 - (submittedCount > 0 ? (reviewingCount / submittedCount) * 120 : 0)} 
                       L 260,${170 - (submittedCount > 0 ? (shortlistedCount / submittedCount) * 120 : 0)} 
                       L 350,${170 - (submittedCount > 0 ? (acceptedCount / submittedCount) * 120 : 0)}`} 
                    fill="none" 
                    stroke="url(#gradient-line)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />

                  <circle cx="60" cy={170 - (submittedCount > 0 ? 120 : 0)} r="5" fill="#ffffff" stroke="var(--color-brand-primary)" strokeWidth="3" />
                  <circle cx="160" cy={170 - (submittedCount > 0 ? (reviewingCount / submittedCount) * 120 : 0)} r="5" fill="#ffffff" stroke="#f39c12" strokeWidth="3" />
                  <circle cx="260" cy={170 - (submittedCount > 0 ? (shortlistedCount / submittedCount) * 120 : 0)} r="5" fill="#ffffff" stroke="#3498db" strokeWidth="3" />
                  <circle cx="350" cy={170 - (submittedCount > 0 ? (acceptedCount / submittedCount) * 120 : 0)} r="5" fill="#ffffff" stroke="var(--color-success)" strokeWidth="3" />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.tableCard}>
            <h3>Hồ sơ tuyển dụng thu hút nhất</h3>
            <p className={styles.tableSubtitle}>Danh sách chiến dịch và số liệu chi tiết</p>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Giai đoạn phễu</th>
                    <th>Số lượng hồ sơ</th>
                    <th>Tỷ lệ chuyển đổi (so với tổng nộp)</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelData.map((f, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'semibold' }}>{f.label}</td>
                      <td>{f.count} hồ sơ</td>
                      <td>
                        <span 
                          className={styles.rateBadge}
                          style={{
                            backgroundColor: idx === 0 ? 'var(--color-brand-primary-soft)' : 'var(--color-bg-subtle)',
                            color: idx === 0 ? 'var(--color-brand-primary-dark)' : 'var(--color-text-primary)'
                          }}
                        >
                          {submittedCount > 0 ? Math.round((f.count / submittedCount) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
