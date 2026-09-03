import React, { useState, useEffect } from 'react';
import { Edit2, Calendar, Download, X, RefreshCw, Send, Eye } from 'lucide-react';
import { applicationsService } from '../../../core/services/applications.service';
import { jobsService } from '../../../core/services/jobs.service';
import { interviewsService } from '../../../core/services/interviews.service';
import { toast } from '../../../core/services/toast.service';
import { ApplicationDto } from '../../../core/models/application.model';
import { JobDto } from '../../../core/models/job.model';
import { UiDataTable, ColumnConfig } from '../../../shared/ui/DataTable/UiDataTable';
import styles from './EmployerAppManagePage.module.scss';

export const EmployerAppManagePage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');

  // UI Interactive States
  const [selectedApp, setSelectedApp] = useState<ApplicationDto | null>(null);
  const [activeStatusEditId, setActiveStatusEditId] = useState<number | null>(null);
  const [schedulingApp, setSchedulingApp] = useState<ApplicationDto | null>(null);

  // Interview Form State (Controlled Form)
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow
    location: 'Online',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    notes: 'Phỏng vấn vòng 1 về kiến thức chuyên môn và kinh nghiệm thực chiến.'
  });

  // Fetch Jobs to populate filter dropdown
  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await jobsService.getJobs();
      if (res.data?.success && res.data.data) {
        setJobs(res.data.data.items || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách tin tuyển dụng.');
    } finally {
      setJobsLoading(false);
    }
  };

  // Fetch Applications with filters
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedJobId) params.jobId = selectedJobId;
      if (selectedStatus) params.status = selectedStatus;
      if (keyword) params.keyword = keyword.trim();

      const res = await applicationsService.getApplications(params);
      if (res.data?.success) {
        setApplications((res.data.data as any) || []);
      } else {
        setError(res.data?.error?.message || 'Có lỗi xảy ra khi tải dữ liệu.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách hồ sơ ứng tuyển. Vui lòng thử lại.');
      toast.error('Lỗi khi tải danh sách hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [selectedJobId, selectedStatus]);

  // Handle status update
  const handleUpdateStatus = async (appId: number, status: string) => {
    setActiveStatusEditId(null);
    try {
      const res = await applicationsService.changeStatus(appId, status);
      if (res.data?.success) {
        toast.success('Cập nhật trạng thái ứng viên thành công.');
        fetchApplications();
        // Update selected app if drawer is open
        if (selectedApp?.id === appId) {
          setSelectedApp(prev => prev ? { ...prev, status } : null);
        }
      } else {
        toast.error(res.data?.error?.message || 'Lỗi khi cập nhật trạng thái.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối máy chủ.');
    }
  };

  // Handle schedule interview
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingApp) return;

    try {
      const res = await interviewsService.createInterview({
        applicationId: schedulingApp.id,
        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        location: interviewForm.location,
        meetingLink: interviewForm.location === 'Online' ? interviewForm.meetingLink : undefined,
        notes: interviewForm.notes
      });

      if (res.data?.success) {
        toast.success('Gửi lịch mời phỏng vấn thành công.');
        setSchedulingApp(null);
        fetchApplications(); // Refresh list to show status change to INTERVIEW
      } else {
        toast.error(res.data?.error?.message || 'Lỗi khi lên lịch phỏng vấn.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu lịch phỏng vấn.');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPLIED': return styles.badgeApplied;
      case 'SCREENING': return styles.badgeScreening;
      case 'SHORTLISTED': return styles.badgeShortlisted;
      case 'INTERVIEW': return styles.badgeInterview;
      case 'OFFER': return styles.badgeOffer;
      case 'HIRED': return styles.badgeHired;
      case 'REJECTED': return styles.badgeRejected;
      case 'WITHDRAWN': return styles.badgeWithdrawn;
      default: return '';
    }
  };

  const translateStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPLIED': return 'Chờ duyệt';
      case 'SCREENING': return 'Sàng lọc CV';
      case 'SHORTLISTED': return 'Sơ tuyển';
      case 'INTERVIEW': return 'Phỏng vấn';
      case 'OFFER': return 'Đề nghị (Offer)';
      case 'HIRED': return 'Nhận việc (Hired)';
      case 'REJECTED': return 'Từ chối';
      case 'WITHDRAWN': return 'Đã rút đơn';
      default: return status;
    }
  };

  // Define Table Columns
  const columns: ColumnConfig<ApplicationDto>[] = [
    {
      key: 'actions',
      header: 'Hành động',
      width: '120px',
      align: 'center',
      sticky: true,
      render: (row) => (
        <div className={styles.actionGroup} style={{ position: 'relative' }}>
          <button 
            className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveStatusEditId(activeStatusEditId === row.id ? null : row.id);
            }}
            title="Cập nhật trạng thái"
          >
            <Edit2 size={14} />
          </button>
          
          <button 
            className={`${styles.actionBtn} ${styles.actionBtnInterview}`}
            onClick={(e) => {
              e.stopPropagation();
              setSchedulingApp(row);
            }}
            disabled={row.status === 'HIRED' || row.status === 'REJECTED' || row.status === 'WITHDRAWN'}
            title="Lên lịch phỏng vấn"
          >
            <Calendar size={14} />
          </button>
          
          <a 
            href={row.cvFileUrl} 
            download 
            onClick={(e) => e.stopPropagation()}
            className={`${styles.actionBtn} ${styles.actionBtnDownload}`}
            title="Tải CV"
          >
            <Download size={14} />
          </a>

          {activeStatusEditId === row.id && (
            <div className={styles.statusSelectPopover} onClick={(e) => e.stopPropagation()}>
              <button className={styles.statusOption} onClick={() => handleUpdateStatus(row.id, 'SCREENING')}>Đang xem xét</button>
              <button className={styles.statusOption} onClick={() => handleUpdateStatus(row.id, 'SHORTLISTED')}>Shortlisted</button>
              <button className={styles.statusOption} onClick={() => handleUpdateStatus(row.id, 'INTERVIEW')}>Hẹn phỏng vấn</button>
              <button className={styles.statusOption} onClick={() => handleUpdateStatus(row.id, 'OFFER')}>Đề nghị (Offer)</button>
              <button className={styles.statusOption} onClick={() => handleUpdateStatus(row.id, 'HIRED')}>Nhận việc</button>
              <button className={styles.statusOption} onClick={() => handleUpdateStatus(row.id, 'REJECTED')}>Từ chối</button>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'id',
      header: 'Mã hồ sơ',
      width: '100px',
      align: 'center',
      render: (row) => (
        <button 
          onClick={() => setSelectedApp(row)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--color-brand-primary)', 
            fontWeight: 600, 
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          #APP-{row.id}
        </button>
      )
    },
    {
      key: 'candidateName',
      header: 'Họ và tên ứng viên',
      width: '180px',
      render: (row) => (
        <div style={{ fontWeight: 600 }}>{row.candidateName}</div>
      )
    },
    {
      key: 'jobTitle',
      header: 'Vị trí ứng tuyển',
      width: '200px'
    },
    {
      key: 'cvFileUrl',
      header: 'CV đính kèm',
      width: '150px',
      render: (row) => (
        <a 
          href={row.cvFileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-brand-primary)' }}
        >
          <Eye size={12} /> Xem CV (PDF)
        </a>
      )
    },
    {
      key: 'appliedAt',
      header: 'Ngày nộp',
      width: '120px',
      render: (row) => row.appliedAt ? row.appliedAt.split('T')[0] : '—'
    },
    {
      key: 'matchScore',
      header: 'Match Score',
      width: '110px',
      align: 'center',
      render: (row) => row.matchScore ? (
        <span style={{ 
          background: row.matchScore >= 80 ? '#e8f5e9' : row.matchScore >= 50 ? '#fff8e1' : '#fce4ec',
          color: row.matchScore >= 80 ? '#2e7d32' : row.matchScore >= 50 ? '#f59e0b' : '#c62828',
          padding: '2px 8px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '11px'
        }}>
          {row.matchScore}% Match
        </span>
      ) : '—'
    },
    {
      key: 'status',
      header: 'Trạng thái đơn',
      width: '130px',
      align: 'center',
      render: (row) => (
        <span className={`${styles.badge} ${getStatusBadgeClass(row.status)}`}>
          {translateStatus(row.status)}
        </span>
      )
    }
  ];

  return (
    <div className={styles.container} onClick={() => setActiveStatusEditId(null)}>
      <div className={styles.titleArea}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Quản lý hồ sơ ứng tuyển
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            Sàng lọc, phỏng vấn và quản lý trạng thái tuyển dụng ứng viên của công ty.
          </p>
        </div>
        <button className={styles.btnSecondary} onClick={fetchApplications} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Tải lại
        </button>
      </div>

      {/* Filter Panel */}
      <div className={styles.filterPanel}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tin tuyển dụng</span>
          <select 
            className={styles.filterSelect}
            value={selectedJobId} 
            onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : '')}
            disabled={jobsLoading}
          >
            <option value="">Tất cả việc làm đang đăng</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Trạng thái đơn</span>
          <select 
            className={styles.filterSelect}
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="APPLIED">Chờ duyệt (Applied)</option>
            <option value="SCREENING">Đang xem xét (Screening)</option>
            <option value="SHORTLISTED">Sơ tuyển (Shortlisted)</option>
            <option value="INTERVIEW">Hẹn phỏng vấn (Interview)</option>
            <option value="OFFER">Đề nghị (Offer)</option>
            <option value="HIRED">Nhận việc (Hired)</option>
            <option value="REJECTED">Từ chối (Rejected)</option>
            <option value="WITHDRAWN">Đã rút đơn (Withdrawn)</option>
          </select>
        </div>

        <div className={styles.filterGroup} style={{ flex: 1, minWidth: '240px' }}>
          <span className={styles.filterLabel}>Tìm kiếm nhanh</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Nhập tên ứng viên..." 
              className={styles.filterInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className={styles.btnPrimary} onClick={fetchApplications}>Tìm kiếm</button>
          </div>
        </div>
      </div>

      {/* Grid view */}
      {error ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--color-error)',
          background: 'var(--color-bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--color-border-default)'
        }}>
          <p>{error}</p>
          <button className={styles.btnPrimary} onClick={fetchApplications} style={{ marginTop: '12px' }}>Thử lại</button>
        </div>
      ) : (
        <UiDataTable 
          columns={columns}
          data={applications}
          loading={loading}
          emptyText="Không tìm thấy hồ sơ ứng tuyển nào khớp với bộ lọc."
        />
      )}

      {/* DRAWER PANEL (Candidate detail view from right) */}
      {selectedApp && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setSelectedApp(null)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2>Chi tiết Hồ sơ #APP-{selectedApp.id}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedApp(null)}><X size={20} /></button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.infoSection}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Họ và tên:</span>
                  <span className={styles.infoValue} style={{ fontWeight: 700 }}>{selectedApp.candidateName}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email:</span>
                  <span className={styles.infoValue}>{selectedApp.candidateEmail || 'Chưa cung cấp'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Vị trí tuyển dụng:</span>
                  <span className={styles.infoValue}>{selectedApp.jobTitle}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Doanh nghiệp:</span>
                  <span className={styles.infoValue}>{selectedApp.companyName}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Trạng thái:</span>
                  <span className={styles.infoValue}>
                    <span className={`${styles.badge} ${getStatusBadgeClass(selectedApp.status)}`}>
                      {translateStatus(selectedApp.status)}
                    </span>
                  </span>
                </div>
                {selectedApp.coverLetter && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--color-border-default)' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Thư xin việc (Cover Letter):
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', background: 'var(--color-bg-page)', padding: '12px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                      "{selectedApp.coverLetter}"
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Bản CV trực tuyến:
                </span>
                <div className={styles.pdfContainer}>
                  <iframe 
                    src={`${selectedApp.cvFileUrl}#toolbar=0`} 
                    title="PDF Viewer" 
                    className={styles.pdfFrame} 
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SCHEDULE INTERVIEW QUICK MODAL */}
      {schedulingApp && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Lên lịch phỏng vấn: {schedulingApp.candidateName}</h2>
              <button className={styles.closeBtn} onClick={() => setSchedulingApp(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleScheduleInterview}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Vị trí ứng tuyển</label>
                  <input type="text" disabled value={schedulingApp.jobTitle} />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Hình thức phỏng vấn</label>
                    <select 
                      value={interviewForm.location} 
                      onChange={e => setInterviewForm({...interviewForm, location: e.target.value})}
                    >
                      <option value="Online">Phỏng vấn Online</option>
                      <option value="Tại văn phòng">Phỏng vấn Trực tiếp (Tại văn phòng)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Thời gian phỏng vấn</label>
                    <input 
                      type="datetime-local" 
                      required 
                      value={interviewForm.scheduledAt} 
                      onChange={e => setInterviewForm({...interviewForm, scheduledAt: e.target.value})} 
                    />
                  </div>
                </div>
                {interviewForm.location === 'Online' && (
                  <div className={styles.formGroup}>
                    <label>Đường dẫn phòng họp trực tuyến (Google Meet/Zoom)</label>
                    <input 
                      type="url" 
                      required 
                      value={interviewForm.meetingLink} 
                      onChange={e => setInterviewForm({...interviewForm, meetingLink: e.target.value})} 
                    />
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>Ghi chú gửi ứng viên & HR</label>
                  <textarea 
                    rows={3} 
                    value={interviewForm.notes} 
                    onChange={e => setInterviewForm({...interviewForm, notes: e.target.value})} 
                  ></textarea>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setSchedulingApp(null)}>Hủy</button>
                <button type="submit" className={styles.btnPrimary}><Send size={14} /> Gửi lịch mời</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerAppManagePage;
