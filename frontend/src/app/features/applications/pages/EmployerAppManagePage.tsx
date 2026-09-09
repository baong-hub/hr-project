import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Calendar, Download, X, RefreshCw, Sparkles, Brain, ChevronDown, ChevronUp, Copy, CheckCheck, CheckCircle2, XCircle, Award } from 'lucide-react';
import { applicationsService } from '../../../core/services/applications.service';
import { jobsService } from '../../../core/services/jobs.service';
import { interviewsService } from '../../../core/services/interviews.service';
import { aiService, type JobFitAnalysisResult, type InterviewQuestionsResult } from '../../../core/services/ai.service';
import { technicalTestService } from '../../../core/services/technical-test.service';
import { type TechnicalTestSummary, type TestDetailResult, type AssessmentQuestionReview } from '../../../core/models/technical-test.model';
import { jobOfferService } from '../../../core/services/job-offer.service';
import type { JobOffer } from '../../../core/models/job-offer.model';
import { JobOfferModal } from '../../job-offers/components/JobOfferModal';
import { toast } from '../../../core/services/toast.service';
import type { ApplicationDto } from '../../../core/models/application.model';
import type { JobDto } from '../../../core/models/job.model';
import { UiDataTable, type ColumnConfig } from '../../../shared/ui/DataTable/UiDataTable';
import styles from './EmployerAppManagePage.module.scss';

