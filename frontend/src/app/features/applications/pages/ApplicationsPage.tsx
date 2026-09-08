import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, FileText, Send, X, RotateCcw, Building, MessageSquare, Sparkles 
} from 'lucide-react';
import { applicationsService } from '../../../core/services/applications.service';
import { jobsService } from '../../../core/services/jobs.service';
import { interviewsService } from '../../../core/services/interviews.service';
import { authService } from '../../../core/services/auth.service';
import { messagesService } from '../../messages/services/messages.service';
import { toast } from '../../../core/services/toast.service';
import styles from './ApplicationsPage.module.scss';

const KANBAN_STAGES = [
  { key: 'APPLIED', label: 'Ứng tuyển mới', className: styles.columnApplied },
  { key: 'SCREENING', label: 'Sàng lọc CV', className: styles.columnScreening },
  { key: 'SHORTLISTED', label: 'Phù hợp (Shortlist)', className: styles.columnShortlist },
  { key: 'INTERVIEW', label: 'Phỏng vấn', className: styles.columnInterview },
  { key: 'OFFER', label: 'Đề nghị (Offer)', className: styles.columnOffer },
  { key: 'HIRED', label: 'Đã nhận việc (Hired)', className: styles.columnHired },
  { key: 'REJECTED', label: 'Từ chối (Rejected)', className: styles.columnRejected }
];

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const userRole = user?.role || user?.accountType || '';
  const isCandidate = roles.includes('Ứng viên') || userRole === 'CANDIDATE' || userRole === 'User';

  // Applications lists
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Job selection for Employer ATS
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');

  // Drag and drop helper state
  const [draggingCardId, setDraggingCardId] = useState<number | null>(null);

  // Interview Schedule Modal
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [schedulingApp, setSchedulingApp] = useState<any>(null);
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // tomorrow
    location: 'Online',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    notes: 'Phỏng vấn vòng 1 về kiến thức chuyên môn và kinh nghiệm thực chiến.'
  });

  // Fetch employer's jobs to populate selector
  const fetchJobs = async () => {
    if (isCandidate) return;
    try {
      const res = await jobsService.getJobs();
      if (res.data?.success && res.data.data) {
        setJobs(res.data.data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Applications
  const fetchApplications = async (jobId?: number) => {
    setLoading(true);
    try {
      const params: any = {};
      if (jobId) params.jobId = jobId;
      const res = await applicationsService.getApplications(params);
      if (res.data?.success) {
        const items = res.data.data?.items || (res.data.data as any) || [];
        setApplications(items);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách ứng viên.');
    } finally {
      setLoading(false);
    }
  };

  const [shortlistingAppId, setShortlistingAppId] = useState<number | null>(null);

  const handleShortlistAndChat = async (app: any) => {
    setShortlistingAppId(app.id);
    try {
      const res = await messagesService.shortlistAndChat({ applicationId: app.id });
      if (res.data?.success) {
        toast.success(`Đã duyệt ứng viên ${app.candidateName} phù hợp, gửi email thông báo và kích hoạt kênh chat!`);
        fetchApplications(selectedJobId ? Number(selectedJobId) : undefined);
        const convoId = res.data.data?.conversationId;
        if (convoId) {
          navigate(`/messages?conversationId=${convoId}`);
        }
      } else {
        toast.error(res.data?.error?.message || 'Có lỗi xảy ra khi duyệt phù hợp.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi hệ thống khi duyệt hồ sơ.');
    } finally {
      setShortlistingAppId(null);
    }
  };

  const handleOpenChat = async (app: any) => {
    try {
      const res = await messagesService.getByApplicationId(app.id);
      if (res.data?.success && res.data.data?.conversationId) {
        navigate(`/messages?conversationId=${res.data.data.conversationId}`);
      } else {
        navigate('/messages');
      }
    } catch (err) {
      navigate('/messages');
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  // Filter application by job select
  const handleJobSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jobId = e.target.value ? Number(e.target.value) : '';
    setSelectedJobId(jobId);
    fetchApplications(jobId || undefined);
  };

  // DRAG & DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, appId: number) => {
    setDraggingCardId(appId);
    e.dataTransfer.setData('text/plain', appId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingCardId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const appIdStr = e.dataTransfer.getData('text/plain');
    if (!appIdStr) return;
    const appId = Number(appIdStr);

    // Find local app object to check if status actually changed
    const app = applications.find(a => a.id === appId);
    if (!app || app.status === targetStatus) return;

    // Call API to update status
    try {
      // Optimistic UI update
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: targetStatus } : a));

      const res = await applicationsService.updateStatus(appId, targetStatus);
      if (!res.data?.success) {
        // Rollback on fail
        fetchApplications(selectedJobId || undefined);
      } else {
        toast.success(`Chuyển trạng thái ứng viên thành công.`);
      }
    } catch (err) {
      console.error(err);
      fetchApplications(selectedJobId || undefined);
    }
  };

  // Schedule Interview action
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
        setShowInterviewModal(false);
        // Refresh board
        fetchApplications(selectedJobId || undefined);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper score color
  const getScoreStyle = (score: number) => {
    if (score >= 85) return styles.scoreHigh;
    if (score >= 60) return styles.scoreMedium;
    return styles.scoreLow;
  };

  // RENDER: CANDIDATE APPLICATIONS TRACKING WITH PROGRESS BAR
  if (isCandidate) {
    // Helper to calculate progress active line
    const getActiveLineIndex = (status: string) => {
      const statuses = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'];
      const index = statuses.indexOf(status.toUpperCase());
      if (index === -1) return 0;
      if (status === 'REJECTED') return index; // stops at rejection
      return index;
    };

    return (
      <div className={styles.applicationsPage}>
        <div className={styles.titleArea}>
          <div>
            <h1>Theo dõi Lịch sử Ứng tuyển</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
              Theo dõi trực quan quy trình đánh giá CV và tuyển dụng của nhà tuyển dụng đối với hồ sơ của bạn
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>Đang tải lịch sử ứng tuyển...</div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border-default)' }}>
            Bạn chưa nộp hồ sơ vào tin tuyển dụng nào.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {applications.map(app => {
              const activeIndex = getActiveLineIndex(app.status);
              const isRejected = app.status === 'REJECTED';
              
              return (
                <div key={app.id} className={styles.stepperContainer}>
                  <div className={styles.candidateJobCard}>
                    <div>
                      <h3>{app.jobTitle}</h3>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        🏢 {app.companyName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <span>Ngày nộp: {app.appliedAt ? app.appliedAt.split('T')[0] : '—'}</span>
                      {app.coverLetter && (
                        <span style={{ background: 'var(--color-bg-subtle)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          Có Thư giới thiệu
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className={styles.candidateStepper}>
                    <div className={styles.stepperLine}></div>
                    <div 
                      className={styles.stepperLineActive}
                      style={{ width: `${(activeIndex / 5) * 100}%`, backgroundColor: isRejected ? '#ef4444' : 'var(--color-brand-primary)' }}
                    ></div>

                    <div className={`${styles.candStep} ${activeIndex >= 0 ? (isRejected && activeIndex === 0 ? styles.candStepFailed : styles.candStepCompleted) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 0 ? '✓' : '1'}</div>
                      <span className={styles.candStepLabel}>Đã nộp CV</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 1 ? (isRejected && activeIndex === 1 ? styles.candStepFailed : (activeIndex === 1 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 1 ? '✓' : '2'}</div>
                      <span className={styles.candStepLabel}>Sàng lọc</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 2 ? (isRejected && activeIndex === 2 ? styles.candStepFailed : (activeIndex === 2 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 2 ? '✓' : '3'}</div>
                      <span className={styles.candStepLabel}>Shortlist</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 3 ? (isRejected && activeIndex === 3 ? styles.candStepFailed : (activeIndex === 3 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 3 ? '✓' : '4'}</div>
                      <span className={styles.candStepLabel}>Phỏng vấn</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 4 ? (isRejected && activeIndex === 4 ? styles.candStepFailed : (activeIndex === 4 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 4 ? '✓' : '5'}</div>
                      <span className={styles.candStepLabel}>Offer</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 5 ? (app.status === 'HIRED' ? styles.candStepCompleted : styles.candStepActive) : ''}`}>
                      <div className={styles.candStepCircle}>6</div>
                      <span className={styles.candStepLabel}>{isRejected ? 'Bị từ chối' : 'Nhận việc'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // RENDER: EMPLOYER/ADMIN ATS KANBAN BOARD
  return (
    <div className={styles.applicationsPage}>
      {/* Title area */}
      <div className={styles.titleArea}>
        <div>
          <h1>ATS Candidate Tracking System</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            Quản lý phễu ứng viên thông minh. Kéo thả thẻ ứng viên giữa các cột để cập nhật trạng thái tuyển dụng.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.btnSecondary} onClick={() => fetchApplications()}><RotateCcw size={14} /> Tải lại</button>
        </div>
      </div>

      {/* Selector: Choose which job board to view */}
      <div className={styles.jobSelectorBar}>
        <Building size={18} color="var(--color-brand-primary)" />
        <span style={{ fontWeight: 600, fontSize: '14px' }}>Bộ lọc phễu theo tin tuyển dụng:</span>
        <select value={selectedJobId} onChange={handleJobSelectChange}>
          <option value="">Tất cả việc làm của công ty</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
      </div>

      {/* Kanban Board Container */}
      <div className={styles.kanbanBoardContainer}>
        {KANBAN_STAGES.map(stage => {
          // Filter applications belong to this stage
          const stageApps = applications.filter(a => a.status.toUpperCase() === stage.key);
          
          return (
            <div 
              key={stage.key} 
              className={`${styles.kanbanColumn} ${stage.className}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className={styles.columnHeader}>
                <span>{stage.label}</span>
                <span className={styles.columnHeaderBadge}>{stageApps.length}</span>
              </div>

              <div className={styles.cardsContainer}>
                {stageApps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 8px', fontSize: '11px', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border-light)', borderRadius: '8px' }}>
                    Kéo thả ứng viên vào đây
                  </div>
                ) : (
                  stageApps.map(app => (
                    <div 
                      key={app.id} 
                      className={`${styles.kanbanCard} ${draggingCardId === app.id ? styles.kanbanCardActive : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={styles.cardHeader}>
                        <h4 className={styles.candidateName}>{app.candidateName}</h4>
                        <span className={`${styles.matchScoreBadge} ${getScoreStyle(app.matchScore)}`}>
                          {app.matchScore}% Match
                        </span>
                      </div>
                      
                      <div className={styles.cardJobTitle}>Ứng tuyển: {app.jobTitle}</div>
                      
                      {app.coverLetter && (
                        <div style={{ fontSize: '11px', background: 'var(--color-bg-subtle)', padding: '6px', borderRadius: '4px', color: 'var(--color-text-secondary)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          " {app.coverLetter} "
                        </div>
                      )}

                      <div className={styles.cardFooter}>
                        <span className={styles.cardDate}>{app.appliedAt ? app.appliedAt.split('T')[0] : '—'}</span>
                        <div className={styles.cardActions}>
                          <a 
                            href={app.cvFileUrl} 
                            download 
                            className={styles.cardBtn} 
                            title={`Tải CV: ${app.cvTitle}`}
                          >
                            <FileText size={12} />
                          </a>
                          
                          {/* Shortlist & Chat Action */}
                          {stage.key !== 'SHORTLISTED' && stage.key !== 'HIRED' && stage.key !== 'REJECTED' && (
                            <button 
                              className={styles.cardBtn} 
                              onClick={() => handleShortlistAndChat(app)}
                              disabled={shortlistingAppId === app.id}
                              title="Duyệt phù hợp, gửi Email & Mở chat ngay"
                              style={{ color: '#0284c7' }}
                            >
                              <Sparkles size={12} />
                            </button>
                          )}

                          {/* Direct Chat Action */}
                          <button 
                            className={styles.cardBtn} 
                            onClick={() => handleOpenChat(app)}
                            title="Nhắn tin với ứng viên"
                            style={{ color: '#2563eb' }}
                          >
                            <MessageSquare size={12} />
                          </button>

                          {/* Schedule Interview Quick Action */}
                          {stage.key !== 'INTERVIEW' && stage.key !== 'HIRED' && stage.key !== 'REJECTED' && (
                            <button 
                              className={styles.cardBtn} 
                              onClick={() => { setSchedulingApp(app); setShowInterviewModal(true); }}
                              title="Lên lịch phỏng vấn"
                              style={{ color: '#2e7d32' }}
                            >
                              <Calendar size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SCHEDULE INTERVIEW MODAL */}
      {showInterviewModal && schedulingApp && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Lên lịch phỏng vấn: {schedulingApp.candidateName}</h2>
              <button className={styles.closeBtn} onClick={() => setShowInterviewModal(false)}><X size={20} /></button>
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
                    <select value={interviewForm.location} onChange={e => setInterviewForm({...interviewForm, location: e.target.value})}>
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
                <button type="button" className={styles.btnSecondary} onClick={() => setShowInterviewModal(false)}>Hủy</button>
                <button type="submit" className={styles.btnPrimary}><Send size={14} /> Gửi lịch mời</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApplicationsPage;
