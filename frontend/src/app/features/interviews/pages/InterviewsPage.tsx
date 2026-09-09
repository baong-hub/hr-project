import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, CheckCircle, XCircle, Award, X, FileSignature, Search, Filter
} from 'lucide-react';
import { interviewsService, type CreateInterviewEvaluationPayload, type InterviewEvaluation } from '../../../core/services/interviews.service';
import { JobOfferModal } from '../../job-offers/components/JobOfferModal';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';
import styles from './InterviewsPage.module.scss';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: 'Chờ phản hồi', className: styles.badgeScheduled },
  INTERVIEW_INVITATION: { label: 'Chờ phản hồi', className: styles.badgeScheduled },
  INTERVIEW_SCHEDULED: { label: 'Đã xác nhận', className: styles.badgeAccepted },
  ACCEPTED: { label: 'Đã xác nhận', className: styles.badgeAccepted },
  DECLINED: { label: 'Từ chối', className: styles.badgeDeclined },
  CANCELLED: { label: 'Đã hủy', className: styles.badgeCancelled },
  COMPLETED: { label: 'Hoàn thành', className: styles.badgeCompleted },
  INTERVIEW_COMPLETED: { label: 'Hoàn thành', className: styles.badgeCompleted },
  EVALUATION: { label: 'Đang đánh giá', className: styles.badgeScheduled }
};

