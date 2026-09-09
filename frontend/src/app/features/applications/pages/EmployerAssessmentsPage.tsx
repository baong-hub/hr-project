import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  Users,
  Trash2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { technicalTestService } from '../../../core/services/technical-test.service';
import type {
  AssessmentQuestion,
  TechnicalTestSummary,
  TestDetailResult
} from '../../../core/models/technical-test.model';
import { toast } from '../../../core/services/toast.service';
import { useNavigate } from 'react-router-dom';
import styles from './EmployerAssessmentsPage.module.scss';

export const EmployerAssessmentsPage: React.FC = () => {
  const navigate = useNavigate();

  // Tab: 'templates' (Quản lý đề thi theo Job) hoặc 'results' (Thống kê kết quả thi)
  const [activeTab, setActiveTab] = useState<'templates' | 'results'>('templates');

  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Form đề thi
  const [templateForm, setTemplateForm] = useState<{
    id: number;
    title: string;
    description: string;
    testType: string;
    durationMinutes: number;
    passingScore: number;
    totalQuestions: number;
    autoInviteOnApply: boolean;
    autoInviteOnScreening: boolean;
    questions: AssessmentQuestion[];
  }>({
    id: 0,
    title: '',
    description: '',
    testType: 'TECHNICAL',
    durationMinutes: 30,
    passingScore: 70,
    totalQuestions: 10,
    autoInviteOnApply: false,
    autoInviteOnScreening: true,
    questions: []
  });

  const [loadingTemplate, setLoadingTemplate] = useState<boolean>(false);
  const [savingTemplate, setSavingTemplate] = useState<boolean>(false);
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);

  // Danh sách kết quả thi của ứng viên
  const [testResults, setTestResults] = useState<TechnicalTestSummary[]>([]);
  const [loadingResults, setLoadingResults] = useState<boolean>(false);
  const [resultFilterJob, setResultFilterJob] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal xem chi tiết bài làm
  const [selectedTestDetail, setSelectedTestDetail] = useState<TestDetailResult | null>(null);
  const [, setLoadingDetail] = useState<boolean>(false);

  // Load danh sách Jobs
  const loadJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const res = await jobsService.getJobs();
      const list = res.data?.data?.items || (res.data?.data as any) || [];
      setJobs(list);
      if (list.length > 0 && !selectedJobId) {
        setSelectedJobId(list[0].id);
      }
    } catch {
      toast.error('Không thể tải danh sách tin tuyển dụng.');
    } finally {
      setLoadingJobs(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Load đề thi khi đổi Job
  const loadTemplateForJob = useCallback(async (jobId: number) => {
    try {
      setLoadingTemplate(true);
      const currentJob = jobs.find(j => j.id === jobId);
      const res = await technicalTestService.getTemplateByJob(jobId);

      if (res.data) {
        setTemplateForm({
          id: res.data.id,
          title: res.data.title,
          description: res.data.description || '',
          testType: res.data.testType,
          durationMinutes: res.data.durationMinutes,
          passingScore: res.data.passingScore,
          totalQuestions: res.data.totalQuestions,
          autoInviteOnApply: res.data.autoInviteOnApply,
          autoInviteOnScreening: res.data.autoInviteOnScreening,
          questions: res.data.questions || []
        });
      } else {
        // Khởi tạo form mặc định
        setTemplateForm({
          id: 0,
          title: `Đánh Giá Năng Lực - ${currentJob?.title || 'Chuyên Môn'}`,
          description: 'Bài kiểm tra năng lực trực tuyến trắc nghiệm tự động chấm điểm.',
          testType: 'TECHNICAL',
          durationMinutes: 30,
          passingScore: 70,
          totalQuestions: 10,
          autoInviteOnApply: false,
          autoInviteOnScreening: true,
          questions: []
        });
      }
    } catch {
      toast.error('Không thể tải đề thi của tin tuyển dụng.');
    } finally {
      setLoadingTemplate(false);
    }
  }, [jobs]);

  useEffect(() => {
    if (selectedJobId && activeTab === 'templates') {
      loadTemplateForJob(selectedJobId);
    }
  }, [selectedJobId, activeTab, loadTemplateForJob]);

  // Load danh sách kết quả test khi sang tab results
  const loadAllResults = useCallback(async () => {
    try {
      setLoadingResults(true);
      if (resultFilterJob === 'all') {
        // Tải kết quả của tất cả các job có trong danh sách
        const allPromises = jobs.map(j => technicalTestService.getTestsByJob(j.id).catch(() => ({ data: [] })));
        const allRes = await Promise.all(allPromises);
        const combined = allRes.flatMap(r => r.data || []);
        setTestResults(combined);
      } else {
        const res = await technicalTestService.getTestsByJob(Number(resultFilterJob));
        setTestResults(res.data || []);
      }
    } catch {
      toast.error('Không thể tải danh sách kết quả kiểm tra.');
    } finally {
      setLoadingResults(false);
    }
  }, [jobs, resultFilterJob]);

  useEffect(() => {
    if (activeTab === 'results') {
      loadAllResults();
    }
  }, [activeTab, loadAllResults]);

  // AI Sinh bộ câu hỏi trắc nghiệm
  const handleGenerateAiQuestions = async () => {
    if (!selectedJobId) return;
    try {
      setGeneratingAi(true);
      toast.info('🤖 AI đang phân tích JD và sinh bộ câu hỏi trắc nghiệm chất lượng cao...');
      const res = await technicalTestService.generateAiQuestions({
        jobId: selectedJobId,
        testType: templateForm.testType,
        totalQuestions: templateForm.totalQuestions || 10
      });

      if (res.data && res.data.length > 0) {
        setTemplateForm(prev => ({
          ...prev,
          questions: res.data,
          totalQuestions: res.data.length
        }));
        toast.success(`✨ Đã sinh thành công ${res.data.length} câu hỏi bằng AI!`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi khi sinh câu hỏi bằng AI.');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Thêm câu hỏi thủ công
  const handleAddManualQuestion = () => {
    const newQ: AssessmentQuestion = {
      id: templateForm.questions.length + 1,
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
      category: 'Chuyên môn',
      difficulty: 'Medium'
    };
    setTemplateForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQ],
      totalQuestions: prev.questions.length + 1
    }));
  };

  // Xóa câu hỏi
  const handleRemoveQuestion = (index: number) => {
    setTemplateForm(prev => {
      const updated = prev.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, id: i + 1 }));
      return {
        ...prev,
        questions: updated,
        totalQuestions: updated.length
      };
    });
  };

  // Cập nhật câu hỏi
  const handleUpdateQuestion = (index: number, field: keyof AssessmentQuestion, value: any) => {
    setTemplateForm(prev => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  // Cập nhật phương án trả lời
  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    setTemplateForm(prev => {
      const updated = [...prev.questions];
      const opts = [...updated[qIndex].options];
      opts[optIndex] = text;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return { ...prev, questions: updated };
    });
  };

  // Lưu đề thi
  const handleSaveTemplate = async () => {
    if (!selectedJobId) return;
    if (!templateForm.title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề bài kiểm tra.');
      return;
    }
    if (templateForm.questions.length === 0) {
      toast.warning('Đề thi cần ít nhất 1 câu hỏi. Bạn có thể bấm "Sinh bằng AI" hoặc thêm câu hỏi thủ công.');
      return;
    }

    try {
      setSavingTemplate(true);
      await technicalTestService.saveTemplate({
        jobId: selectedJobId,
        title: templateForm.title,
        description: templateForm.description,
        testType: templateForm.testType,
        durationMinutes: templateForm.durationMinutes,
        passingScore: templateForm.passingScore,
        totalQuestions: templateForm.questions.length,
        autoInviteOnApply: templateForm.autoInviteOnApply,
        autoInviteOnScreening: templateForm.autoInviteOnScreening,
        questions: templateForm.questions
      });

      toast.success('Đã lưu cấu hình đề thi thành công!');
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi lưu đề thi.');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Xem chi tiết bài làm của ứng viên
  const handleViewTestDetail = async (testSummaryId: number) => {
    try {
      setLoadingDetail(true);
      const res = await technicalTestService.getTestResult(testSummaryId);
      if (res.data) {
        setSelectedTestDetail(res.data);
      }
    } catch {
      toast.error('Không thể tải bài làm chi tiết.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Lọc kết quả tìm kiếm
  const filteredResults = testResults.filter(r => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = r.candidateName?.toLowerCase().includes(term);
      const matchJob = r.jobTitle?.toLowerCase().includes(term);
      if (!matchName && !matchJob) return false;
    }
    return true;
  });

  return (
    <div className={styles.container}>
      {/* HEADER TRANG */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Đánh Giá Năng Lực & Trắc Nghiệm Online</h1>
          <p>Thiết lập đề thi trắc nghiệm theo tin tuyển dụng, tự động mời thi và chấm điểm chuyển trạng thái Shortlisted</p>
        </div>

        {/* TAB SWITCH */}
        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'templates' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Đề Thi Gắn Với Tin Tuyển Dụng
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'results' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Kết Quả Thi Của Ứng Viên
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: QUẢN LÝ ĐỀ THI (TEMPLATES) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'templates' && (
        <div className={styles.templatesLayout}>
          {/* CỘT TRÁI: DANH SÁCH TIN TUYỂN DỤNG */}
          <div className={styles.jobListSidebar}>
            <h3>Tin Tuyển Dụng</h3>
            {loadingJobs ? (
              <div className={styles.sideLoading}>
                Đang tải...
              </div>
            ) : jobs.length === 0 ? (
              <p className={styles.emptyText}>Chưa có tin tuyển dụng nào.</p>
            ) : (
              <div className={styles.jobItemsContainer}>
                {jobs.map(j => (
                  <div
                    key={j.id}
                    className={`${styles.jobItemCard} ${selectedJobId === j.id ? styles.selectedJob : ''}`}
                    onClick={() => setSelectedJobId(j.id)}
                  >
                    <div className={styles.jobItemTitle}>{j.title}</div>
                    <div className={styles.jobItemMeta}>
                      <span>{j.category || 'Công nghệ'}</span>
                      <span className={styles.dot}>&bull;</span>
                      <span>{j.openings || 1} vị trí</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: FORM CẤU HÌNH ĐỀ THI */}
          <div className={styles.templateMain}>
            {loadingTemplate ? (
              <div className={styles.mainLoading}>
                <p>Đang tải cấu hình đề thi...</p>
              </div>
            ) : selectedJobId ? (
              <div className={styles.templateCard}>
                <div className={styles.templateCardHeader}>
                  <div>
                    <h2>Cấu Hình Bài Kiểm Tra Năng Lực</h2>
                    <p className={styles.sub}>
                      Gắn liền với: <strong>{jobs.find(j => j.id === selectedJobId)?.title}</strong>
                    </p>
                  </div>

                  <div className={styles.headerActions}>
                    <button
                      className={styles.btnAi}
                      onClick={handleGenerateAiQuestions}
                      disabled={generatingAi || savingTemplate}
                    >
                      {generatingAi ? 'AI Đang sinh câu hỏi...' : 'Sinh câu hỏi bằng AI'}
                    </button>

                    <button
                      className={styles.btnSave}
                      onClick={handleSaveTemplate}
                      disabled={savingTemplate || generatingAi}
                    >
                      {savingTemplate ? 'Đang lưu...' : 'Lưu Đề Thi'}
                    </button>
                  </div>
                </div>

                {/* CÀI ĐẶT THÔNG SỐ CHÍNH */}
                <div className={styles.configGrid}>
                  <div className={styles.formGroup}>
                    <label>Tiêu đề bài kiểm tra</label>
                    <input
                      type="text"
                      value={templateForm.title}
                      onChange={e => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ví dụ: Đánh Giá Năng Lực Frontend React & TypeScript"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Loại bài thi</label>
                    <select
                      value={templateForm.testType}
                      onChange={e => setTemplateForm(prev => ({ ...prev, testType: e.target.value }))}
                    >
                      <option value="TECHNICAL">Trắc nghiệm chuyên môn (Technical)</option>
                      <option value="LOGIC">Logic & Tư duy giải quyết vấn đề</option>
                      <option value="ENGLISH">Tiếng Anh chuyên ngành</option>
                      <option value="CODING">Kiến trúc & Lập trình (Coding)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Thời gian làm bài (Phút)</label>
                    <div className={styles.inputWithIcon}>
                      <Clock size={16} />
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={templateForm.durationMinutes}
                        onChange={e => setTemplateForm(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Điểm đạt chuẩn (%)</label>
                    <div className={styles.inputWithIcon}>
                      <Award size={16} />
                      <input
                        type="number"
                        min={10}
                        max={100}
                        value={templateForm.passingScore}
                        onChange={e => setTemplateForm(prev => ({ ...prev, passingScore: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                {/* CÀI ĐẶT TỰ ĐỘNG HÓA */}
                <div className={styles.autoInviteCard}>
                  <h4>Tự động gửi bài kiểm tra cho ứng viên:</h4>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={templateForm.autoInviteOnApply}
                        onChange={e => setTemplateForm(prev => ({ ...prev, autoInviteOnApply: e.target.checked }))}
                      />
                      <span>Tự động gửi bài test ngay khi ứng viên nộp hồ sơ ứng tuyển (Apply)</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={templateForm.autoInviteOnScreening}
                        onChange={e => setTemplateForm(prev => ({ ...prev, autoInviteOnScreening: e.target.checked }))}
                      />
                      <span>Tự động gửi bài test khi chuyển trạng thái hồ sơ sang <strong>CV Screening</strong></span>
                    </label>
                  </div>
                  <p className={styles.autoNote}>
                    Khi ứng viên làm bài xong đạt điểm chuẩn (&ge; {templateForm.passingScore}%), hệ thống sẽ <strong>TỰ ĐỘNG</strong> chuyển sang <strong>SHORTLISTED</strong> và gợi ý bạn mở lịch phỏng vấn!
                  </p>
                </div>

                {/* DANH SÁCH CÂU HỎI */}
                <div className={styles.questionsSection}>
                  <div className={styles.qSectionHeader}>
                    <h3>Danh Sách Câu Hỏi ({templateForm.questions.length})</h3>
                    <button className={styles.btnAddManual} onClick={handleAddManualQuestion}>
                      Thêm câu hỏi thủ công
                    </button>
                  </div>

                  {templateForm.questions.length === 0 ? (
                    <div className={styles.emptyQuestions}>
                      <BookOpen size={40} color="#94a3b8" />
                      <p>Chưa có câu hỏi nào trong đề thi này.</p>
                      <p className={styles.emptySub}>
                        Bạn có thể bấm <strong>&quot;Sinh câu hỏi bằng AI&quot;</strong> để hệ thống tự tạo bộ câu hỏi trắc nghiệm chuẩn xác theo JD, hoặc tự thêm thủ công.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.questionsList}>
                      {templateForm.questions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className={styles.questionEditorCard}>
                          <div className={styles.qCardTop}>
                            <span className={styles.qBadgeIndex}>Câu {qIdx + 1}</span>

                            <div className={styles.qCardControls}>
                              <select
                                value={q.difficulty}
                                onChange={e => handleUpdateQuestion(qIdx, 'difficulty', e.target.value)}
                                className={styles.selectDiff}
                              >
                                <option value="Easy">Dễ</option>
                                <option value="Medium">Trung bình</option>
                                <option value="Hard">Khó</option>
                              </select>

                              <button
                                className={styles.btnTrash}
                                onClick={() => handleRemoveQuestion(qIdx)}
                                title="Xóa câu hỏi này"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className={styles.questionInputGroup}>
                            <textarea
                              rows={2}
                              value={q.question}
                              onChange={e => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                              placeholder="Nhập nội dung câu hỏi..."
                            />
                          </div>

                          {/* 4 PHƯƠNG ÁN TRẢ LỜI */}
                          <div className={styles.optionsGrid}>
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`${styles.optionRow} ${q.correctOptionIndex === optIdx ? styles.correctOptionRow : ''}`}
                              >
                                <label
                                  className={styles.radioLabel}
                                  title="Chọn đáp án này là đáp án ĐÚNG"
                                >
                                  <input
                                    type="radio"
                                    name={`correct_${qIdx}`}
                                    checked={q.correctOptionIndex === optIdx}
                                    onChange={() => handleUpdateQuestion(qIdx, 'correctOptionIndex', optIdx)}
                                  />
                                  <span>{String.fromCharCode(65 + optIdx)}</span>
                                </label>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                  placeholder={`Phương án ${String.fromCharCode(65 + optIdx)}`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* LỜI GIẢI THÍCH */}
                          <div className={styles.explanationGroup}>
                            <input
                              type="text"
                              value={q.explanation || ''}
                              onChange={e => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                              placeholder="Giải thích vì sao đáp án này đúng (tùy chọn)..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: THỐNG KÊ KẾT QUẢ THI (RESULTS) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'results' && (
        <div className={styles.resultsContainer}>
          {/* THANH LỌC VÀ TÌM KIẾM */}
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên ứng viên hoặc tin tuyển dụng..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <Filter size={18} />
              <select
                value={resultFilterJob}
                onChange={e => setResultFilterJob(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">Tất cả tin tuyển dụng</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingResults ? (
            <div className={styles.resultsLoading}>
              <RefreshCw size={32} className={styles.spin} />
              <p>Đang tải danh sách kết quả bài kiểm tra...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className={styles.emptyResults}>
              <Users size={48} color="#94a3b8" />
              <h3>Chưa có bài kiểm tra nào</h3>
              <p>Khi ứng viên làm bài thi năng lực, kết quả chấm điểm tự động sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>Ứng Viên</th>
                    <th>Tin Tuyển Dụng</th>
                    <th>Bài Kiểm Tra</th>
                    <th>Thời Gian Làm</th>
                    <th>Điểm Số</th>
                    <th>Kết Quả</th>
                    <th>Ngày Nộp</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(r => {
                    const isPassed = r.status === 'PASSED';
                    const isPending = r.status === 'PENDING';
                    const isInProgress = r.status === 'IN_PROGRESS';

                    return (
                      <tr key={r.id}>
                        <td>
                          <div className={styles.candidateCol}>
                            <strong>{r.candidateName}</strong>
                            <span className={styles.emailText}>{r.candidateEmail}</span>
                          </div>
                        </td>
                        <td>{r.jobTitle}</td>
                        <td>
                          <span className={styles.testBadge}>{r.title}</span>
                        </td>
                        <td>{r.durationMinutes} phút</td>
                        <td>
                          {isPending ? (
                            <span className={styles.textMuted}>Chưa nộp</span>
                          ) : (
                            <strong className={isPassed ? styles.scoreGreen : styles.scoreRed}>
                              {r.score}%
                            </strong>
                          )}
                        </td>
                        <td>
                          {isPassed && (
                            <span className={`${styles.statusBadge} ${styles.badgePassed}`}>
                              ĐẠT ({r.score}%)
                            </span>
                          )}
                          {r.status === 'FAILED' && (
                            <span className={`${styles.statusBadge} ${styles.badgeFailed}`}>
                              Xem xét thêm ({r.score}%)
                            </span>
                          )}
                          {isPending && (
                            <span className={`${styles.statusBadge} ${styles.badgePending}`}>
                              Chờ làm bài
                            </span>
                          )}
                          {isInProgress && (
                            <span className={`${styles.statusBadge} ${styles.badgeProgress}`}>
                              Đang làm bài
                            </span>
                          )}
                        </td>
                        <td>
                          {r.submittedAt
                            ? new Date(r.submittedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </td>
                        <td>
                          <div className={styles.actionBtns}>
                            {(isPassed || r.status === 'FAILED') && (
                              <button
                                className={styles.btnViewDetail}
                                onClick={() => handleViewTestDetail(r.id)}
                                title="Xem chi tiết bài làm"
                              >
                                Xem bài làm
                              </button>
                            )}

                            {isPassed && (
                              <button
                                className={styles.btnSchedule}
                                onClick={() => navigate('/interviews')}
                                title="Lên lịch phỏng vấn"
                              >
                                Lên lịch PV
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL XEM CHI TIẾT BÀI LÀM CỦA ỨNG VIÊN */}
      {selectedTestDetail && (
        <div className={styles.modalOverlay}>
          <div className={styles.detailModalContent}>
            <div className={styles.detailModalHeader}>
              <div>
                <h3>Chi Tiết Bài Làm - {selectedTestDetail.candidateName}</h3>
                <p>{selectedTestDetail.title} &bull; {selectedTestDetail.jobTitle}</p>
              </div>
              <button
                className={styles.btnClose}
                onClick={() => setSelectedTestDetail(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.detailSummaryBar}>
              <div className={styles.summaryMetric}>
                <span>Điểm số:</span>
                <strong className={selectedTestDetail.score >= selectedTestDetail.passingScore ? styles.scoreGreen : styles.scoreRed}>
                  {selectedTestDetail.score}%
                </strong>
              </div>
              <div className={styles.summaryMetric}>
                <span>Số câu đúng:</span>
                <strong>{selectedTestDetail.correctAnswersCount} / {selectedTestDetail.totalQuestions}</strong>
              </div>
              <div className={styles.summaryMetric}>
                <span>Điểm đạt chuẩn:</span>
                <strong>&ge; {selectedTestDetail.passingScore}%</strong>
              </div>
              <div className={styles.summaryMetric}>
                <span>Kết quả:</span>
                <span className={selectedTestDetail.score >= selectedTestDetail.passingScore ? styles.badgePassed : styles.badgeFailed}>
                  {selectedTestDetail.score >= selectedTestDetail.passingScore ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'}
                </span>
              </div>
            </div>

            <div className={styles.detailQuestionsList}>
              {selectedTestDetail.questionReviews?.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className={`${styles.reviewCard} ${q.isCorrect ? styles.correctCard : styles.incorrectCard}`}
                >
                  <div className={styles.reviewHeader}>
                    <span className={styles.qIndex}>Câu {idx + 1}</span>
                    <span className={q.isCorrect ? styles.correctBadge : styles.incorrectBadge}>
                      {q.isCorrect ? 'Đúng' : 'Sai'}
                    </span>
                  </div>
                  <p className={styles.qTitle}>{q.question}</p>

                  <div className={styles.optionsReviewList}>
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctOptionIndex;
                      const isSelected = oIdx === q.candidateSelectedOptionIndex;

                      let cls = styles.optReviewItem;
                      if (isCorrect) cls += ` ${styles.optRight}`;
                      if (isSelected && !isCorrect) cls += ` ${styles.optWrong}`;

                      return (
                        <div key={oIdx} className={cls}>
                          <span className={styles.optLetter}>{String.fromCharCode(65 + oIdx)}</span>
                          <span className={styles.optText}>{opt}</span>
                          {isCorrect && <span className={styles.tagRight}>Đáp án đúng</span>}
                          {isSelected && !isCorrect && <span className={styles.tagWrong}>Ứng viên chọn</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className={styles.explanationBox}>
                      <strong>Giải thích:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.detailModalFooter}>
              {selectedTestDetail.score >= selectedTestDetail.passingScore && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => {
                    setSelectedTestDetail(null);
                    navigate('/interviews');
                  }}
                >
                  Lên Lịch Phỏng Vấn Ngay
                </button>
              )}
              <button
                className={styles.btnSecondary}
                onClick={() => setSelectedTestDetail(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmployerAssessmentsPage;