export const EmployerAppManagePage: React.FC = () => {
  const navigate = useNavigate();
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

  // AI Copilot States
  const [aiAnalyzingId, setAiAnalyzingId] = useState<number | null>(null);
  const [aiMatchResult, setAiMatchResult] = useState<JobFitAnalysisResult | null>(null);
  const [showAiMatchModal, setShowAiMatchModal] = useState(false);
  const [aiMatchApp, setAiMatchApp] = useState<ApplicationDto | null>(null);
  const [aiScoreCache, setAiScoreCache] = useState<Record<number, JobFitAnalysisResult>>({});
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  // AI Interview Questions States
  const [aiQuestionsApp, setAiQuestionsApp] = useState<ApplicationDto | null>(null);
  const [aiQuestionsResult, setAiQuestionsResult] = useState<InterviewQuestionsResult | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  // Online Technical Assessment States
  const [appTests, setAppTests] = useState<Record<number, TechnicalTestSummary>>({});
  const [invitingTestAppId, setInvitingTestAppId] = useState<number | null>(null);
  const [selectedTestDetail, setSelectedTestDetail] = useState<TestDetailResult | null>(null);
  const [, setLoadingTestDetail] = useState<boolean>(false);

  // Job Offer States
  const [appOffers, setAppOffers] = useState<Record<number, JobOffer>>({});
  const [selectedOfferApp, setSelectedOfferApp] = useState<ApplicationDto | null>(null);

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
      const res = await jobsService.getJobs({ pageSize: 100 });
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
  const fetchApplications = async (overrideParams?: { jobId?: number | ''; status?: string; keyword?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const activeJobId = overrideParams?.jobId !== undefined ? overrideParams.jobId : selectedJobId;
      const activeStatus = overrideParams?.status !== undefined ? overrideParams.status : selectedStatus;
      const activeKeyword = overrideParams?.keyword !== undefined ? overrideParams.keyword : keyword;

      const params: any = {};
      if (activeJobId) params.jobId = activeJobId;
      if (activeStatus) params.status = activeStatus;
      if (activeKeyword && activeKeyword.trim()) params.keyword = activeKeyword.trim();

      const [res, resOffers] = await Promise.all([
        applicationsService.getApplications(params),
        jobOfferService.getEmployerOffers().catch(() => ({ data: { data: [] } as any }))
      ]);

      if (res.data?.success) {
        const items = res.data.data?.items || (res.data.data as any) || [];
        setApplications(items);

        // Lưu thông tin các Offer
        const rawOffers: JobOffer[] = (resOffers as any)?.data?.data || [];
        const offerMap: Record<number, JobOffer> = {};
        rawOffers.forEach((o: JobOffer) => {
          offerMap[o.applicationId] = o;
        });
        setAppOffers(offerMap);

        // Tải thông tin các bài test cho danh sách hồ sơ
        const uniqueJobIds = [...new Set(items.map((a: ApplicationDto) => a.jobId))];
        if (uniqueJobIds.length > 0) {
          try {
            const testResponses = await Promise.all(
              uniqueJobIds.map(jId => technicalTestService.getTestsByJob(Number(jId)).catch(() => ({ data: [] })))
            );
            const testMap: Record<number, TechnicalTestSummary> = {};
            testResponses.forEach(r => {
              (r.data || []).forEach((t: TechnicalTestSummary) => {
                testMap[t.applicationId] = t;
              });
            });
            setAppTests(testMap);
          } catch { }
        }
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

  // Mời ứng viên làm bài test
  const handleInviteTest = async (app: ApplicationDto) => {
    try {
      setInvitingTestAppId(app.id);
      const res = await technicalTestService.inviteCandidate({ applicationId: app.id });
      if (res.data) {
        setAppTests(prev => ({ ...prev, [app.id]: res.data! }));
        toast.success(`Đã gửi lời mời làm bài test năng lực tới ứng viên ${app.candidateName}!`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi lời mời làm bài test.');
    } finally {
      setInvitingTestAppId(null);
    }
  };

  // Xem chi tiết bài làm của ứng viên
  const handleViewTestDetail = async (testId: number) => {
    try {
      setLoadingTestDetail(true);
      const res = await technicalTestService.getTestResult(testId);
      if (res.data) {
        setSelectedTestDetail(res.data);
      }
    } catch {
      toast.error('Không thể tải bài làm chi tiết.');
    } finally {
      setLoadingTestDetail(false);
    }
  };

  // Filtered applications for instant reactive search and sync
  const filteredApplications = React.useMemo(() => {
    return applications.filter(app => {
      // 1. Filter by Job ID
      if (selectedJobId && Number(app.jobId) !== Number(selectedJobId)) {
        return false;
      }
      // 2. Filter by Status
      if (selectedStatus && app.status.toUpperCase() !== selectedStatus.toUpperCase()) {
        return false;
      }
      // 3. Filter by Keyword (Candidate name, email, job title, ID)
      if (keyword && keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        const appIdFull = `#app-${app.id}`.toLowerCase();
        const appIdNum = String(app.id);
        const name = (app.candidateName || '').toLowerCase();
        const email = (app.candidateEmail || '').toLowerCase();
        const jobTitle = (app.jobTitle || '').toLowerCase();

        const match = 
          name.includes(kw) || 
          email.includes(kw) || 
          jobTitle.includes(kw) || 
          appIdFull.includes(kw) || 
          appIdNum === kw;

        if (!match) return false;
      }
      return true;
    });
  }, [applications, selectedJobId, selectedStatus, keyword]);

  const handleJobFilterChange = (jobIdVal: number | '') => {
    setSelectedJobId(jobIdVal);
    fetchApplications({ jobId: jobIdVal });
  };

  const handleStatusFilterChange = (statusVal: string) => {
    setSelectedStatus(statusVal);
    fetchApplications({ status: statusVal });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchApplications();
  };

  const handleResetFilters = () => {
    setSelectedJobId('');
    setSelectedStatus('');
    setKeyword('');
    fetchApplications({ jobId: '', status: '', keyword: '' });
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

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

  // AI Match Score Handler
  const handleAiAnalyze = async (app: ApplicationDto) => {
    setAiAnalyzingId(app.id);
    setAiMatchApp(app);
    try {
      const res = await aiService.analyzeJobFit(app.jobId);
      if (res.data?.success && res.data.data) {
        const result = res.data.data;
        setAiMatchResult(result);
        setShowAiMatchModal(true);
        // Cache kết quả vào bảng
        setAiScoreCache(prev => ({ ...prev, [app.id]: result }));
        toast.success('AI đã phân tích xong mức độ phù hợp!');
      } else {
        toast.error(res.data?.error?.message || 'Không thể phân tích AI Match.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối AI. Vui lòng thử lại.');
    } finally {
      setAiAnalyzingId(null);
    }
  };

  // Batch AI Sàng lọc tất cả
  const handleBatchAnalyze = async () => {
    const unanalyzed = applications.filter(a => !aiScoreCache[a.id] && a.status !== 'WITHDRAWN');
    if (unanalyzed.length === 0) {
      toast.success('Tất cả hồ sơ đã được AI phân tích!');
      return;
    }
    setBatchAnalyzing(true);
    setBatchProgress({ done: 0, total: unanalyzed.length });
    for (let i = 0; i < unanalyzed.length; i++) {
      const app = unanalyzed[i];
      try {
        const res = await aiService.analyzeJobFit(app.jobId);
        if (res.data?.success && res.data.data) {
          setAiScoreCache(prev => ({ ...prev, [app.id]: res.data.data }));
        }
      } catch {
        // Skip failed ones silently
      }
      setBatchProgress({ done: i + 1, total: unanalyzed.length });
    }
    setBatchAnalyzing(false);
    toast.success(`AI đã sàng lọc xong ${unanalyzed.length} hồ sơ!`);
  };

  // Helper: Lấy gợi ý phỏng vấn dựa trên match score
  const getInterviewRecommendation = (score: number) => {
    if (score >= 80) return { text: '✅ Nên mời phỏng vấn ngay', color: '#059669', bg: '#ecfdf5', icon: '🔥' };
    if (score >= 60) return { text: '🤔 Cân nhắc mời phỏng vấn — cần đánh giá thêm', color: '#d97706', bg: '#fffbeb', icon: '⚠️' };
    return { text: '❌ Chưa khuyến nghị phỏng vấn — hồ sơ chưa phù hợp', color: '#dc2626', bg: '#fef2f2', icon: '🚫' };
  };

  // Helper: Label hiển thị trên bảng
  const getMatchLabel = (score: number) => {
    if (score >= 80) return '⭐ Rất phù hợp';
    if (score >= 60) return '👍 Khá phù hợp';
    if (score >= 40) return '⚡ Tiềm năng';
    return '⛔ Chưa phù hợp';
  };

  // AI Interview Questions Handler
  const handleGenerateQuestions = async (app: ApplicationDto) => {
    setAiQuestionsApp(app);
    setGeneratingQuestions(true);
    setAiQuestionsResult(null);
    setExpandedCategories({ 0: true });
    try {
      const res = await aiService.generateInterviewQuestions(app.jobId, app.candidateId);
      if (res.data?.success && res.data.data) {
        setAiQuestionsResult(res.data.data);
        toast.success('AI đã sinh bộ câu hỏi phỏng vấn thành công!');
      } else {
        toast.error(res.data?.error?.message || 'Không thể sinh câu hỏi phỏng vấn.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi sinh câu hỏi phỏng vấn AI.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleCopyQuestion = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestion(text);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  const toggleCategory = (idx: number) => {
    setExpandedCategories(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getDifficultyStyle = (diff: string) => {
    switch (diff) {
      case 'Easy': return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'Medium': return { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' };
      case 'Hard': return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
      default: return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
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
      width: '230px',
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

          {/* AI Match Score Button */}
          <button
            className={`${styles.actionBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              handleAiAnalyze(row);
            }}
            disabled={aiAnalyzingId === row.id}
            title="AI Phân tích độ phù hợp"
            style={{
              color: '#7c3aed',
              borderColor: '#ddd6fe',
              background: aiAnalyzingId === row.id ? '#f5f3ff' : '#ffffff'
            }}
          >
            {aiAnalyzingId === row.id ? (
              <div style={{ width: '14px', height: '14px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Sparkles size={14} />
            )}
          </button>

          {/* AI Interview Questions Button */}
          <button
            className={`${styles.actionBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              handleGenerateQuestions(row);
            }}
            disabled={row.status === 'HIRED' || row.status === 'REJECTED' || row.status === 'WITHDRAWN'}
            title="AI Gợi ý câu hỏi phỏng vấn"
            style={{ color: '#0891b2', borderColor: '#cffafe' }}
          >
            <Brain size={14} />
          </button>

          {/* Job Offer Button */}
          <button
            className={`${styles.actionBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOfferApp(row);
            }}
            disabled={row.status === 'REJECTED' || row.status === 'WITHDRAWN'}
            title={appOffers[row.id] ? `Xem / Cập nhật Thư mời nhận việc (${appOffers[row.id].status})` : 'Phát hành Thư mời nhận việc (Job Offer)'}
            style={{
              color: appOffers[row.id]?.status === 'ACCEPTED' ? '#059669' : appOffers[row.id]?.status === 'NEGOTIATING' ? '#d97706' : '#0284c7',
              borderColor: appOffers[row.id] ? '#bfdbfe' : '#e2e8f0',
              background: appOffers[row.id]?.status === 'ACCEPTED' ? '#ecfdf5' : appOffers[row.id]?.status === 'NEGOTIATING' ? '#fffbeb' : appOffers[row.id] ? '#eff6ff' : '#ffffff',
              position: 'relative'
            }}
          >
            <Award size={14} />
            {appOffers[row.id]?.status === 'NEGOTIATING' && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#f59e0b',
                border: '1px solid #ffffff'
              }} />
            )}
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
      width: '110px',
      align: 'center',
      render: (row) => (
        <button 
          onClick={() => setSelectedApp(row)}
          style={{ 
            background: '#f8fafc', 
            border: '1px solid #cbd5e1', 
            color: '#1e293b', 
            fontWeight: 700, 
            fontSize: '0.82rem',
            padding: '4px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Bấm để xem chi tiết hồ sơ"
        >
          #APP-{row.id}
        </button>
      )
    },
    {
      key: 'candidateName',
      header: 'Họ và tên ứng viên',
      width: '230px',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{row.candidateName}</div>
          {row.candidateEmail && (
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>{row.candidateEmail}</div>
          )}
        </div>
      )
    },
    {
      key: 'jobTitle',
      header: 'Vị trí ứng tuyển',
      width: '260px',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', lineHeight: '1.4' }}>
            {row.jobTitle}
          </div>
          {row.companyName && (
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
              {row.companyName}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'cvFileUrl',
      header: 'CV đính kèm',
      width: '160px',
      align: 'center',
      render: (row) => (
        <a 
          href={row.cvFileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '6px 12px',
            borderRadius: '8px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            fontWeight: 600,
            fontSize: '0.8rem',
            textDecoration: 'none'
          }}
        >
          Xem CV (PDF)
        </a>
      )
    },
    {
      key: 'appliedAt',
      header: 'Ngày nộp',
      width: '130px',
      align: 'center',
      render: (row) => (
        <span style={{ color: '#475569', fontWeight: 500, fontSize: '0.85rem' }}>
          {row.appliedAt ? row.appliedAt.split('T')[0] : '—'}
        </span>
      )
    },
    {
      key: 'matchScore',
      header: 'AI Match Score',
      width: '170px',
      align: 'center',
      render: (row) => {
        const cached = aiScoreCache[row.id];
        const score = cached?.matchScore || row.matchScore;
        if (!score) {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); handleAiAnalyze(row); }}
              disabled={aiAnalyzingId === row.id}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '8px',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                opacity: aiAnalyzingId === row.id ? 0.7 : 1
              }}
            >
              {aiAnalyzingId === row.id ? (
                <><div style={{ width: '10px', height: '10px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Đang phân tích...</>
              ) : (
                'AI Sàng lọc'
              )}
            </button>
          );
        }
        const label = getMatchLabel(score);
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (cached) {
                setAiMatchResult(cached);
                setAiMatchApp(row);
                setShowAiMatchModal(true);
              } else {
                handleAiAnalyze(row);
              }
            }}
            title="Click để xem chi tiết phân tích AI"
          >
            <div style={{
              background: score >= 80 ? '#ecfdf5' : score >= 60 ? '#fffbeb' : score >= 40 ? '#f0f9ff' : '#fef2f2',
              border: `1px solid ${score >= 80 ? '#a7f3d0' : score >= 60 ? '#fde68a' : score >= 40 ? '#bae6fd' : '#fecaca'}`,
              padding: '4px 8px', borderRadius: '10px', textAlign: 'center' as const
            }}>
              <div style={{
                fontSize: '0.95rem', fontWeight: 800,
                color: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : score >= 40 ? '#0284c7' : '#dc2626'
              }}>
                {score}%
              </div>
              <div style={{
                fontSize: '0.65rem', fontWeight: 600,
                color: score >= 80 ? '#065f46' : score >= 60 ? '#92400e' : score >= 40 ? '#0369a1' : '#991b1b',
                marginTop: '1px'
              }}>
                {label}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'assessmentTest',
      header: 'Bài Test Năng Lực',
      width: '190px',
      align: 'center',
      render: (row) => {
        const test = appTests[row.id];
        if (!test) {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); handleInviteTest(row); }}
              disabled={invitingTestAppId === row.id || row.status === 'HIRED' || row.status === 'REJECTED'}
              style={{
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Gửi bài kiểm tra năng lực online"
            >
              {invitingTestAppId === row.id ? (
                <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Đang gửi...</>
              ) : (
                'Mời làm test'
              )}
            </button>
          );
        }

        if (test.status === 'PASSED') {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <span
                style={{
                  background: '#d1fae5',
                  color: '#065f46',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  border: '1px solid #a7f3d0'
                }}
                onClick={(e) => { e.stopPropagation(); handleViewTestDetail(test.id); }}
                title="Bấm để xem chi tiết bài làm"
              >
                Đạt: {test.score}%
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setSchedulingApp(row); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#059669',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Lên lịch PV ngay!
              </button>
            </div>
          );
        }

        if (test.status === 'FAILED') {
          return (
            <span
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid #fecaca'
              }}
              onClick={(e) => { e.stopPropagation(); handleViewTestDetail(test.id); }}
              title="Bấm để xem chi tiết bài làm"
            >
              Chưa đạt: {test.score}%
            </span>
          );
        }

        if (test.status === 'IN_PROGRESS') {
          return (
            <span style={{
              background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.76rem', fontWeight: 600, border: '1px solid #bfdbfe'
            }}>
              Đang làm bài...
            </span>
          );
        }

        return (
          <span style={{
            background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.76rem', fontWeight: 500, border: '1px solid #e2e8f0'
          }}>
            Đã gửi lời mời
          </span>
        );
      }
    },
    {
      key: 'jobOffer',
      header: 'Thư Mời Nhận Việc',
      width: '230px',
      align: 'center',
      render: (row) => {
        const offer = appOffers[row.id];
        if (!offer) {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOfferApp(row);
              }}
              disabled={row.status === 'REJECTED' || row.status === 'WITHDRAWN'}
              style={{
                background: '#f8fafc',
                color: '#0284c7',
                border: '1px dashed #93c5fd',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Phát hành Thư Mời Nhận Việc"
            >
              Phát hành Offer
            </button>
          );
        }

        if (offer.status === 'ACCEPTED') {
          return (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOfferApp(row);
              }}
              title="Bấm để xem chi tiết Thư mời đã chấp nhận"
            >
              Đã nhận việc ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(offer.totalSalary)})
            </div>
          );
        }

        if (offer.status === 'NEGOTIATING') {
          return (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fde68a',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOfferApp(row);
              }}
              title={offer.candidateResponseNote ? `Ứng viên thương lượng: ${offer.candidateResponseNote}` : 'Ứng viên đề xuất thương lượng'}
            >
              Yêu cầu thương lượng
            </div>
          );
        }

        if (offer.status === 'DECLINED') {
          return (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOfferApp(row);
              }}
              title={`Ứng viên từ chối: ${offer.declineReason || 'Lý do cá nhân'}`}
            >
              Đã từ chối Offer
            </div>
          );
        }

        return (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOfferApp(row);
            }}
            title="Đang chờ ứng viên phản hồi. Bấm để xem/chỉnh sửa"
          >
            Đã gửi ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(offer.totalSalary)})
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Trạng thái đơn',
      width: '170px',
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/applications')}
            style={{
              background: '#ffffff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Chuyển sang dạng Bảng Phễu Kanban"
          >
            Phễu Tuyển Dụng (Kanban)
          </button>
          <button
            onClick={() => navigate('/employer/assessments')}
            style={{
              background: '#ffffff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Quản lý Đề thi Online
          </button>
          <button
            onClick={handleBatchAnalyze}
            disabled={batchAnalyzing || applications.length === 0}
            style={{
              background: batchAnalyzing
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px',
              fontSize: '0.82rem', fontWeight: 700, cursor: batchAnalyzing ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
              opacity: applications.length === 0 ? 0.5 : 1
            }}
          >
            {batchAnalyzing ? (
              <>
                <div style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                AI Sàng lọc... ({batchProgress.done}/{batchProgress.total})
              </>
            ) : (
              'AI Sàng lọc tất cả'
            )}
          </button>
          <button className={styles.btnSecondary} onClick={() => fetchApplications()} disabled={loading}>
            Tải lại
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className={styles.filterPanel}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tin tuyển dụng</span>
          <select 
            className={styles.filterSelect}
            value={selectedJobId} 
            onChange={(e) => handleJobFilterChange(e.target.value ? Number(e.target.value) : '')}
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
            onChange={(e) => handleStatusFilterChange(e.target.value)}
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

        <div className={styles.filterGroup} style={{ flex: 1, minWidth: '260px' }}>
          <span className={styles.filterLabel}>Tìm kiếm nhanh</span>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Nhập tên ứng viên, email, mã #APP..." 
              className={styles.filterInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className={styles.btnPrimary}>Tìm kiếm</button>
            {(selectedJobId !== '' || selectedStatus !== '' || keyword.trim() !== '') && (
              <button 
                type="button"
                className={styles.btnSecondary} 
                onClick={handleResetFilters}
                title="Xóa bộ lọc"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                Xóa lọc
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Filter summary status strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
        <div>
          {selectedJobId !== '' || selectedStatus !== '' || keyword.trim() !== '' ? (
            <span>
              Đang lọc hồ sơ: hiển thị <strong style={{ color: 'var(--color-text-primary)' }}>{filteredApplications.length}</strong> / {applications.length} kết quả
            </span>
          ) : (
            <span>
              Tổng số hồ sơ ứng tuyển: <strong style={{ color: 'var(--color-text-primary)' }}>{applications.length}</strong>
            </span>
          )}
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
          <button className={styles.btnPrimary} onClick={() => fetchApplications()} style={{ marginTop: '12px' }}>Thử lại</button>
        </div>
      ) : (
        <UiDataTable 
          columns={columns}
          data={filteredApplications}
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

                {/* Job Offer Info in Drawer */}
                <div style={{ marginTop: '14px', padding: '14px', borderRadius: '10px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369a1' }}>
                        📄 Thư Mời Nhận Việc (Job Offer)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: '2px' }}>
                        {appOffers[selectedApp.id] 
                          ? `Trạng thái: ${appOffers[selectedApp.id].status} • Lương: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appOffers[selectedApp.id].totalSalary)}` 
                          : 'Chưa phát hành đề xuất nhận việc cho ứng viên này.'}
                      </div>
                    </div>
                    <button
                      className={styles.btnPrimary}
                      style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#0284c7', border: 'none' }}
                      onClick={() => setSelectedOfferApp(selectedApp)}
                    >
                      {appOffers[selectedApp.id] ? 'Xem / Cập nhật Offer' : '+ Phát hành Offer'}
                    </button>
                  </div>
                </div>
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
                <button type="submit" className={styles.btnPrimary}>Gửi lịch mời</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI MATCH SCORE MODAL */}
      {showAiMatchModal && aiMatchResult && aiMatchApp && (
        <div className={styles.modalOverlay} style={{ backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div className={styles.modalContent} style={{ maxWidth: '620px', width: '92%', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Header gradient bar */}
            <div style={{
              background: aiMatchResult.matchScore >= 80
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                : aiMatchResult.matchScore >= 60
                  ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
                  : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              padding: '20px 24px',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 800
                  }}>
                    {aiMatchResult.matchScore}%
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>AI Match Score: {aiMatchResult.matchLevel}</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                      {aiMatchApp.candidateName} → {aiMatchApp.jobTitle}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAiMatchModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
              {/* AI Interview Recommendation Banner */}
              {(() => {
                const rec = getInterviewRecommendation(aiMatchResult.matchScore);
                return (
                  <div style={{
                    background: rec.bg,
                    border: `1px solid ${rec.color}20`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{rec.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: rec.color }}>
                        GỢI Ý PHỎNG VẤN
                      </div>
                      <div style={{ fontSize: '0.83rem', color: rec.color, marginTop: '2px' }}>
                        {rec.text}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Summary */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', borderLeft: '3px solid #6366f1' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>{aiMatchResult.summary}</p>
              </div>

              {/* Strengths */}
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>✅ Điểm mạnh cốt lõi</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {aiMatchResult.strengths.map((s, i) => (
                    <div key={i} style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', fontSize: '0.83rem', color: '#166534', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>💎</span> {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>⚠️ Kỹ năng còn thiếu</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {aiMatchResult.missingSkills.map((s, i) => (
                    <div key={i} style={{ background: '#fffbeb', padding: '8px 12px', borderRadius: '8px', fontSize: '0.83rem', color: '#92400e', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>📌</span> {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5' }}>💡 Khuyến nghị cho Nhà tuyển dụng</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {aiMatchResult.recommendations.map((r, i) => (
                    <div key={i} style={{ background: '#eef2ff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.83rem', color: '#3730a3', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>🎯</span> {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className={styles.btnSecondary} onClick={() => setShowAiMatchModal(false)}>Đóng</button>
              <button
                className={styles.btnPrimary}
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                onClick={() => {
                  if (aiMatchApp) {
                    setShowAiMatchModal(false);
                    setSchedulingApp(aiMatchApp);
                  }
                }}
              >
                Lên lịch phỏng vấn ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI INTERVIEW QUESTIONS MODAL */}
      {aiQuestionsApp && (
        <div className={styles.modalOverlay} style={{ backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div className={styles.modalContent} style={{ maxWidth: '780px', width: '95%', borderRadius: '16px', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
              padding: '20px 24px',
              color: '#fff',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Brain size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>AI Gợi ý Câu hỏi Phỏng vấn</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', opacity: 0.9 }}>
                      {aiQuestionsApp.candidateName} — {aiQuestionsApp.jobTitle}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setAiQuestionsApp(null); setAiQuestionsResult(null); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {generatingQuestions ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{
                    width: '48px', height: '48px', border: '3px solid #0891b2',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 1s linear infinite', margin: '0 auto 16px'
                  }} />
                  <p style={{ color: '#0891b2', fontWeight: 600, fontSize: '0.95rem' }}>AI đang phân tích JD và hồ sơ ứng viên...</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Quá trình này có thể mất 5-15 giây</p>
                </div>
              ) : aiQuestionsResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {aiQuestionsResult.categories.map((cat, catIdx) => (
                    <div key={catIdx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(catIdx)}
                        style={{
                          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '14px 16px', background: expandedCategories[catIdx] ? '#f0fdfa' : '#f8fafc',
                          border: 'none', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{cat.categoryName}</span>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '10px' }}>
                            {cat.questions.length} câu
                          </span>
                        </div>
                        {expandedCategories[catIdx] ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                      </button>

                      {/* Questions */}
                      {expandedCategories[catIdx] && (
                        <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {cat.questions.map((q, qIdx) => (
                            <div key={qIdx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', transition: 'box-shadow 0.2s' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    ...getDifficultyStyle(q.difficulty),
                                    fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
                                    borderRadius: '6px', lineHeight: '18px'
                                  }}>
                                    {q.difficulty === 'Easy' ? '🟢' : q.difficulty === 'Medium' ? '🟡' : '🔴'} {q.difficulty}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                    Mục đích: {q.purpose}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleCopyQuestion(q.question)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: copiedQuestion === q.question ? '#059669' : '#94a3b8' }}
                                  title="Copy câu hỏi"
                                >
                                  {copiedQuestion === q.question ? <CheckCheck size={14} /> : <Copy size={14} />}
                                </button>
                              </div>
                              <p style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.5 }}>
                                Q{qIdx + 1}. {q.question}
                              </p>
                              <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px 12px', borderLeft: '3px solid #22c55e' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '4px' }}>💡 Gợi ý câu trả lời tốt:</span>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803d', lineHeight: 1.5 }}>{q.expectedAnswer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Không có dữ liệu. Vui lòng thử lại.
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Powered by Google Gemini AI • Câu hỏi được cá nhân hóa theo JD & ứng viên</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className={styles.btnSecondary} onClick={() => { setAiQuestionsApp(null); setAiQuestionsResult(null); }}>Đóng</button>
                {aiQuestionsResult && (
                  <button
                    className={styles.btnPrimary}
                    style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)' }}
                    onClick={() => handleGenerateQuestions(aiQuestionsApp)}
                  >
                    Tạo lại câu hỏi mới
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEST RESULT DETAIL MODAL */}
      {selectedTestDetail && (() => {
        const isTestPassed = selectedTestDetail.status === 'PASSED' || selectedTestDetail.score >= selectedTestDetail.passingScore;
        const reviews = selectedTestDetail.questionReviews || [];

        return (
          <div className={styles.modalOverlay} style={{ backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.6)' }}>
            <div className={styles.modalContent} style={{ maxWidth: '820px', width: '95%', borderRadius: '16px', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                background: isTestPassed
                  ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                  : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                padding: '20px 24px',
                color: '#fff',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isTestPassed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        Kết Quả Bài Test: {selectedTestDetail.candidateName}
                      </h2>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', opacity: 0.9 }}>
                        {selectedTestDetail.title} • {selectedTestDetail.jobTitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTestDetail(null)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Score card */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Điểm Đạt Được</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isTestPassed ? '#059669' : '#dc2626' }}>
                      {selectedTestDetail.score}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Điểm Chuẩn Đạt</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#334155' }}>
                      {selectedTestDetail.passingScore}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Số Câu Đúng</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>
                      {selectedTestDetail.correctAnswersCount}/{selectedTestDetail.totalQuestions}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Kết Luận</div>
                    <div style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: isTestPassed ? '#dcfce7' : '#fee2e2',
                      color: isTestPassed ? '#15803d' : '#991b1b'
                    }}>
                      {isTestPassed ? '⭐ ĐẠT CHUẨN' : 'CHƯA ĐẠT'}
                    </div>
                  </div>
                </div>

                {isTestPassed && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                      ✨ Ứng viên đạt yêu cầu! Hệ thống đã chuyển trạng thái sang <strong>SƠ TUYỂN (SHORTLISTED)</strong>.
                    </div>
                    <button
                      onClick={() => {
                        const matchedApp = applications.find(a => a.id === selectedTestDetail.applicationId);
                        if (matchedApp) {
                          setSelectedTestDetail(null);
                          setSchedulingApp(matchedApp);
                        }
                      }}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Lên lịch phỏng vấn
                    </button>
                  </div>
                )}

                {/* Chi tiết từng câu hỏi */}
                <div style={{ marginTop: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    Chi tiết câu trả lời ({reviews.length} câu)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {reviews.map((q: AssessmentQuestionReview, idx: number) => (
                      <div
                        key={q.id || idx}
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${q.isCorrect ? '#86efac' : '#fca5a5'}`,
                          borderRadius: '12px',
                          padding: '14px 16px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                            Câu {idx + 1}: {q.question}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: q.isCorrect ? '#dcfce7' : '#fee2e2',
                            color: q.isCorrect ? '#166534' : '#991b1b'
                          }}>
                            {q.isCorrect ? '✓ Đúng' : '✗ Sai'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                          {q.options.map((opt: string, oIdx: number) => {
                            const isCandidateChoice = q.candidateSelectedOptionIndex === oIdx;
                            const isCorrectChoice = q.correctOptionIndex === oIdx;
                            let bg = '#f8fafc';
                            let border = '#e2e8f0';
                            let text = '#475569';
                            if (isCorrectChoice) {
                              bg = '#ecfdf5';
                              border = '#6ee7b7';
                              text = '#047857';
                            } else if (isCandidateChoice && !isCorrectChoice) {
                              bg = '#fef2f2';
                              border = '#fca5a5';
                              text = '#b91c1c';
                            }
                            return (
                              <div
                                key={oIdx}
                                style={{
                                  background: bg,
                                  border: `1px solid ${border}`,
                                  color: text,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.82rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <span style={{ fontWeight: 700 }}>
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                <span>{opt}</span>
                                {isCandidateChoice && (
                                  <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, opacity: 0.8 }}>
                                    (Ứng viên chọn)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                            💡 <strong>Giải thích:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className={styles.btnSecondary} onClick={() => setSelectedTestDetail(null)}>Đóng</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Job Offer Modal */}
      {selectedOfferApp && (
        <JobOfferModal
          applicationId={selectedOfferApp.id}
          candidateName={selectedOfferApp.candidateName}
          candidateEmail={selectedOfferApp.candidateEmail}
          jobTitle={selectedOfferApp.jobTitle}
          existingOffer={appOffers[selectedOfferApp.id] || null}
          onClose={() => setSelectedOfferApp(null)}
          onSuccess={(newOffer) => {
            setAppOffers((prev) => ({ ...prev, [newOffer.applicationId]: newOffer }));
            setSelectedOfferApp(null);
            fetchApplications();
          }}
        />
      )}
    </div>
  );
};

export default EmployerAppManagePage;
