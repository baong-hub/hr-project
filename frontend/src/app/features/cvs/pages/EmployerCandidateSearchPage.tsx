import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cvsService } from '../../../core/services/cvs.service';
import { jobsService } from '../../../core/services/jobs.service';
import type { CandidateProfileDto } from '../../../core/models/cv.model';
import type { JobDto } from '../../../core/models/job.model';
import { toast } from '../../../core/services/toast.service';
import { CITY_OPTIONS } from '../../../core/utils/city.utils';
import styles from './EmployerCandidateSearchPage.module.scss';
import { CandidateCardBase } from '../../../shared/components/cards/CandidateCardBase';
import { FormField } from '../../../shared/components/form-field/FormField';
import { Modal } from '../../../shared/components/modal/Modal';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  SlidersHorizontal,
  FilterX, 
  FileText, 
  Send, 
  MessageSquare, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2,
  Eye
} from 'lucide-react';

const POPULAR_SKILLS = [
  '.NET', 'React', 'TypeScript', 'Node.js', 'Python', 
  'Java', 'Docker', 'Golang', 'Vue', 'AWS', 
  'Kubernetes', 'Flutter', 'SQL', 'Spring Boot'
];

export const EmployerCandidateSearchPage: React.FC = () => {
  const navigate = useNavigate();

  // Filter States
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Collapsible filter sections state (pattern from /jobs FilterPanel)
  const [expandedSections, setExpandedSections] = useState({
    keyword: true,
    level: true,
    location: true,
    skills: true,
  });

  // Search trigger helper
  const [triggerQuery, setTriggerQuery] = useState(0);

  // Result data states
  const [candidates, setCandidates] = useState<CandidateProfileDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal: Invite to Job
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [targetCandidate, setTargetCandidate] = useState<CandidateProfileDto | null>(null);
  const [companyJobs, setCompanyJobs] = useState<JobDto[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [customInviteMsg, setCustomInviteMsg] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Modal: View Candidate CV & Profile Detail
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<CandidateProfileDto | null>(null);

  // Direct chat loading state
  const [chatLoadingId, setChatLoadingId] = useState<number | null>(null);

  // Fetch candidates from API
  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);
      try {
        // Gộp kỹ năng từ ô input và tags được chọn
        const allSkills = [...selectedSkills];
        if (skill.trim() && !allSkills.includes(skill.trim())) {
          allSkills.push(skill.trim());
        }

        const response = await cvsService.searchCandidates({
          page,
          pageSize,
          skill: allSkills.length > 0 ? allSkills.join(',') : undefined,
          search: search.trim() || undefined,
          location: location || undefined,
          level: level || undefined
        });

        if (response.success && response.data) {
          setCandidates(response.data);
        } else {
          setError(response.error?.message || 'Không thể tìm kiếm hồ sơ ứng viên.');
        }
      } catch (err: any) {
        setError('Có lỗi xảy ra khi kết nối máy chủ tìm kiếm.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [page, triggerQuery, level, location, selectedSkills]);

  // Toggle skill tag
  const handleToggleSkill = (s: string) => {
    setPage(1);
    setSelectedSkills(prev => 
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    );
  };

  // Submit filters
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setTriggerQuery(prev => prev + 1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearch('');
    setSkill('');
    setSelectedSkills([]);
    setLevel('');
    setLocation('');
    setPage(1);
    setTriggerQuery(prev => prev + 1);
  };

  // Open Invite to Job Modal
  const handleOpenInviteModal = async (candidate: CandidateProfileDto) => {
    setTargetCandidate(candidate);
    setInviteModalOpen(true);
    setSelectedJobId('');
    setCustomInviteMsg(
      `Chào bạn ${candidate.fullName}, qua xem xét hồ sơ năng lực ấn tượng của bạn trên HR Portal, chúng tôi nhận thấy chuyên môn và định hướng của bạn rất phù hợp với dự án và vị trí tuyển dụng của chúng tôi. Trân trọng mời bạn tham khảo và ứng tuyển!`
    );

    // Fetch active company jobs if not yet fetched
    if (companyJobs.length === 0) {
      setLoadingJobs(true);
      try {
        const res = await jobsService.getJobs({ page: 1, pageSize: 50 });
        if (res.data && res.data.data) {
          const items = res.data.data.items || [];
          setCompanyJobs(items);
          if (items.length > 0) {
            setSelectedJobId(items[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingJobs(false);
      }
    } else {
      setSelectedJobId(companyJobs[0]?.id || '');
    }
  };

  // Submit Job Invitation
  const handleSubmitInvite = async () => {
    if (!targetCandidate || !selectedJobId) {
      toast.error('Vui lòng chọn tin tuyển dụng để gửi lời mời.');
      return;
    }

    setSendingInvite(true);
    try {
      const res = await cvsService.inviteToJob(targetCandidate.id, {
        jobId: Number(selectedJobId),
        message: customInviteMsg.trim() || undefined
      });

      if (res.success) {
        toast.success(`Đã gửi lời mời ứng tuyển thành công tới ứng viên ${targetCandidate.fullName}!`);
        setInviteModalOpen(false);
      } else {
        toast.error(res.error?.message || 'Không thể gửi lời mời ứng tuyển.');
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi gửi lời mời ứng tuyển.');
    } finally {
      setSendingInvite(false);
    }
  };

  // Start direct chat via SignalR
  const handleDirectChat = async (candidate: CandidateProfileDto) => {
    setChatLoadingId(candidate.id);
    try {
      const res = await cvsService.getOrCreateDirectChat(candidate.id);
      if (res.success && res.data?.conversationId) {
        toast.success(`Đang mở phòng trao đổi trực tiếp với ${candidate.fullName}...`);
        navigate(`/messages?conversationId=${res.data.conversationId}`);
      } else {
        toast.error(res.error?.message || 'Không thể khởi tạo cuộc hội thoại chat.');
      }
    } catch (err: any) {
      toast.error('Có lỗi khi mở kênh chat trực tiếp.');
    } finally {
      setChatLoadingId(null);
    }
  };

  // Open detail preview modal
  const handleOpenDetailModal = (candidate: CandidateProfileDto) => {
    setSelectedCandidateDetail(candidate);
    setDetailModalOpen(true);
  };

  return (
    <div className={styles.searchContainer}>
      {/* HERO BANNER */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Sparkles size={14} /> Săn ứng viên chủ động (Active Talent Sourcing)
          </div>
          <h1>Kho Hồ Sơ Ứng Viên Mở (Public Talent Pool)</h1>
          <p>
            Chủ động săn đầu người, lọc ứng viên IT chất lượng cao theo kỹ năng, số năm kinh nghiệm và địa điểm. 
            Mời ứng tuyển vào Job qua Email/SignalR hoặc trò chuyện trực tiếp 1-1 tức thì.
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statItem}>
            <span className={styles.statVal}>100%</span>
            <span className={styles.statLabel}>Hồ sơ công khai</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statVal}>SignalR</span>
            <span className={styles.statLabel}>Kết nối tức thì</span>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className={styles.filterPanel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <SlidersHorizontal size={18} />
            <span>Bộ lọc tìm ứng viên</span>
          </div>
          {(search || skill || selectedSkills.length > 0 || level || location) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className={styles.btnClearFilters}
            >
              <FilterX size={14} /> Xóa tất cả bộ lọc
            </button>
          )}
        </div>

        <form onSubmit={handleSearchSubmit}>
          <div className={styles.filterSections}>
            {/* Section 1: Keyword */}
            <div className={styles.filterSection}>
              <button
                type="button"
                className={styles.sectionHeader}
                onClick={() => setExpandedSections(prev => ({ ...prev, keyword: !prev.keyword }))}
              >
                <span className={styles.sectionTitle}>Từ khóa tìm kiếm</span>
                <ChevronDown size={16} className={`${styles.chevron} ${expandedSections.keyword ? styles.chevronOpen : ''}`} />
              </button>
              {expandedSections.keyword && (
                <div className={styles.sectionBody}>
                  <FormField
                    prefixIcon={<Search size={16} />}
                    placeholder="Tên ứng viên, vị trí, tóm tắt..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Section 2: Level */}
            <div className={styles.filterSection}>
              <button
                type="button"
                className={styles.sectionHeader}
                onClick={() => setExpandedSections(prev => ({ ...prev, level: !prev.level }))}
              >
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionTitle}>Cấp bậc & Kinh nghiệm</span>
                  {level && <span className={styles.activeCountBadge}>1</span>}
                </div>
                <ChevronDown size={16} className={`${styles.chevron} ${expandedSections.level ? styles.chevronOpen : ''}`} />
              </button>
              {expandedSections.level && (
                <div className={styles.sectionBody}>
                  <FormField
                    control="select"
                    prefixIcon={<Briefcase size={16} />}
                    value={level}
                    onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                    options={[
                      { value: '', label: 'Tất cả cấp bậc' },
                      { value: 'Junior', label: 'Junior / Fresher (0 - 2 năm)' },
                      { value: 'Mid', label: 'Middle (2 - 4 năm)' },
                      { value: 'Senior', label: 'Senior (5 - 8 năm)' },
                      { value: 'Lead', label: 'Lead / Manager (> 8 năm)' },
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Section 3: Location */}
            <div className={styles.filterSection}>
              <button
                type="button"
                className={styles.sectionHeader}
                onClick={() => setExpandedSections(prev => ({ ...prev, location: !prev.location }))}
              >
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionTitle}>Địa điểm</span>
                  {location && <span className={styles.activeCountBadge}>1</span>}
                </div>
                <ChevronDown size={16} className={`${styles.chevron} ${expandedSections.location ? styles.chevronOpen : ''}`} />
              </button>
              {expandedSections.location && (
                <div className={styles.sectionBody}>
                  <FormField
                    control="select"
                    prefixIcon={<MapPin size={16} />}
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                    options={CITY_OPTIONS}
                  />
                </div>
              )}
            </div>

            {/* Section 4: Skills */}
            <div className={styles.filterSection}>
              <button
                type="button"
                className={styles.sectionHeader}
                onClick={() => setExpandedSections(prev => ({ ...prev, skills: !prev.skills }))}
              >
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionTitle}>Kỹ năng ({selectedSkills.length})</span>
                  {selectedSkills.length > 0 && (
                    <span className={styles.activeCountBadge}>{selectedSkills.length}</span>
                  )}
                </div>
                <ChevronDown size={16} className={`${styles.chevron} ${expandedSections.skills ? styles.chevronOpen : ''}`} />
              </button>
              {expandedSections.skills && (
                <div className={styles.sectionBody}>
                  <div className={styles.tagsList}>
                    {POPULAR_SKILLS.map(s => {
                      const isSelected = selectedSkills.includes(s);
                      return (
                        <button
                          type="button"
                          key={s}
                          className={`${styles.tagChip} ${isSelected ? styles.tagChipActive : ''}`}
                          onClick={() => handleToggleSkill(s)}
                        >
                          {isSelected && <CheckCircle2 size={12} className={styles.checkCircleMini} />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.filterActions}>
            <button type="submit" className={styles.btnPrimary}>
              <Search size={16} /> Lọc ứng viên
            </button>
            {(search || skill || selectedSkills.length > 0 || level || location) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className={styles.btnSecondary}
                title="Xóa toàn bộ bộ lọc"
              >
                <FilterX size={16} /> Đặt lại
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className={styles.errorBox}>
          {error}
        </div>
      )}

      {/* RESULTS HEADER */}
      <div className={styles.resultsHeader}>
        <div className={styles.countInfo}>
          Tìm thấy <span>{candidates.length}</span> ứng viên tiềm năng phù hợp
        </div>
      </div>

      {/* RESULTS LIST */}
      {loading ? (
        <div className={styles.loaderWrap}>
          <Loader2 className={styles.loaderIcon} />
          <span className={styles.loaderText}>Đang quét hồ sơ ứng viên từ Talent Pool...</span>
        </div>
      ) : candidates.length === 0 ? (
        <div className={styles.emptyState}>
          <FilterX className={styles.emptyIcon} />
          <h3>Không tìm thấy ứng viên nào phù hợp</h3>
          <p>Hãy thử mở rộng bộ lọc kỹ năng, vị trí hoặc cấp bậc để khám phá thêm nhiều nhân tài trong hệ thống.</p>
        </div>
      ) : (
        <div className={styles.candidatesList}>
          {candidates.map((candidate) => (
            <CandidateCardBase
              key={candidate.id}
              candidate={candidate}
              renderActions={(cand) => (
                <>
                  <button 
                    type="button" 
                    className={styles.btnInvite}
                    onClick={() => handleOpenInviteModal(cand)}
                  >
                    <Send size={14} /> Mời ứng tuyển vào Job
                  </button>

                  <button 
                    type="button" 
                    className={styles.btnChat}
                    disabled={chatLoadingId === cand.id}
                    onClick={() => handleDirectChat(cand)}
                  >
                    {chatLoadingId === cand.id ? (
                      <Loader2 size={14} className={styles.loaderSpin} />
                    ) : (
                      <MessageSquare size={14} />
                    )}
                    Trò chuyện ngay
                  </button>

                  <button 
                    type="button" 
                    className={styles.btnViewCv}
                    onClick={() => handleOpenDetailModal(cand)}
                  >
                    <Eye size={14} /> Xem hồ sơ & CV
                  </button>
                </>
              )}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {candidates.length > 0 && (
        <div className={styles.pagination}>
          <button 
            type="button"
            className={styles.btnSecondary}
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft size={16} /> Trang trước
          </button>
          <span className={styles.pageNumber}>Trang {page}</span>
          <button 
            type="button"
            className={styles.btnSecondary}
            disabled={candidates.length < pageSize}
            onClick={() => setPage(p => p + 1)}
          >
            Trang sau <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* MODAL 1: INVITE CANDIDATE TO JOB */}
      {inviteModalOpen && targetCandidate && (
        <Modal
          isOpen={true}
          onClose={() => setInviteModalOpen(false)}
          size="md"
          title={
            <div className={styles.modalTitle}>
              <Send size={18} className={styles.iconSuccess} />
              <span>Mời ứng viên ứng tuyển vào vị trí</span>
            </div>
          }
          footer={
            <>
              <button 
                type="button" 
                className={styles.btnSecondary}
                onClick={() => setInviteModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className={styles.btnPrimary}
                disabled={sendingInvite || !selectedJobId}
                onClick={handleSubmitInvite}
              >
                {sendingInvite ? (
                  <>
                    <Loader2 size={16} className={styles.loaderSpin} /> Đang gửi lời mời...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Gửi lời mời ngay
                  </>
                )}
              </button>
            </>
          }
        >
          {/* Candidate Info Mini Box */}
          <div className={styles.candidateSummaryBox}>
            <div className={styles.avatarMini}>
              {targetCandidate.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className={styles.candidateNameSm}>{targetCandidate.fullName}</h4>
              <span className={styles.candidateEmailSm}>
                {targetCandidate.currentPosition || 'Chuyên viên IT'} • {targetCandidate.location || 'Việt Nam'}
              </span>
            </div>
          </div>

          {/* Job Selector */}
          {loadingJobs ? (
            <div className={styles.loadingJobsBox}>
              <Loader2 size={14} className={styles.loaderSpin} /> Đang tải danh sách công việc...
            </div>
          ) : companyJobs.length === 0 ? (
            <div className={styles.noJobsWarning}>
              Công ty bạn hiện chưa có tin tuyển dụng nào đang đăng. Vui lòng đăng tin tuyển dụng trước khi mời ứng viên.
            </div>
          ) : (
            <FormField
              control="select"
              label="Chọn vị trí tuyển dụng của công ty bạn (*)"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
              options={companyJobs.map(j => ({
                value: j.id,
                label: `${j.title} (${j.salaryFrom && j.salaryTo ? `${j.salaryFrom.toLocaleString()} - ${j.salaryTo.toLocaleString()} VND` : 'Thỏa thuận'}) - ${j.city || 'Toàn quốc'}`
              }))}
            />
          )}

          {/* Custom Invitation Message */}
          <FormField
            control="textarea"
            label="Lời nhắn trân trọng gửi đến ứng viên (Tự động gửi kèm Email & Thông báo)"
            rows={4}
            value={customInviteMsg}
            onChange={(e) => setCustomInviteMsg(e.target.value)}
            placeholder="Nhập lời mời trân trọng của nhà tuyển dụng..."
          />

          <div className={styles.inviteTipBox}>
            💡 <strong>Hệ thống tự động:</strong> Khi gửi lời mời, ứng viên sẽ nhận được thông báo đẩy thời gian thực (SignalR), email thư mời trang trọng kèm link trực tiếp vào tin tuyển dụng và một phòng hội thoại chat được kích hoạt sẵn để kết nối trao đổi.
          </div>
        </Modal>
      )}

      {/* MODAL 2: VIEW CANDIDATE DETAIL & CV */}
      {detailModalOpen && selectedCandidateDetail && (
        <Modal
          isOpen={true}
          onClose={() => setDetailModalOpen(false)}
          size="lg"
          title={
            <div className={styles.modalTitle}>
              <FileText size={18} className={styles.iconPrimary} />
              <span>Hồ sơ năng lực ứng viên: {selectedCandidateDetail.fullName}</span>
            </div>
          }
          footer={
            <>
              <button 
                type="button" 
                className={styles.btnSecondary}
                onClick={() => setDetailModalOpen(false)}
              >
                Đóng
              </button>
              <button 
                type="button" 
                className={styles.btnPrimary}
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenInviteModal(selectedCandidateDetail);
                }}
              >
                <Send size={14} /> Mời ứng tuyển ngay
              </button>
            </>
          }
        >
          {/* Header profile info */}
          <div className={styles.candidateDetailHeader}>
            <div className={`${styles.avatarMini} ${styles.avatarLarge}`}>
              {selectedCandidateDetail.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className={styles.detailName}>{selectedCandidateDetail.fullName}</h3>
              <div className={styles.detailMetaRow}>
                {selectedCandidateDetail.location && <span>📍 {selectedCandidateDetail.location}</span>}
                {selectedCandidateDetail.email && <span>📧 {selectedCandidateDetail.email}</span>}
                {selectedCandidateDetail.phoneNumber && <span>📞 {selectedCandidateDetail.phoneNumber}</span>}
              </div>
            </div>
          </div>

          {/* Objective */}
          {selectedCandidateDetail.objective && (
            <div>
              <label className={styles.detailSectionLabel}>
                Mục tiêu nghề nghiệp & Giới thiệu
              </label>
              <p className={styles.detailBox}>
                {selectedCandidateDetail.objective}
              </p>
            </div>
          )}

          {/* Experience Summary */}
          {selectedCandidateDetail.experienceSummary && (
            <div>
              <label className={styles.detailSectionLabel}>
                Tóm tắt kinh nghiệm làm việc
              </label>
              <p className={styles.detailBox}>
                {selectedCandidateDetail.experienceSummary}
              </p>
            </div>
          )}

          {/* Skills */}
          <div>
            <label className={styles.detailSectionLabel}>
              Kỹ năng chuyên môn
            </label>
            <div className={styles.skillsWrap}>
              {selectedCandidateDetail.skills && selectedCandidateDetail.skills.map((s, idx) => (
                <span key={idx} className={styles.detailSkillTag}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* CV File Preview / Download */}
          <div className={styles.cvDivider}>
            <label className={styles.detailSectionLabel}>
              Tệp đính kèm CV chính thức
            </label>
            {selectedCandidateDetail.defaultCvUrl ? (
              <div className={styles.cvAttachedCard}>
                <div className={styles.cvAttachedLeft}>
                  <FileText size={20} className={styles.iconPrimary} />
                  <div>
                    <div className={styles.cvAttachedTitle}>
                      {selectedCandidateDetail.defaultCvTitle || 'CV_Chinh_Thuc.pdf'}
                    </div>
                    <span className={styles.cvAttachedFormat}>Định dạng PDF / Đã xác thực</span>
                  </div>
                </div>
                <a 
                  href={selectedCandidateDetail.defaultCvUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`${styles.btnPrimary} ${styles.btnDownloadSmall}`}
                >
                  <ExternalLink size={14} /> Mở xem CV
                </a>
              </div>
            ) : (
              <div className={styles.noCvFallback}>
                Ứng viên chưa đính kèm file CV PDF tải lên, thông tin hồ sơ được trích xuất từ CV Builder trực tuyến.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
