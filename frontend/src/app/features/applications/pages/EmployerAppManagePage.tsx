import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Calendar, Download, X, RefreshCw, Sparkles, Brain, Award, Trophy, TrendingUp } from 'lucide-react';
import { applicationsService } from '../../../core/services/applications.service';
import { jobsService } from '../../../core/services/jobs.service';
import { aiService, type JobFitAnalysisResult, type InterviewQuestionsResult, type CandidateRankResult } from '../../../core/services/ai.service';

import { technicalTestService } from '../../../core/services/technical-test.service';
import { type TechnicalTestSummary, type TestDetailResult } from '../../../core/models/technical-test.model';
import { jobOfferService } from '../../../core/services/job-offer.service';
import type { JobOffer } from '../../../core/models/job-offer.model';
import { JobOfferModal } from '../../job-offers/components/JobOfferModal';
import { toast } from '../../../core/services/toast.service';
import type { ApplicationDto } from '../../../core/models/application.model';
import type { JobDto } from '../../../core/models/job.model';
import { UiDataTable, type ColumnConfig } from '../../../shared/ui/DataTable/UiDataTable';
import { StatusBadge } from '../../../shared/components/status-badge/StatusBadge';
import { ScheduleInterviewModal } from '../components/ScheduleInterviewModal';
import { AiMatchModal } from '../components/AiMatchModal';
import { AiQuestionsModal } from '../components/AiQuestionsModal';
import { TestDetailModal } from '../components/TestDetailModal';
import { RankingModal } from '../components/RankingModal';
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
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');

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

  // AI Candidate Ranking States
  const [rankedCandidates, setRankedCandidates] = useState<CandidateRankResult[]>([]);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [sortByAiRank, setSortByAiRank] = useState(false);


  // AI Interview Questions States
  const [aiQuestionsApp, setAiQuestionsApp] = useState<ApplicationDto | null>(null);
  const [aiQuestionsResult, setAiQuestionsResult] = useState<InterviewQuestionsResult | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Online Technical Assessment States
  const [appTests, setAppTests] = useState<Record<number, TechnicalTestSummary>>({});
  const [invitingTestAppId, setInvitingTestAppId] = useState<number | null>(null);
  const [selectedTestDetail, setSelectedTestDetail] = useState<TestDetailResult | null>(null);
  const [, setLoadingTestDetail] = useState<boolean>(false);

  // Job Offer States
  const [appOffers, setAppOffers] = useState<Record<number, JobOffer>>({});
  const [selectedOfferApp, setSelectedOfferApp] = useState<ApplicationDto | null>(null);

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
      const jId = overrideParams?.jobId !== undefined ? overrideParams.jobId : selectedJobId;
      const st = overrideParams?.status !== undefined ? overrideParams.status : selectedStatus;
      const kw = overrideParams?.keyword !== undefined ? overrideParams.keyword : keyword;

      const params: any = {
        pageSize: 100
      };
      if (jId) params.jobId = Number(jId);
      if (st) params.status = st;
      if (kw) params.keyword = kw.trim();

      const res = await applicationsService.getApplications(params);
      if (res.data?.success && res.data.data) {
        const appList = res.data.data.items || [];
        setApplications(appList);

        // Fetch technical tests for these applications
        fetchTechnicalTests(appList);
        // Fetch job offers for these applications
        fetchJobOffers(appList);
      } else {
        setApplications([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Không thể tải danh sách ứng viên.');
      toast.error('Lỗi khi tải dữ liệu hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Online Tests info for applications
  const fetchTechnicalTests = async (apps: ApplicationDto[]) => {
    if (!apps || apps.length === 0) return;
    try {
      const testsMap: Record<number, TechnicalTestSummary> = {};
      await Promise.all(
        apps.map(async (app) => {
          try {
            const res = await technicalTestService.getTestSummary(app.id);
            if (res.data?.success && res.data.data) {
              testsMap[app.id] = res.data.data;
            }
          } catch {
            // Ignore 404 or missing tests for an application
          }
        })
      );
      setAppTests(testsMap);
    } catch (err) {
      console.error('Error fetching technical tests summary:', err);
    }
  };

  // Fetch Job Offers for applications
  const fetchJobOffers = async (apps: ApplicationDto[]) => {
    if (!apps || apps.length === 0) return;
    try {
      const offersMap: Record<number, JobOffer> = {};
      await Promise.all(
        apps.map(async (app) => {
          try {
            const res = await jobOfferService.getOfferByApplication(app.id);
            if (res.data?.success && res.data.data) {
              offersMap[app.id] = res.data.data;
            }
          } catch {
            // Ignore if no offer exists yet
          }
        })
      );
      setAppOffers(offersMap);
    } catch (err) {
      console.error('Error fetching job offers:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const handleJobFilterChange = (jobId: number | '') => {
    setSelectedJobId(jobId);
    fetchApplications({ jobId });
  };

  const handleStatusFilterChange = (status: string) => {
    setSelectedStatus(status);
    fetchApplications({ status });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleResetFilters = () => {
    setSelectedJobId('');
    setSelectedStatus('');
    setKeyword('');
    fetchApplications({ jobId: '', status: '', keyword: '' });
  };

  // Sắp xếp danh sách ứng viên theo thứ hạng AI nếu kích hoạt sortByAiRank
  const filteredApplications = React.useMemo(() => {
    if (!sortByAiRank) return applications;
    return [...applications].sort((a, b) => {
      const scoreA = aiScoreCache[a.id]?.matchScore ?? a.matchScore ?? -1;
      const scoreB = aiScoreCache[b.id]?.matchScore ?? b.matchScore ?? -1;
      return scoreB - scoreA;
    });
  }, [applications, sortByAiRank, aiScoreCache]);

  // Action Handlers
  const handleUpdateStatus = async (appId: number, newStatus: string) => {
    try {
      await applicationsService.updateApplicationStatus(appId, { status: newStatus });
      toast.success(`Cập nhật trạng thái sang ${newStatus} thành công!`);
      setActiveStatusEditId(null);
      // Cập nhật lại UI local
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật trạng thái hồ sơ.');
    }
  };

  // Gửi bài test năng lực online cho ứng viên
  const handleInviteTest = async (app: ApplicationDto) => {
    setInvitingTestAppId(app.id);
    try {
      const res = await technicalTestService.inviteCandidateTest(app.id);
      if (res.data?.success && res.data.data) {
        toast.success(`Đã phát hành bài thi trực tuyến cho ứng viên ${app.candidateName}!`);
        // Refresh bài test
        setAppTests(prev => ({ ...prev, [app.id]: res.data.data as TechnicalTestSummary }));
      } else {
        toast.error(res.data?.error?.message || 'Không thể tạo lời mời làm test.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi gửi lời mời làm bài test.');
    } finally {
      setInvitingTestAppId(null);
    }
  };

  // Xem chi tiết bài làm test của ứng viên
  const handleViewTestDetail = async (testId: number) => {
    setLoadingTestDetail(true);
    try {
      const res = await technicalTestService.getTestDetail(testId);
      if (res.data?.success && res.data.data) {
        setSelectedTestDetail(res.data.data);
      } else {
        toast.error('Không tìm thấy chi tiết bài làm.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải chi tiết bài thi online.');
    } finally {
      setLoadingTestDetail(false);
    }
  };



  // AI Match Score Handler
  const handleAiAnalyze = async (app: ApplicationDto) => {
    setAiAnalyzingId(app.id);
    setAiMatchApp(app);
    try {
      const res = await aiService.analyzeJobFit(app.jobId, app.candidateId);
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
        const res = await aiService.analyzeJobFit(app.jobId, app.candidateId);
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

  // AI Auto-Ranking Handler: Xếp hạng toàn bộ ứng viên theo tiêu chí JD
  const handleRankCandidates = async (jobIdParam?: number) => {
    const targetJobId = jobIdParam || (selectedJobId ? Number(selectedJobId) : (applications[0]?.jobId));
    if (!targetJobId) {
      toast.error('Vui lòng chọn một tin tuyển dụng cụ thể để AI xếp hạng hồ sơ ứng viên.');
      return;
    }
    setRankingLoading(true);
    try {
      const res = await aiService.rankCandidates(targetJobId);
      if (res.data?.success && res.data.data) {
        const ranks = res.data.data as CandidateRankResult[];
        setRankedCandidates(ranks);
        setShowRankingModal(true);

        // Sync sang aiScoreCache để bảng và kanban tự cập nhật điểm số tương ứng
        const newCache: Record<number, JobFitAnalysisResult> = {};
        ranks.forEach((r) => {
          newCache[r.applicationId] = {
            matchScore: r.matchScore,
            matchLevel: r.matchLevel,
            summary: r.recommendation,
            strengths: r.strengths || [],
            missingSkills: r.missingSkills || [],
            recommendations: [r.recommendation]
          };
        });
        setAiScoreCache(prev => ({ ...prev, ...newCache }));
        toast.success(`AI đã xếp hạng thành công ${ranks.length} ứng viên!`);
      } else {
        toast.error(res.data?.error?.message || 'Không thể xếp hạng ứng viên.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi chạy AI Ranking. Vui lòng thử lại.');
    } finally {
      setRankingLoading(false);
    }
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
        <div className={styles.actionGroup}>
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
            className={`${styles.actionBtn} ${styles.actionBtnAi}`}
            onClick={(e) => {
              e.stopPropagation();
              handleAiAnalyze(row);
            }}
            disabled={aiAnalyzingId === row.id}
            title="AI Phân tích độ phù hợp"
          >
            {aiAnalyzingId === row.id ? (
              <div className={styles.spinnerSmall} />
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
          >
            <Brain size={14} />
          </button>

          {/* Job Offer Button */}
          <button
            className={`${styles.actionBtn} ${styles.actionBtnOffer} ${
              appOffers[row.id]?.status === 'ACCEPTED' ? styles.offerAccepted :
              appOffers[row.id]?.status === 'NEGOTIATING' ? styles.offerNegotiating : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOfferApp(row);
            }}
            disabled={row.status === 'REJECTED' || row.status === 'WITHDRAWN'}
            title={appOffers[row.id] ? `Xem / Cập nhật Thư mời nhận việc (${appOffers[row.id].status})` : 'Phát hành Thư mời nhận việc (Job Offer)'}
          >
            <Award size={14} />
            {appOffers[row.id]?.status === 'NEGOTIATING' && (
              <span className={styles.offerDot} />
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
          className={styles.kanbanAppId}
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
          <div className={styles.candidateName}>{row.candidateName}</div>
          {row.candidateEmail && (
            <div className={styles.candidateEmail}>{row.candidateEmail}</div>
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
          <div className={styles.jobTitleText}>
            {row.jobTitle}
          </div>
          {row.companyName && (
            <div className={styles.jobDeptText}>
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
          className={styles.btnSecondaryAction}
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
        <span className={styles.dateText}>
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
              className={styles.btnAiScreen}
            >
              {aiAnalyzingId === row.id ? (
                <><div className={styles.spinnerWhite} /> Đang phân tích...</>
              ) : (
                'AI Sàng lọc'
              )}
            </button>
          );
        }
        const label = getMatchLabel(score);
        const matchClass = score >= 80 ? styles.matchHigh : score >= 60 ? styles.matchMed : score >= 40 ? styles.matchLow : styles.matchPoor;
        return (
          <div
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
            <div className={`${styles.matchPill} ${matchClass}`}>
              <div className={styles.matchScoreNum}>
                {score}%
              </div>
              <div className={styles.matchScoreLabel}>
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
              className={styles.btnTestInvite}
              title="Gửi bài kiểm tra năng lực online"
            >
              {invitingTestAppId === row.id ? (
                <><RefreshCw size={12} className={styles.spinnerSmall} /> Đang gửi...</>
              ) : (
                'Mời làm test'
              )}
            </button>
          );
        }

        if (test.status === 'PASSED') {
          return (
            <div className={styles.actionGroup}>
              <span
                className={`${styles.testScoreBadge} ${styles.testPassed}`}
                onClick={(e) => { e.stopPropagation(); handleViewTestDetail(test.id); }}
                title="Bấm để xem chi tiết bài làm"
              >
                Đạt: {test.score}%
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setSchedulingApp(row); }}
                className={styles.testScheduleLink}
              >
                Lên lịch PV
              </button>
            </div>
          );
        }

        if (test.status === 'FAILED') {
          return (
            <span
              className={`${styles.testScoreBadge} ${styles.testFailed}`}
              onClick={(e) => { e.stopPropagation(); handleViewTestDetail(test.id); }}
              title="Bấm để xem chi tiết bài làm"
            >
              Chưa đạt: {test.score}%
            </span>
          );
        }

        if (test.status === 'IN_PROGRESS') {
          return (
            <span className={styles.testPendingBadge}>
              Đang làm bài...
            </span>
          );
        }

        return (
          <span className={styles.testPendingBadge}>
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
              className={styles.btnSecondaryAction}
              title="Phát hành Thư Mời Nhận Việc"
            >
              Phát hành Offer
            </button>
          );
        }

        if (offer.status === 'ACCEPTED') {
          return (
            <div
              className={`${styles.offerPill} ${styles.offerAccepted}`}
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
              className={`${styles.offerPill} ${styles.offerNegotiating}`}
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
              className={`${styles.offerPill}`}
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
            className={`${styles.offerPill} ${styles.offerSent}`}
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
        <StatusBadge status={row.status} label={translateStatus(row.status)} />
      )
    }
  ];

  return (
    <div className={styles.container} onClick={() => setActiveStatusEditId(null)}>
      <div className={styles.titleArea}>
        <div>
          <h1 className={styles.pageHeading}>
            Quản lý hồ sơ ứng tuyển
          </h1>
          <p className={styles.pageSubheading}>
            Sàng lọc, phỏng vấn và quản lý trạng thái tuyển dụng ứng viên của công ty.
          </p>
        </div>
        <div className={styles.headerControls}>
          <div className={styles.viewModeSwitch}>
            <button
              onClick={() => setViewMode('kanban')}
              className={`${styles.viewModeBtn} ${viewMode === 'kanban' ? styles.viewModeBtnActive : ''}`}
            >
              📊 Phễu Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`${styles.viewModeBtn} ${viewMode === 'table' ? styles.viewModeBtnActive : ''}`}
            >
              📋 Bảng Dữ Liệu
            </button>
          </div>
          <button
            onClick={() => navigate('/employer/assessments')}
            className={styles.btnSecondaryAction}
          >
            Quản lý Đề thi Online
          </button>
          <button
            onClick={handleBatchAnalyze}
            disabled={batchAnalyzing || applications.length === 0}
            className={styles.btnPrimaryAction}
          >
            {batchAnalyzing ? (
              <>
                <div className={styles.spinnerWhite} />
                AI Sàng lọc... ({batchProgress.done}/{batchProgress.total})
              </>
            ) : (
              'AI Sàng lọc tất cả'
            )}
          </button>
          <button
            onClick={() => handleRankCandidates()}
            disabled={rankingLoading || applications.length === 0}
            className={styles.btnSecondaryAction}
          >
            {rankingLoading ? (
              <>
                <div className={styles.spinnerSmall} />
                AI Đang xếp hạng...
              </>
            ) : (
              <>
                <Trophy size={15} />
                AI Xếp hạng ứng viên
              </>
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

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tìm kiếm & Sắp xếp</span>
          <form onSubmit={handleSearchSubmit} className={styles.headerControls}>
            <input 
              type="text" 
              placeholder="Nhập tên ứng viên, email, mã #APP..." 
              className={styles.filterInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className={styles.btnPrimary}>Tìm kiếm</button>
            <button
              type="button"
              onClick={() => setSortByAiRank(prev => !prev)}
              className={styles.btnSecondaryAction}
              title="Sắp xếp ứng viên theo thứ hạng điểm phù hợp AI"
            >
              <TrendingUp size={14} />
              {sortByAiRank ? '⭐ Điểm AI cao nhất' : 'Xếp theo AI'}
            </button>
            {(selectedJobId !== '' || selectedStatus !== '' || keyword.trim() !== '') && (
              <button 
                type="button"
                className={styles.btnSecondary} 
                onClick={handleResetFilters}
                title="Xóa bộ lọc"
              >
                Xóa lọc
              </button>
            )}
          </form>
        </div>
      </div>


      {/* Filter summary status strip */}
      <div className={styles.actionGroup}>
        <div>
          {selectedJobId !== '' || selectedStatus !== '' || keyword.trim() !== '' ? (
            <span>
              Đang lọc hồ sơ: hiển thị <strong>{filteredApplications.length}</strong> / {applications.length} kết quả
            </span>
          ) : (
            <span>
              Tổng số hồ sơ ứng tuyển: <strong>{applications.length}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Grid or Kanban view */}
      {error ? (
        <div className={styles.infoSection}>
          <p>{error}</p>
          <button className={styles.btnPrimary} onClick={() => fetchApplications()}>Thử lại</button>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className={styles.kanbanBoard}>
          {[
            { key: 'APPLIED', label: 'Chờ duyệt', next: 'SCREENING' },
            { key: 'SCREENING', label: 'Sàng lọc CV', next: 'SHORTLISTED' },
            { key: 'SHORTLISTED', label: 'Sơ tuyển', next: 'INTERVIEW' },
            { key: 'INTERVIEW', label: 'Phỏng vấn', next: 'OFFER' },
            { key: 'OFFER', label: 'Đề nghị (Offer)', next: 'HIRED' },
            { key: 'HIRED', label: 'Nhận việc (Hired)', next: null },
            { key: 'REJECTED', label: 'Từ chối', next: null }
          ].map(col => {
            const colApps = filteredApplications.filter(a => (a.status || 'APPLIED').toUpperCase() === col.key);

            return (
              <div
                key={col.key}
                className={styles.kanbanColumn}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const appIdStr = e.dataTransfer.getData('text/plain');
                  if (appIdStr) {
                    const appId = Number(appIdStr);
                    handleUpdateStatus(appId, col.key);
                  }
                }}
              >
                {/* Column Header */}
                <div className={styles.kanbanHeader}>
                  <div className={styles.kanbanTitle}>
                    {col.label}
                  </div>
                  <span className={styles.kanbanCount}>
                    {colApps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className={styles.kanbanCards}>
                  {colApps.length === 0 ? (
                    <div className={styles.kanbanEmpty}>
                      Thả hồ sơ vào đây
                    </div>
                  ) : (
                    colApps.map(app => {
                      const cached = aiScoreCache[app.id];
                      const score = cached?.matchScore || app.matchScore;

                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(app.id));
                          }}
                          onClick={() => setSelectedApp(app)}
                          className={styles.kanbanCard}
                        >
                          <div className={styles.kanbanCardHeader}>
                            <span className={styles.kanbanAppId}>
                              #APP-{app.id}
                            </span>
                            {score !== undefined && score !== null ? (
                              <span className={`${styles.kanbanAiBadge} ${
                                score >= 80 ? styles.aiHigh : score >= 60 ? styles.aiMed : styles.aiLow
                              }`}>
                                🤖 AI: {score}%
                              </span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAiAnalyze(app); }}
                                className={styles.kanbanNextBtn}
                              >
                                Sparkles AI
                              </button>
                            )}
                          </div>

                          <div className={styles.kanbanCandidateName}>
                            {app.candidateName}
                          </div>
                          <div className={styles.kanbanJobTitle}>
                            {app.jobTitle}
                          </div>

                          <div className={styles.kanbanFooter}>
                            <span className={styles.kanbanDate}>
                              {app.appliedAt ? app.appliedAt.split('T')[0] : ''}
                            </span>
                            <div className={styles.kanbanActions}>
                              {col.next && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, col.next!); }}
                                  className={styles.kanbanNextBtn}
                                  title={`Chuyển sang ${col.next}`}
                                >
                                  Chuyển tiếp ➔
                                </button>
                              )}
                              {col.key !== 'REJECTED' && col.key !== 'HIRED' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, 'REJECTED'); }}
                                  className={styles.kanbanRejectBtn}
                                  title="Từ chối"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
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
                  <span className={styles.infoValue}>{selectedApp.candidateName}</span>
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
                  <div className={styles.coverLetterBox}>
                    <div className={styles.filterLabel}>
                      Thư xin việc (Cover Letter):
                    </div>
                    <p className={styles.coverLetterText}>
                      "{selectedApp.coverLetter}"
                    </p>
                  </div>
                )}

                {/* Job Offer Info in Drawer */}
                <div className={styles.drawerOfferBox}>
                  <div className={styles.drawerOfferHeader}>
                    <div>
                      <div className={styles.drawerOfferTitle}>
                        📄 Thư Mời Nhận Việc (Job Offer)
                      </div>
                      <div className={styles.drawerOfferSubtitle}>
                        {appOffers[selectedApp.id] 
                          ? `Trạng thái: ${appOffers[selectedApp.id].status} • Lương: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appOffers[selectedApp.id].totalSalary)}` 
                          : 'Chưa phát hành đề xuất nhận việc cho ứng viên này.'}
                      </div>
                    </div>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => setSelectedOfferApp(selectedApp)}
                    >
                      {appOffers[selectedApp.id] ? 'Xem / Cập nhật Offer' : '+ Phát hành Offer'}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <span className={styles.filterLabel}>
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
        <ScheduleInterviewModal
          app={schedulingApp}
          onClose={() => setSchedulingApp(null)}
          onSuccess={(appId, newStatus) => {
            handleUpdateStatus(appId, newStatus);
            fetchApplications();
          }}
        />
      )}

      {/* AI MATCH SCORE MODAL */}
      {showAiMatchModal && aiMatchResult && aiMatchApp && (
        <AiMatchModal
          app={aiMatchApp}
          result={aiMatchResult}
          onClose={() => setShowAiMatchModal(false)}
          onScheduleInterview={(app) => {
            setSchedulingApp(app);
          }}
        />
      )}

      {/* AI INTERVIEW QUESTIONS MODAL */}
      {aiQuestionsApp && (
        <AiQuestionsModal
          app={aiQuestionsApp}
          result={aiQuestionsResult}
          isLoading={generatingQuestions}
          onClose={() => {
            setAiQuestionsApp(null);
            setAiQuestionsResult(null);
          }}
          onRegenerate={(app) => handleGenerateQuestions(app)}
        />
      )}

      {/* TEST RESULT DETAIL MODAL */}
      {selectedTestDetail && (
        <TestDetailModal
          testDetail={selectedTestDetail}
          applications={applications}
          onClose={() => setSelectedTestDetail(null)}
          onScheduleInterview={(app) => {
            setSchedulingApp(app);
          }}
        />
      )}

      {/* AI Candidate Auto-Ranking Modal */}
      {showRankingModal && (
        <RankingModal
          rankedCandidates={rankedCandidates}
          applications={applications}
          onClose={() => setShowRankingModal(false)}
          onApplySort={() => setSortByAiRank(true)}
          onScheduleInterview={(app) => setSchedulingApp(app)}
          onInviteTest={(app) => handleInviteTest(app)}
          onViewDetail={(app) => setSelectedApp(app)}
        />
      )}

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
