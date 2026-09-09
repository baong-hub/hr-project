import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  HelpCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { technicalTestService } from '../../../core/services/technical-test.service';
import type {
  CandidateTestView,
  SubmitTestResult,
  TestDetailResult,
  SubmitAnswerItem
} from '../../../core/models/technical-test.model';
import { toast } from '../../../core/services/toast.service';
import styles from './CandidateAssessmentPage.module.scss';

export const CandidateAssessmentPage: React.FC = () => {
  const { testId: testIdParam } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const testId = Number(testIdParam);

  const [loading, setLoading] = useState<boolean>(true);
  const [testData, setTestData] = useState<CandidateTestView | null>(null);
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Lưu đáp án của ứng viên: Map<questionId, selectedOptionIndex>
  const [answers, setAnswers] = useState<Record<number, number>>({});
  // Danh sách các câu gắn cờ xem lại: Set<questionId>
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  // Đếm ngược thời gian
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Modal xác nhận nộp bài
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Kết quả sau khi nộp
  const [submitResult, setSubmitResult] = useState<SubmitTestResult | null>(null);
  const [detailResult, setDetailResult] = useState<TestDetailResult | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Load bài test
  const loadTest = useCallback(async () => {
    if (!testId) return;
    try {
      setLoading(true);
      const res = await technicalTestService.getTestForCandidate(testId);
      if (res.data) {
        setTestData(res.data);

        // Nếu bài test đã hoàn thành trước đó, load luôn kết quả
        if (res.data.status === 'PASSED' || res.data.status === 'FAILED') {
          loadResult();
        } else if (res.data.status === 'IN_PROGRESS' && res.data.startTime) {
          // Khôi phục thời gian đang làm dở
          initTimer(res.data.startTime, res.data.durationMinutes, res.data.serverCurrentTime);
          setExamStarted(true);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải thông tin bài kiểm tra.');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  const loadResult = async () => {
    try {
      const res = await technicalTestService.getTestResult(testId);
      if (res.data) {
        setDetailResult(res.data);
      }
    } catch { }
  };

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  // Khởi tạo đếm ngược
  const initTimer = (startTimeStr: string, durationMinutes: number, serverTimeStr?: string) => {
    const start = new Date(startTimeStr).getTime();
    const serverNow = serverTimeStr ? new Date(serverTimeStr).getTime() : Date.now();
    const clientNow = Date.now();
    const serverOffset = serverNow - clientNow;

    const totalSeconds = durationMinutes * 60;
    const elapsedSeconds = Math.max(0, Math.floor((clientNow + serverOffset - start) / 1000));
    const left = Math.max(0, totalSeconds - elapsedSeconds);

    setRemainingSeconds(left);
  };

  // Bắt đầu làm bài thi
  const handleStartExam = async () => {
    try {
      setLoading(true);
      const res = await technicalTestService.startTest(testId);
      if (res.data) {
        setExamStarted(true);
        initTimer(res.data.startTime, res.data.durationMinutes, res.data.serverCurrentTime);
        toast.success('Bài thi đã bắt đầu! Chúc bạn làm bài thật tốt.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể bắt đầu bài kiểm tra.');
    } finally {
      setLoading(false);
    }
  };

  // Hiệu ứng đếm ngược thời gian
  useEffect(() => {
    if (!examStarted || remainingSeconds <= 0 || submitResult || detailResult) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }

        // Cảnh báo khi còn 5 phút (300s) và 1 phút (60s)
        if (prev === 300) {
          toast.warning('⚠️ Thời gian làm bài chỉ còn lại 5 phút!');
        } else if (prev === 60) {
          toast.warning('🚨 Thời gian làm bài chỉ còn lại 1 phút cuối cùng!');
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, remainingSeconds, submitResult, detailResult]);

  // Tự động nộp bài khi hết giờ
  const handleAutoSubmit = async () => {
    toast.warning('Hết thời gian làm bài! Hệ thống đang tự động nộp bài thi của bạn...');
    await performSubmit();
  };

  // Chọn đáp án
  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Gắn cờ xem lại
  const handleToggleFlag = (questionId: number) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  // Nộp bài thi
  const performSubmit = async () => {
    if (!testData) return;
    try {
      setIsSubmitting(true);
      const submissionAnswers: SubmitAnswerItem[] = testData.questions.map(q => ({
        questionId: q.id,
        selectedOptionIndex: answers[q.id] !== undefined ? answers[q.id] : -1
      }));

      const res = await technicalTestService.submitTest(testId, submissionAnswers);
      if (res.data) {
        setSubmitResult(res.data);
        setShowSubmitModal(false);
        if (timerRef.current) clearInterval(timerRef.current);

        if (res.data.isPassed) {
          toast.success(`🎉 Chúc mừng! Bạn đã ĐẠT bài kiểm tra với ${res.data.score}% điểm!`);
        } else {
          toast.info(`Bạn đã nộp bài thành công với kết quả ${res.data.score}%.`);
        }

        // Tự động nạp kết quả chi tiết
        await loadResult();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi nộp bài thi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !testData) {
    return (
      <div className={styles.loadingContainer}>
        <RefreshCw className={styles.spinner} size={36} />
        <p>Đang tải dữ liệu bài kiểm tra năng lực...</p>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className={styles.errorContainer}>
        <AlertTriangle size={48} color="#ef4444" />
        <h2>Không tìm thấy bài kiểm tra</h2>
        <p>Bài kiểm tra không tồn tại hoặc bạn không có quyền truy cập.</p>
        <button className={styles.btnSecondary} onClick={() => navigate('/candidate/applications')}>
          Về danh sách ứng tuyển
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MÀN HÌNH KẾT QUẢ TỨC THÌ (KHI ĐÃ NỘP HOẶC ĐÃ HOÀN THÀNH)
  // -------------------------------------------------------------
  if (submitResult || detailResult || testData.status === 'PASSED' || testData.status === 'FAILED') {
    const finalScore = submitResult?.score ?? detailResult?.score ?? 0;
    const passingScore = submitResult?.passingScore ?? detailResult?.passingScore ?? testData.passingScore;
    const isPassed = submitResult?.isPassed ?? (detailResult ? detailResult.score >= detailResult.passingScore : finalScore >= passingScore);
    const totalQ = submitResult?.totalQuestions ?? detailResult?.totalQuestions ?? testData.totalQuestions;
    const correctCount = submitResult?.correctCount ?? detailResult?.correctAnswersCount ?? Math.round((finalScore * totalQ) / 100);

    return (
      <div className={styles.resultPage}>
        <div className={styles.resultCard}>
          <div className={`${styles.resultHeader} ${isPassed ? styles.passed : styles.failed}`}>
            <div className={styles.resultIconWrapper}>
              {isPassed ? <Award size={56} className={styles.awardIcon} /> : <AlertTriangle size={56} />}
            </div>
            <h1>{isPassed ? 'Chúc Mừng Bạn Đã Vượt Qua Bài Kiểm Tra!' : 'Kết Quả Bài Kiểm Tra Năng Lực'}</h1>
            <p className={styles.resultSub}>{testData.title} &bull; {testData.jobTitle}</p>
          </div>

          <div className={styles.scoreSection}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNumber}>{finalScore}%</span>
              <span className={styles.scoreLabel}>Điểm Đạt Được</span>
            </div>

            <div className={styles.scoreMetrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Kết quả xếp loại</span>
                <span className={`${styles.metricBadge} ${isPassed ? styles.badgePassed : styles.badgeFailed}`}>
                  {isPassed ? 'ĐẠT CHUẨN (PASSED)' : 'ĐANG XEM XÉT THÊM'}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Số câu trả lời đúng</span>
                <span className={styles.metricValue}>
                  <strong>{correctCount}</strong> / {totalQ} câu hỏi
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Điểm đạt chuẩn yêu cầu</span>
                <span className={styles.metricValue}>&ge; {passingScore}%</span>
              </div>
            </div>
          </div>

          {/* Banner thông báo hành động tự động */}
          {isPassed ? (
            <div className={styles.nextStepBannerPassed}>
              <Sparkles className={styles.sparkleIcon} size={24} />
              <div>
                <h4>TỰ ĐỘNG CHUYỂN SANG VÒNG SHORTLISTED</h4>
                <p>
                  Với kết quả xuất sắc này, hồ sơ ứng tuyển của bạn đã được hệ thống <strong>tự động chuyển sang trạng thái SHORTLISTED</strong>!
                  Nhà tuyển dụng <strong>{testData.companyName}</strong> đã nhận được thông báo kết quả và sẽ sớm liên hệ mở lịch phỏng vấn tiếp theo cùng bạn.
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.nextStepBannerFailed}>
              <HelpCircle size={24} />
              <div>
                <h4>Đã ghi nhận kết quả vào hồ sơ</h4>
                <p>
                  Điểm số bài kiểm tra đã được lưu lại để nhà tuyển dụng xem xét đánh giá tổng quan năng lực cùng với kinh nghiệm trong CV của bạn.
                </p>
              </div>
            </div>
          )}

          {/* Xem lại lời giải thích nếu có detailResult */}
          {detailResult && detailResult.questionReviews?.length > 0 && (
            <div className={styles.reviewSection}>
              <button
                className={styles.btnToggleReview}
                onClick={() => setShowExplanation(prev => !prev)}
              >
                {showExplanation ? 'Thu gọn chi tiết đáp án' : 'Xem lại đáp án & lời giải thích chi tiết'}
              </button>

              {showExplanation && (
                <div className={styles.questionsReviewList}>
                  {detailResult.questionReviews.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className={`${styles.reviewCard} ${q.isCorrect ? styles.correctCard : styles.incorrectCard}`}
                    >
                      <div className={styles.reviewCardHeader}>
                        <span className={styles.reviewQIndex}>Câu {idx + 1}</span>
                        <span className={q.isCorrect ? styles.correctBadge : styles.incorrectBadge}>
                          {q.isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                      </div>
                      <p className={styles.reviewQuestionText}>{q.question}</p>

                      <div className={styles.reviewOptionsList}>
                        {q.options.map((opt, oIdx) => {
                          const isCorrectOption = oIdx === q.correctOptionIndex;
                          const isCandidateSelected = oIdx === q.candidateSelectedOptionIndex;

                          let optionClass = styles.reviewOption;
                          if (isCorrectOption) optionClass += ` ${styles.optionRight}`;
                          if (isCandidateSelected && !isCorrectOption) optionClass += ` ${styles.optionWrong}`;

                          return (
                            <div key={oIdx} className={optionClass}>
                              <span className={styles.optionLetter}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className={styles.optionContent}>{opt}</span>
                              {isCorrectOption && <span className={styles.rightBadge}>Đáp án đúng</span>}
                              {isCandidateSelected && !isCorrectOption && <span className={styles.wrongBadge}>Lựa chọn của bạn</span>}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className={styles.explanationBox}>
                          <strong>Lời giải thích:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.resultActions}>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate('/candidate/applications')}
            >
              Về Trang Quản Lý Ứng Tuyển
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MÀN HÌNH CHƯA BẮT ĐẦU (INTRO / READY SCREEN)
  // -------------------------------------------------------------
  if (!examStarted) {
    return (
      <div className={styles.introPage}>
        <div className={styles.introCard}>
          <div className={styles.introBadge}>
            <BookOpen size={16} /> Bài Đánh Giá Năng Lực Trực Tuyến
          </div>
          <h1>{testData.title}</h1>
          <p className={styles.introSubtitle}>
            Ứng tuyển vị trí: <strong>{testData.jobTitle}</strong> tại <strong>{testData.companyName}</strong>
          </p>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <Clock size={28} className={styles.infoIcon} />
              <div className={styles.infoValue}>{testData.durationMinutes} Phút</div>
              <div className={styles.infoLabel}>Thời gian làm bài</div>
            </div>

            <div className={styles.infoCard}>
              <BookOpen size={28} className={styles.infoIcon} />
              <div className={styles.infoValue}>{testData.questions.length} Câu hỏi</div>
              <div className={styles.infoLabel}>Hình thức trắc nghiệm</div>
            </div>

            <div className={styles.infoCard}>
              <Award size={28} className={styles.infoIcon} />
              <div className={styles.infoValue}>&ge; {testData.passingScore}%</div>
              <div className={styles.infoLabel}>Điểm đạt chuẩn</div>
            </div>
          </div>

          <div className={styles.rulesCard}>
            <h3>Quy định & Lưu ý trước khi làm bài thi:</h3>
            <ul>
              <li>Đồng hồ đếm ngược sẽ <strong>bắt đầu chạy ngay lập tức</strong> khi bạn bấm nút &quot;Bắt đầu làm bài&quot;.</li>
              <li>Hệ thống sẽ <strong>tự động nộp bài</strong> khi đồng hồ đếm ngược về 00:00.</li>
              <li>Bạn có thể chọn và thay đổi đáp án bất cứ lúc nào trước khi nộp bài.</li>
              <li>Sử dụng chức năng <strong>&quot;Gắn cờ xem lại&quot;</strong> để đánh dấu những câu bạn còn phân vân.</li>
              <li>Hệ thống <strong>tự động chấm điểm ngay khi nộp bài</strong>: Nếu điểm số đạt từ <strong>{testData.passingScore}% trở lên</strong>, hồ sơ của bạn sẽ tự động chuyển sang vòng <strong>SHORTLISTED</strong> và mở lịch phỏng vấn!</li>
            </ul>
          </div>

          <div className={styles.introActions}>
            <button className={styles.btnSecondary} onClick={() => navigate('/candidate/applications')}>
              Để sau
            </button>
            <button className={styles.btnStart} onClick={handleStartExam}>
              Bắt Đầu Làm Bài Kiểm Tra
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MÀN HÌNH ĐANG LÀM BÀI TRỰC TUYẾN (EXAM IN PROGRESS)
  // -------------------------------------------------------------
  const questions = testData.questions;
  const currentQ = questions[currentQuestionIndex];
  const qId = currentQ ? currentQ.id : 0;
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = remainingSeconds <= 300; // dưới 5 phút
  const isTimeDanger = remainingSeconds <= 60; // dưới 1 phút

  return (
    <div className={styles.examPage}>
      {/* HEADER CỐ ĐỊNH */}
      <header className={styles.examHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.examTitle}>{testData.title}</h2>
          <span className={styles.companyTag}>{testData.companyName}</span>
        </div>

        {/* ĐỒNG HỒ ĐẾM NGƯỢC THỜI GIAN THỰC */}
        <div className={`${styles.timerBox} ${isTimeCritical ? styles.timerWarning : ''} ${isTimeDanger ? styles.timerDanger : ''}`}>
          <Clock size={20} className={isTimeDanger ? styles.pulseIcon : ''} />
          <div className={styles.timerText}>
            <span className={styles.timerLabel}>Thời gian còn lại:</span>
            <span className={styles.timerCountdown}>{formatTime(remainingSeconds)}</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            className={styles.btnSubmitTop}
            onClick={() => setShowSubmitModal(true)}
          >
            Nộp bài thi
          </button>
        </div>
      </header>

      {/* BODY CHÍNH */}
      <div className={styles.examBody}>
        {/* CỘT TRÁI: NỘI DUNG CÂU HỎI */}
        <main className={styles.questionPanel}>
          {currentQ && (
            <div className={styles.questionCard}>
              <div className={styles.questionMeta}>
                <div className={styles.qBadges}>
                  <span className={styles.qNumberBadge}>
                    Câu {currentQuestionIndex + 1} / {questions.length}
                  </span>
                  {currentQ.category && (
                    <span className={styles.qCategoryBadge}>{currentQ.category}</span>
                  )}
                  {currentQ.difficulty && (
                    <span className={`${styles.qDifficultyBadge} ${styles[currentQ.difficulty.toLowerCase()]}`}>
                      {currentQ.difficulty}
                    </span>
                  )}
                </div>

                <button
                  className={`${styles.btnFlag} ${flaggedQuestions.has(qId) ? styles.flagged : ''}`}
                  onClick={() => handleToggleFlag(qId)}
                  title="Đánh dấu câu hỏi để xem lại sau"
                >
                  {flaggedQuestions.has(qId) ? 'Đã gắn cờ' : 'Gắn cờ xem lại'}
                </button>
              </div>

              {/* TIÊU ĐỀ CÂU HỎI */}
              <h3 className={styles.questionText}>{currentQ.question}</h3>

              {/* 4 LỰA CHỌN A, B, C, D */}
              <div className={styles.optionsContainer}>
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = answers[qId] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`${styles.optionCard} ${isSelected ? styles.selectedOption : ''}`}
                      onClick={() => handleSelectOption(qId, optIdx)}
                    >
                      <div className={styles.optionRadio}>
                        <span className={styles.optionLetter}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                      </div>
                      <div className={styles.optionText}>{opt}</div>
                      {isSelected && (
                        <CheckCircle2 size={20} className={styles.checkIcon} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ĐIỀU HƯỚNG TRƯỚC / SAU */}
              <div className={styles.questionNav}>
                <button
                  className={styles.btnNav}
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                >
                  Câu trước
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    className={`${styles.btnNav} ${styles.btnNext}`}
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  >
                    Câu tiếp theo
                  </button>
                ) : (
                  <button
                    className={`${styles.btnNav} ${styles.btnComplete}`}
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Hoàn thành & Nộp bài
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* CỘT PHẢI: BẢNG ĐIỀU HƯỚNG CÂU HỎI (QUESTION PALETTE) */}
        <aside className={styles.palettePanel}>
          <div className={styles.paletteCard}>
            <h4>Danh Sách Câu Hỏi</h4>
            <div className={styles.paletteSummary}>
              <span className={styles.summaryBadge}>
                Đã trả lời: <strong>{answeredCount}</strong> / {questions.length}
              </span>
            </div>

            {/* LƯỚI CÁC NÚT CÂU HỎI */}
            <div className={styles.paletteGrid}>
              {questions.map((q, idx) => {
                const curId = q.id;
                const isAnswered = answers[curId] !== undefined;
                const isFlagged = flaggedQuestions.has(curId);
                const isCurrent = idx === currentQuestionIndex;

                let cls = styles.paletteBtn;
                if (isCurrent) cls += ` ${styles.paletteCurrent}`;
                if (isAnswered) cls += ` ${styles.paletteAnswered}`;
                if (isFlagged) cls += ` ${styles.paletteFlagged}`;

                return (
                  <button
                    key={curId || idx}
                    className={cls}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    title={`Câu ${idx + 1}: ${isAnswered ? 'Đã làm' : 'Chưa làm'}`}
                  >
                    {idx + 1}
                    {isFlagged && <span className={styles.flagDot} />}
                  </button>
                );
              })}
            </div>

            {/* CHÚ THÍCH TRẠNG THÁI */}
            <div className={styles.paletteLegend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendBox} ${styles.paletteAnswered}`} />
                <span>Đã làm ({answeredCount})</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendBox}`} />
                <span>Chưa làm ({questions.length - answeredCount})</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendBox} ${styles.paletteFlagged}`} />
                <span>Gắn cờ xem lại ({flaggedQuestions.size})</span>
              </div>
            </div>

            <button
              className={styles.btnSubmitSidebar}
              onClick={() => setShowSubmitModal(true)}
            >
              Nộp bài kiểm tra
            </button>
          </div>
        </aside>
      </div>

      {/* MODAL XÁC NHẬN NỘP BÀI */}
      {showSubmitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Xác Nhận Nộp Bài Kiểm Tra?</h3>
            <p className={styles.modalSub}>
              Bạn đã hoàn thành <strong>{answeredCount}</strong> trên tổng số <strong>{questions.length}</strong> câu hỏi.
            </p>

            {answeredCount < questions.length && (
              <div className={styles.unansweredWarning}>
                <AlertTriangle size={20} color="#f59e0b" />
                <span>
                  Bạn vẫn còn <strong>{questions.length - answeredCount} câu chưa trả lời</strong>.
                  Bạn có chắc chắn muốn nộp bài ngay bây giờ?
                </span>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              >
                Tiếp tục làm bài
              </button>
              <button
                className={styles.btnConfirmSubmit}
                onClick={performSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang chấm điểm...' : 'Đồng ý nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CandidateAssessmentPage;