export const InterviewsPage: React.FC = () => {
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const userRole = user?.role || user?.accountType || '';
  const isCandidate = roles.includes('Ứng viên') || userRole === 'CANDIDATE' || userRole === 'User';
  const isEmployer = roles.includes('Nhà tuyển dụng') || userRole === 'EMPLOYER' || userRole === 'Company' || userRole === 'Admin' || userRole === 'ADMIN';

  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredInterviews = useMemo(() => {
    return (interviews || []).filter(i => {
      if (statusFilter) {
        const s = (i.status || '').toUpperCase();
        if (statusFilter === 'SCHEDULED' && !['SCHEDULED', 'INTERVIEW_INVITATION'].includes(s)) return false;
        if (statusFilter === 'ACCEPTED' && !['ACCEPTED', 'INTERVIEW_SCHEDULED'].includes(s)) return false;
        if (statusFilter === 'COMPLETED' && !['COMPLETED', 'INTERVIEW_COMPLETED', 'EVALUATION'].includes(s)) return false;
        if (statusFilter === 'DECLINED' && s !== 'DECLINED') return false;
        if (statusFilter === 'CANCELLED' && s !== 'CANCELLED') return false;
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchTitle = (i.jobTitle || '').toLowerCase().includes(kw);
        const matchEmployer = (i.employerName || '').toLowerCase().includes(kw);
        const matchCandidate = (i.candidateName || '').toLowerCase().includes(kw);
        if (!matchTitle && !matchEmployer && !matchCandidate) return false;
      }
      return true;
    });
  }, [interviews, statusFilter, searchKeyword]);

  // Evaluation Modal states
  const [selectedInterview, setSelectedInterview] = useState<any | null>(null);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [submittingEval, setSubmittingEval] = useState(false);
  const [evalHistory, setEvalHistory] = useState<InterviewEvaluation[]>([]);
  const [offerModalData, setOfferModalData] = useState<{
    applicationId: number;
    candidateName: string;
    candidateEmail?: string;
    jobTitle: string;
  } | null>(null);
  const [evalForm, setEvalForm] = useState<CreateInterviewEvaluationPayload>({
    technicalScore: 7,
    communicationScore: 7,
    problemSolvingScore: 7,
    experienceScore: 7,
    cultureFitScore: 8,
    salaryExpectationScore: 8,
    result: 'PASS',
    comments: ''
  });

  // Fetch interviews
  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviewsService.getInterviews();
      if (res.data?.success) {
        const raw = res.data.data;
        const items = Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw)
            ? raw
            : [];
        setInterviews(items);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải lịch phỏng vấn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // Update Status
  const handleUpdateStatus = async (id: number, status: string) => {
    let confirmMsg = '';
    if (status === 'ACCEPTED') confirmMsg = 'Xác nhận tham gia buổi phỏng vấn này?';
    else if (status === 'DECLINED') confirmMsg = 'Bạn có chắc chắn muốn từ chối buổi phỏng vấn này?';
    else if (status === 'CANCELLED') confirmMsg = 'Bạn có chắc chắn muốn hủy lịch phỏng vấn này?';
    else if (status === 'COMPLETED') confirmMsg = 'Đánh dấu buổi phỏng vấn đã hoàn thành?';

    if (confirmMsg && !window.confirm(confirmMsg)) return;

    try {
      const res = await interviewsService.updateStatus(id, status);
      if (res.data?.success) {
        toast.success('Cập nhật trạng thái thành công.');
        fetchInterviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Evaluation Modal
  const handleOpenEvaluation = async (interview: any) => {
    setSelectedInterview(interview);
    setEvalModalOpen(true);
    setEvalForm({
      technicalScore: 7,
      communicationScore: 7,
      problemSolvingScore: 7,
      experienceScore: 7,
      cultureFitScore: 8,
      salaryExpectationScore: 8,
      result: 'PASS',
      comments: ''
    });

    try {
      const res = await interviewsService.getEvaluations(interview.id);
      if (res.data?.success) {
        const evals = res.data.data || [];
        setEvalHistory(evals);
        if (evals.length > 0) {
          const last = evals[0];
          setEvalForm({
            technicalScore: last.technicalScore,
            communicationScore: last.communicationScore,
            problemSolvingScore: last.problemSolvingScore,
            experienceScore: last.experienceScore,
            cultureFitScore: last.cultureFitScore,
            salaryExpectationScore: last.salaryExpectationScore,
            result: last.result,
            comments: last.comments || ''
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Evaluation
  const handleSubmitEvaluation = async () => {
    if (!selectedInterview) return;
    setSubmittingEval(true);
    try {
      const res = await interviewsService.submitEvaluation(selectedInterview.id, evalForm);
      if (res.data?.success) {
        toast.success('Lưu đánh giá phỏng vấn thành công!');
        setEvalModalOpen(false);
        fetchInterviews();

        // Nếu ứng viên PASS và có applicationId, mở ngay form phát hành Offer
        if (evalForm.result === 'PASS' && selectedInterview.applicationId) {
          setOfferModalData({
            applicationId: selectedInterview.applicationId,
            candidateName: selectedInterview.candidateName || 'Ứng viên',
            candidateEmail: selectedInterview.candidateEmail,
            jobTitle: selectedInterview.jobTitle || 'Vị trí tuyển dụng'
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Có lỗi khi gửi đánh giá.');
    } finally {
      setSubmittingEval(false);
    }
  };

  const calculatedOverall = Math.round(
    ((evalForm.technicalScore +
      evalForm.communicationScore +
      evalForm.problemSolvingScore +
      evalForm.experienceScore +
      evalForm.cultureFitScore +
      evalForm.salaryExpectationScore) /
      6) *
      10
  ) / 10;

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'Chưa xếp lịch';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.interviewsPage}>
      {/* Title area */}
      <div className={styles.titleArea}>
        <div>
          <h1>Quản lý Lịch phỏng vấn</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            {isCandidate ? 'Theo dõi lời mời phỏng vấn và phản hồi xác nhận tham gia trực tiếp' : 'Xem danh sách, đánh giá chuyên môn và cập nhật tiến độ các buổi phỏng vấn'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
        background: 'var(--color-bg-card)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-default)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-secondary)' }} />
          <input 
            type="text"
            placeholder={isCandidate ? "Tìm theo vị trí hoặc người phỏng vấn..." : "Tìm theo vị trí hoặc tên ứng viên..."}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-default)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
          <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-default)',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)'
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="SCHEDULED">Chờ phản hồi</option>
            <option value="ACCEPTED">Đã xác nhận</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="DECLINED">Từ chối</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        {(searchKeyword || statusFilter) && (
          <button 
            type="button"
            onClick={() => { setSearchKeyword(''); setStatusFilter(''); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-default)',
              background: 'transparent',
              fontSize: '13px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)'
            }}
            title="Xóa bộ lọc"
          >
            Xóa lọc
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {filteredInterviews.length} lịch phỏng vấn
        </div>
      </div>

      {/* Grid table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Vị trí ứng tuyển</th>
                {isCandidate ? <th>Người phỏng vấn (Employer)</th> : <th>Ứng viên (Candidate)</th>}
                <th>Thời gian</th>
                <th>Hình thức / Địa điểm</th>
                <th>Link phòng họp</th>
                <th>Ghi chú</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>Đang tải lịch hẹn...</td></tr>
              ) : (!Array.isArray(interviews) || interviews.length === 0) ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    Bạn chưa có lịch hẹn phỏng vấn nào.
                  </td>
                </tr>
              ) : filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    Không tìm thấy lịch hẹn nào khớp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredInterviews.map(i => {
                  const statusUpper = (i.status || '').toUpperCase();
                  const st = STATUS_MAP[statusUpper] || { label: i.status || '—', className: '' };
                  return (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 600 }}>{i.jobTitle}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={14} color="var(--color-text-secondary)" />
                          <span>{isCandidate ? i.employerName : i.candidateName}</span>
                        </div>
                      </td>
                      <td>{formatDateTime(i.startTime || i.scheduledAt)}</td>
                      <td>{i.interviewType === 'ONLINE' ? 'Trực tuyến (Online)' : (i.locationOrLink || i.location || 'Tại văn phòng')}</td>
                      <td>
                        {(i.locationOrLink?.startsWith('http') || i.meetingLink) ? (
                          <a href={i.locationOrLink?.startsWith('http') ? i.locationOrLink : i.meetingLink} target="_blank" rel="noreferrer" className={styles.meetingLink}>
                            Link phòng họp
                          </a>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>Trực tiếp</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={i.notes}>
                        {i.notes || '—'}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${st.className}`}>{st.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                          {isCandidate && (statusUpper === 'SCHEDULED' || statusUpper === 'INTERVIEW_INVITATION') && (
                            <>
                              <button 
                                className={`${styles.actionBtn} ${styles.btnAccept}`} 
                                onClick={() => handleUpdateStatus(i.id, 'ACCEPTED')} 
                                title="Xác nhận tham gia"
                              >
                                <CheckCircle size={15} />
                              </button>
                              <button 
                                className={`${styles.actionBtn} ${styles.btnDecline}`} 
                                onClick={() => handleUpdateStatus(i.id, 'DECLINED')} 
                                title="Từ chối lời mời"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          {isEmployer && (
                            <>
                              <button 
                                className={`${styles.actionBtn} ${styles.btnEvaluate}`} 
                                onClick={() => handleOpenEvaluation(i)} 
                                title="Đánh giá kết quả phỏng vấn"
                              >
                                <Award size={14} />
                              </button>
                              {i.applicationId && (
                                <button
                                  className={styles.actionBtn}
                                  style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                                  onClick={() => setOfferModalData({
                                    applicationId: i.applicationId,
                                    candidateName: i.candidateName || 'Ứng viên',
                                    candidateEmail: i.candidateEmail,
                                    jobTitle: i.jobTitle || 'Vị trí nhận việc'
                                  })}
                                  title="Phát hành Thư Mời Nhận Việc (Job Offer)"
                                >
                                  <FileSignature size={14} />
                                </button>
                              )}
                              {statusUpper !== 'CANCELLED' && statusUpper !== 'COMPLETED' && statusUpper !== 'INTERVIEW_COMPLETED' && (
                                <>
                                  <button 
                                    className={styles.actionBtn} 
                                    style={{ color: '#2e7d32', borderColor: '#c6f6d5' }} 
                                    onClick={() => handleUpdateStatus(i.id, 'COMPLETED')} 
                                    title="Đánh dấu hoàn thành"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button 
                                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`} 
                                    onClick={() => handleUpdateStatus(i.id, 'CANCELLED')} 
                                    title="Hủy lịch hẹn"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Modal */}
      {evalModalOpen && selectedInterview && (
        <div className={styles.modalOverlay} onClick={() => setEvalModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                Đánh Giá Phỏng Vấn: {selectedInterview.candidateName}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setEvalModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Overall score banner */}
              <div className={styles.scoreBanner}>
                <div>
                  <div className={styles.scoreBannerTitle}>Điểm Đánh Giá Tổng Kết (Overall Score)</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                    Vị trí: <strong>{selectedInterview.jobTitle}</strong>
                  </div>
                </div>
                <div className={styles.scoreBannerValue}>{calculatedOverall} / 10</div>
              </div>

              {/* 6 criteria grid */}
              <div className={styles.criteriaGrid}>
                {/* 1. Technical */}
                <div className={styles.criterionCard}>
                  <div className={styles.criterionHeader}>
                    <span>1. Chuyên môn & Kỹ thuật</span>
                    <span className={styles.criterionScore}>{evalForm.technicalScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    className={styles.criterionSlider}
                    value={evalForm.technicalScore}
                    onChange={e => setEvalForm({ ...evalForm, technicalScore: parseFloat(e.target.value) })}
                  />
                </div>

                {/* 2. Communication */}
                <div className={styles.criterionCard}>
                  <div className={styles.criterionHeader}>
                    <span>2. Kỹ năng giao tiếp</span>
                    <span className={styles.criterionScore}>{evalForm.communicationScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    className={styles.criterionSlider}
                    value={evalForm.communicationScore}
                    onChange={e => setEvalForm({ ...evalForm, communicationScore: parseFloat(e.target.value) })}
                  />
                </div>

                {/* 3. Problem Solving */}
                <div className={styles.criterionCard}>
                  <div className={styles.criterionHeader}>
                    <span>3. Giải quyết vấn đề</span>
                    <span className={styles.criterionScore}>{evalForm.problemSolvingScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    className={styles.criterionSlider}
                    value={evalForm.problemSolvingScore}
                    onChange={e => setEvalForm({ ...evalForm, problemSolvingScore: parseFloat(e.target.value) })}
                  />
                </div>

                {/* 4. Experience */}
                <div className={styles.criterionCard}>
                  <div className={styles.criterionHeader}>
                    <span>4. Kinh nghiệm thực tế</span>
                    <span className={styles.criterionScore}>{evalForm.experienceScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    className={styles.criterionSlider}
                    value={evalForm.experienceScore}
                    onChange={e => setEvalForm({ ...evalForm, experienceScore: parseFloat(e.target.value) })}
                  />
                </div>

                {/* 5. Culture Fit */}
                <div className={styles.criterionCard}>
                  <div className={styles.criterionHeader}>
                    <span>5. Phù hợp văn hóa</span>
                    <span className={styles.criterionScore}>{evalForm.cultureFitScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    className={styles.criterionSlider}
                    value={evalForm.cultureFitScore}
                    onChange={e => setEvalForm({ ...evalForm, cultureFitScore: parseFloat(e.target.value) })}
                  />
                </div>

                {/* 6. Salary Expectation */}
                <div className={styles.criterionCard}>
                  <div className={styles.criterionHeader}>
                    <span>6. Mức lương kỳ vọng</span>
                    <span className={styles.criterionScore}>{evalForm.salaryExpectationScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    className={styles.criterionSlider}
                    value={evalForm.salaryExpectationScore}
                    onChange={e => setEvalForm({ ...evalForm, salaryExpectationScore: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              {/* Evaluation Result Decision */}
              <div className={styles.resultGroup}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Kết Luận Đánh Giá:
                </label>
                <div className={styles.resultOptions}>
                  <div
                    className={`${styles.resultOption} ${evalForm.result === 'PASS' ? styles.resultOptionPassActive : ''}`}
                    onClick={() => setEvalForm({ ...evalForm, result: 'PASS' })}
                  >
                    Đạt (Chuyển sang Offer)
                  </div>
                  <div
                    className={`${styles.resultOption} ${evalForm.result === 'NEXT_ROUND' ? styles.resultOptionNextActive : ''}`}
                    onClick={() => setEvalForm({ ...evalForm, result: 'NEXT_ROUND' })}
                  >
                    Phỏng vấn vòng tiếp
                  </div>
                  <div
                    className={`${styles.resultOption} ${evalForm.result === 'FAIL' ? styles.resultOptionFailActive : ''}`}
                    onClick={() => setEvalForm({ ...evalForm, result: 'FAIL' })}
                  >
                    Chưa phù hợp
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className={styles.commentGroup}>
                <label>Nhận xét chi tiết & Lời nhắn phỏng vấn:</label>
                <textarea
                  className={styles.commentInput}
                  placeholder="Điểm mạnh, điểm cần cải thiện, đánh giá năng lực nổi bật..."
                  value={evalForm.comments || ''}
                  onChange={e => setEvalForm({ ...evalForm, comments: e.target.value })}
                />
              </div>

              {/* Previous evaluations history if exists */}
              {evalHistory.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: '#6b7280' }}>
                    Lịch sử các lần chấm trước:
                  </div>
                  {evalHistory.map((h, idx) => (
                    <div key={h.id || idx} className={styles.evalHistoryItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>Kết quả: {h.result} ({h.overallScore}/10)</strong>
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{formatDateTime(h.createdAt)}</span>
                      </div>
                      {h.comments && <div style={{ color: '#4b5563', fontSize: '0.8rem' }}>"{h.comments}"</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setEvalModalOpen(false)} disabled={submittingEval}>
                Hủy bỏ
              </button>
              <button 
                className={styles.btnPrimary} 
                onClick={handleSubmitEvaluation}
                disabled={submittingEval}
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
              >
                {submittingEval ? 'Đang lưu...' : 'Lưu Kết Quả Đánh Giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Offer Modal */}
      {offerModalData && (
        <JobOfferModal
          applicationId={offerModalData.applicationId}
          candidateName={offerModalData.candidateName}
          candidateEmail={offerModalData.candidateEmail}
          jobTitle={offerModalData.jobTitle}
          onClose={() => setOfferModalData(null)}
          onSuccess={() => {
            setOfferModalData(null);
            fetchInterviews();
          }}
        />
      )}
    </div>
  );
};
export default InterviewsPage;
