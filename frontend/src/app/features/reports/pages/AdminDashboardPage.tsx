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
      const res = await reportService.getAdminSummary();
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
            <Calendar size={14} style={{ marginRight: 4 }} /> Tùy chọn
          </button>
        </div>
      </div>

      {summary && (
        <>
          <div className={styles.kpis}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)' }}>
                <Users size={22} style={{ color: '#3498db' }} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Ứng viên mới đăng ký</span>
                <span className={styles.kpiVal}>{(summary.totalCandidates || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)' }}>
                <Building size={22} style={{ color: 'var(--color-success)' }} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Doanh nghiệp mới đăng ký</span>
                <span className={styles.kpiVal}>{(summary.totalCompanies || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(241, 196, 15, 0.1)' }}>
                <FileClock size={22} style={{ color: '#f1c40f' }} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tin tuyển dụng mới</span>
                <span className={styles.kpiVal}>{(summary.totalJobs || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(155, 89, 182, 0.1)' }}>
                <ClipboardList size={22} style={{ color: '#9b59b6' }} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tổng số đơn ứng tuyển</span>
                <span className={styles.kpiVal}>{(summary.totalApplications || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3>So sánh lượt đăng ký mới</h3>
              <p className={styles.chartSubtitle}>Biểu đồ cột biểu thị tương quan Ứng viên vs Nhà tuyển dụng</p>
              
              <div className={styles.barChartContainer}>
                <svg viewBox="0 0 400 200" width="100%" height="100%">
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f2f6" strokeWidth="1" />
                  <line x1="40" y1="70" x2="380" y2="70" stroke="#f1f2f6" strokeWidth="1" />
                  <line x1="40" y1="120" x2="380" y2="120" stroke="#f1f2f6" strokeWidth="1" />
                  <line x1="40" y1="160" x2="380" y2="160" stroke="#a4b0be" strokeWidth="1.5" />

                  <text x="10" y="25" fill="#747d8c" fontSize="10">Cao</text>
                  <text x="10" y="75" fill="#747d8c" fontSize="10">Trung</text>
                  <text x="10" y="125" fill="#747d8c" fontSize="10">Thấp</text>
                  <text x="10" y="165" fill="#747d8c" fontSize="10">0</text>

                  <text x="80" y="180" fill="#747d8c" fontSize="10" fontWeight="bold">Ứng viên</text>
                  <text x="260" y="180" fill="#747d8c" fontSize="10" fontWeight="bold">Doanh nghiệp</text>

                  <defs>
                    <linearGradient id="blue-bar-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3498db" />
                      <stop offset="100%" stopColor="#2980b9" />
                    </linearGradient>
                    <linearGradient id="green-bar-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2ecc71" />
                      <stop offset="100%" stopColor="#27ae60" />
                    </linearGradient>
                  </defs>

                  <rect 
                    x="85" 
                    y="40" 
                    width="40" 
                    height="120" 
                    rx="4" 
                    fill="url(#blue-bar-gradient)" 
                  />
                  <text x="105" y="30" textAnchor="middle" fill="#2980b9" fontSize="11" fontWeight="bold">
                    {summary.totalCandidates}
                  </text>

                  <rect 
                    x="275" 
                    y="70" 
                    width="40" 
                    height="90" 
                    rx="4" 
                    fill="url(#green-bar-gradient)" 
                  />
                  <text x="295" y="60" textAnchor="middle" fill="#27ae60" fontSize="11" fontWeight="bold">
                    {summary.totalCompanies}
                  </text>
                </svg>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Hoạt động tuyển dụng của doanh nghiệp</h3>
              <p className={styles.chartSubtitle}>Thống kê tỷ lệ nộp hồ sơ trung bình toàn sàn</p>
              
              <div className={styles.pieContainer}>
                <div className={styles.pieChart}>
                  <svg viewBox="0 0 100 100" width="120" height="120">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f2f6" strokeWidth="10" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="transparent" 
                      stroke="var(--color-brand-primary)" 
                      strokeWidth="10" 
                      strokeDasharray="188.4 251.2" 
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)" 
                    />
                  </svg>
                  <div className={styles.pieCenter}>75%</div>
                </div>
                <div className={styles.pieLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: 'var(--color-brand-primary)' }} />
                    <span>Chiến dịch đang hoạt động tốt</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#f1f2f6' }} />
                    <span>Chiến dịch cần tối ưu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.tableCard}>
            <h3>Tăng trưởng tài nguyên</h3>
            <p className={styles.tableSubtitle}>Tổng quan số liệu bài đăng tuyển dụng phát sinh</p>
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
                    <td style={{ fontWeight: 'semibold' }}>Tin tuyển dụng hoạt động</td>
                    <td>{summary.totalJobs} tin đăng</td>
                    <td><span className={styles.badge_success}>Ổn định</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'semibold' }}>Hồ sơ ứng tuyển phát sinh</td>
                    <td>{summary.totalApplications} lượt nộp</td>
                    <td><span className={styles.badge_success}>Tăng trưởng nhanh</span></td>
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
