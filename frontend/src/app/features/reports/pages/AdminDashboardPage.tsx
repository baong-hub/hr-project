import React, { useState, useEffect } from 'react';
import { reportService } from '../../../core/services/report.service';
import type { AdminSummary } from '../../../core/models/report.model';
import { Users, Building, FileClock, ClipboardList, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import styles from './AdminDashboardPage.module.scss';

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [filterRange, setFilterRange] = useState<'7' | '30' | 'month' | 'custom'>('30');

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await reportService.getAdminSummary({ range: filterRange });
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data);
      } else {
        setHasError(true);
      }
    } catch (err) {
      console.error('Error fetching admin summary data', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterRange]);

  if (isLoading && !summary) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.stateText}>Đang tải thống kê toàn sàn...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.stateContainer}>
        <AlertCircle size={40} className={styles.errorIcon} />
        <p className={styles.stateText_error}>Không thể tải dữ liệu báo cáo hệ thống.</p>
        <button className={styles.btnRetry} onClick={fetchData}>
          <RefreshCw size={16} /> Thử lại
        </button>
      </div>
    );
  }

  // Dynamic calculations for SVG charts
  const maxVal = Math.max(summary?.totalCandidates || 0, summary?.totalCompanies || 0, 1);
  const candHeight = Math.max(8, Math.round(((summary?.totalCandidates || 0) / maxVal) * 120));
  const candY = 160 - candHeight;
  const compHeight = Math.max(8, Math.round(((summary?.totalCompanies || 0) / maxVal) * 120));
  const compY = 160 - compHeight;

  // Active jobs rate from DB
  const activeRate = summary?.activeJobsRate ?? (
    summary && summary.totalJobs > 0 
      ? Math.round(((summary.activeJobs ?? summary.totalJobs) / summary.totalJobs) * 100) 
      : 0
  );
  const circumference = 251.327; // 2 * PI * 40
  const dashLength = (activeRate / 100) * circumference;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1>Dashboard Quản trị hệ thống</h1>
          <p className={styles.subtitle}>Giám sát chỉ số tăng trưởng và hoạt động toàn sàn</p>
        </div>
        <div className={styles.filterGroup}>
          <button 
            className={`${styles.filterBtn} ${filterRange === '7' ? styles.filterBtn_active : ''}`}
            onClick={() => setFilterRange('7')}
          >
            7 ngày qua
          </button>
          <button 
            className={`${styles.filterBtn} ${filterRange === '30' ? styles.filterBtn_active : ''}`}
            onClick={() => setFilterRange('30')}
          >
            30 ngày qua
          </button>
          <button 
            className={`${styles.filterBtn} ${filterRange === 'month' ? styles.filterBtn_active : ''}`}
            onClick={() => setFilterRange('month')}
          >
            Tháng này
          </button>
          <button 
            className={`${styles.filterBtn} ${filterRange === 'custom' ? styles.filterBtn_active : ''}`}
            onClick={() => setFilterRange('custom')}
          >
            <Calendar size={14} /> Tùy chọn
          </button>
        </div>
      </div>

      {summary && (
        <>
          <div className={styles.kpis}>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconInfo}`}>
                <Users size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Ứng viên đăng ký</span>
                <span className={styles.kpiVal}>{(summary.totalCandidates || 0).toLocaleString()}</span>
                {summary.candidatesTrendPercentage !== undefined && (
                  <span className={`${styles.trendText} ${summary.candidatesTrendPercentage >= 0 ? styles.trendPositive : styles.trendNegative}`}>
                    {summary.candidatesTrendPercentage >= 0 ? `+${summary.candidatesTrendPercentage}%` : `${summary.candidatesTrendPercentage}%`} so với kỳ trước
                  </span>
                )}
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconSuccess}`}>
                <Building size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Doanh nghiệp đăng ký</span>
                <span className={styles.kpiVal}>{(summary.totalCompanies || 0).toLocaleString()}</span>
                {summary.companiesTrendPercentage !== undefined && (
                  <span className={`${styles.trendText} ${summary.companiesTrendPercentage >= 0 ? styles.trendPositive : styles.trendNegative}`}>
                    {summary.companiesTrendPercentage >= 0 ? `+${summary.companiesTrendPercentage}%` : `${summary.companiesTrendPercentage}%`} so với kỳ trước
                  </span>
                )}
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconWarning}`}>
                <FileClock size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tin tuyển dụng</span>
                <span className={styles.kpiVal}>{(summary.totalJobs || 0).toLocaleString()}</span>
                {summary.jobsTrendPercentage !== undefined && (
                  <span className={`${styles.trendText} ${summary.jobsTrendPercentage >= 0 ? styles.trendPositive : styles.trendNegative}`}>
                    {summary.jobsTrendPercentage >= 0 ? `+${summary.jobsTrendPercentage}%` : `${summary.jobsTrendPercentage}%`} so với kỳ trước
                  </span>
                )}
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.iconPrimary}`}>
                <ClipboardList size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tổng số đơn ứng tuyển</span>
                <span className={styles.kpiVal}>{(summary.totalApplications || 0).toLocaleString()}</span>
                {summary.applicationsTrendPercentage !== undefined && (
                  <span className={`${styles.trendText} ${summary.applicationsTrendPercentage >= 0 ? styles.trendPositive : styles.trendNegative}`}>
                    {summary.applicationsTrendPercentage >= 0 ? `+${summary.applicationsTrendPercentage}%` : `${summary.applicationsTrendPercentage}%`} so với kỳ trước
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3>So sánh lượt đăng ký</h3>
              <p className={styles.chartSubtitle}>Biểu đồ cột biểu thị tương quan Ứng viên vs Nhà tuyển dụng (theo dữ liệu thực tế)</p>
              
              <div className={styles.barChartContainer}>
                <svg viewBox="0 0 400 200" width="100%" height="100%">
                  <line x1="40" y1="20" x2="380" y2="20" stroke="var(--color-border-default)" strokeWidth="1" />
                  <line x1="40" y1="70" x2="380" y2="70" stroke="var(--color-border-default)" strokeWidth="1" />
                  <line x1="40" y1="120" x2="380" y2="120" stroke="var(--color-border-default)" strokeWidth="1" />
                  <line x1="40" y1="160" x2="380" y2="160" stroke="var(--color-border-strong)" strokeWidth="1.5" />

                  <text x="10" y="25" fill="var(--color-text-muted)" fontSize="10">{maxVal}</text>
                  <text x="10" y="75" fill="var(--color-text-muted)" fontSize="10">{Math.round(maxVal * 0.66)}</text>
                  <text x="10" y="125" fill="var(--color-text-muted)" fontSize="10">{Math.round(maxVal * 0.33)}</text>
                  <text x="10" y="165" fill="var(--color-text-muted)" fontSize="10">0</text>

                  <text x="80" y="180" fill="var(--color-text-secondary)" fontSize="10" fontWeight="bold">Ứng viên</text>
                  <text x="260" y="180" fill="var(--color-text-secondary)" fontSize="10" fontWeight="bold">Doanh nghiệp</text>

                  <rect 
                    x="85" 
                    y={candY} 
                    width="40" 
                    height={candHeight} 
                    rx="4" 
                    fill="var(--color-primary)" 
                  />
                  <text x="105" y={Math.max(16, candY - 8)} textAnchor="middle" fill="var(--color-primary)" fontSize="11" fontWeight="bold">
                    {summary.totalCandidates}
                  </text>

                  <rect 
                    x="275" 
                    y={compY} 
                    width="40" 
                    height={compHeight} 
                    rx="4" 
                    fill="var(--color-success)" 
                  />
                  <text x="295" y={Math.max(16, compY - 8)} textAnchor="middle" fill="var(--color-success)" fontSize="11" fontWeight="bold">
                    {summary.totalCompanies}
                  </text>
                </svg>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Tỷ lệ tin tuyển dụng đang hoạt động</h3>
              <p className={styles.chartSubtitle}>Tỷ lệ tin tuyển dụng trạng thái Đang mở (Published) trên tổng tin</p>
              
              <div className={styles.pieContainer}>
                <div className={styles.pieChart}>
                  <svg viewBox="0 0 100 100" width="120" height="120">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-border-default)" strokeWidth="10" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="transparent" 
                      stroke="var(--color-brand-primary)" 
                      strokeWidth="10" 
                      strokeDasharray={`${dashLength.toFixed(1)} ${circumference.toFixed(1)}`} 
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)" 
                    />
                  </svg>
                  <div className={styles.pieCenter}>{activeRate}%</div>
                </div>
                <div className={styles.pieLegend}>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.dotPrimary}`} />
                    <span>Tin đang tuyển ({summary.activeJobs || 0})</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.dotMuted}`} />
                    <span>Đã đóng/Tạm dừng ({Math.max(0, (summary.totalJobs || 0) - (summary.activeJobs || 0))})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.tableCard}>
            <h3>Tăng trưởng tài nguyên</h3>
            <p className={styles.tableSubtitle}>Tổng quan số liệu bài đăng tuyển dụng và hồ sơ nộp</p>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Chỉ số</th>
                    <th>Tổng số lượng</th>
                    <th>Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tableLabelCell}>Tin tuyển dụng hoạt động</td>
                    <td>{summary.totalJobs} tin đăng</td>
                    <td>
                      <span className={styles.badge_success}>
                        {summary.jobsTrendLabel || 'Ổn định'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.tableLabelCell}>Hồ sơ ứng tuyển phát sinh</td>
                    <td>{summary.totalApplications} lượt nộp</td>
                    <td>
                      <span className={styles.badge_success}>
                        {summary.applicationsTrendLabel || 'Tăng trưởng ổn định'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

