import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cvsService } from '../../../core/services/cvs.service';
import { jobsService } from '../../../core/services/jobs.service';
import type { CandidateProfileDto } from '../../../core/models/cv.model';
import type { JobDto } from '../../../core/models/job.model';
import { toast } from '../../../core/services/toast.service';
import { CITY_OPTIONS } from '../../../core/utils/city.utils';
import styles from './EmployerCandidateSearchPage.module.scss';
import { 
  Search, 
  Tag, 
  MapPin, 
  Briefcase, 
  UserCheck, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  FilterX, 
  FileText, 
  Send, 
  MessageSquare, 
  ExternalLink, 
  X, 
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
        <form onSubmit={handleSearchSubmit}>
          <div className={styles.filterGrid}>
            {/* Keyword Search */}
            <div className={styles.formGroup}>
              <label>Từ khóa tìm kiếm</label>
              <div className={styles.inputWrapper}>
                <Search className={styles.icon} />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên ứng viên, vị trí, tóm tắt kinh nghiệm..."
                />
              </div>
            </div>

            {/* Experience Level */}
            <div className={styles.formGroup}>
              <label>Cấp bậc & Kinh nghiệm</label>
              <div className={styles.inputWrapper}>
                <Briefcase className={styles.icon} />
                <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
                  <option value="">Tất cả cấp bậc</option>
                  <option value="Junior">Junior / Fresher (0 - 2 năm)</option>
                  <option value="Mid">Middle (2 - 4 năm)</option>
                  <option value="Senior">Senior (5 - 8 năm)</option>
                  <option value="Lead">Lead / Manager (&gt; 8 năm)</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div className={styles.formGroup}>
              <label>Địa điểm làm việc</label>
              <div className={styles.inputWrapper}>
                <MapPin className={styles.icon} />
                <select value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }}>
                  {CITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className={styles.filterActions}>
              <button type="submit" className={styles.btnPrimary}>
                <Search size={16} /> Lọc ứng viên
              </button>
              {(search || skill || selectedSkills.length > 0 || level || location) && (
                <button type="button" onClick={handleClearFilters} className={styles.btnSecondary} title="Xóa toàn bộ bộ lọc">
                  <FilterX size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Skill Tags Selection */}
          <div className={styles.quickTagsContainer}>
            <div className={styles.tagsLabel}>
              <Tag size={14} /> Kỹ năng công nghệ gợi ý:
            </div>
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
                    {isSelected && <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          color: '#b91c1c',
          fontSize: '14px',
          fontWeight: 500
        }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '14px' }}>
          <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', width: '36px', height: '36px' }} />
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Đang quét hồ sơ ứng viên từ Talent Pool...</span>
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
            <div key={candidate.id} className={styles.candidateCard}>
              <div className={styles.candidateMain}>
                {/* Avatar & Visibility Badge */}
                <div className={styles.avatarCol}>
                  <div className={styles.avatar}>
                    {candidate.avatarUrl ? (
                      <img src={candidate.avatarUrl} alt={candidate.fullName} />
                    ) : (
                      candidate.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className={styles.visibilityBadge}>
                    <UserCheck size={10} /> PUBLIC
                  </span>
                </div>

                {/* Candidate Content Info */}
                <div className={styles.candidateInfo}>
                  <div className={styles.nameRow}>
                    <h3 className={styles.name}>{candidate.fullName}</h3>
                    {candidate.currentPosition && (
                      <span className={styles.currentRole}>{candidate.currentPosition}</span>
                    )}
                  </div>

                  <div className={styles.metaRow}>
                    {candidate.currentCompany && (
                      <div className={styles.metaItem}>
                        <Briefcase /> {candidate.currentCompany}
                      </div>
                    )}
                    <div className={styles.metaItem}>
                      <Briefcase /> {candidate.totalYearsExperience ? `${candidate.totalYearsExperience} năm kinh nghiệm` : 'Dưới 1 năm kinh nghiệm'}
                    </div>
                    {candidate.location && (
                      <div className={styles.metaItem}>
                        <MapPin /> {candidate.location}
                      </div>
                    )}
                  </div>

                  {candidate.objective && (
                    <p className={styles.objective}>{candidate.objective}</p>
                  )}

                  {/* Skills badges */}
                  <div className={styles.skillsRow}>
                    {candidate.skills && candidate.skills.length > 0 ? (
                      candidate.skills.slice(0, 8).map((s, idx) => (
                        <span key={idx} className={styles.skillBadge}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Chưa cập nhật kỹ năng nổi bật</span>
                    )}
                    {candidate.skills && candidate.skills.length > 8 && (
                      <span className={styles.skillBadge} style={{ background: '#e0e7ff', color: '#4338ca' }}>
                        +{candidate.skills.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.candidateActions}>
                {/* 1. Invite to Job Button */}
                <button 
                  type="button" 
                  className={styles.btnInvite}
                  onClick={() => handleOpenInviteModal(candidate)}
                >
                  <Send size={14} /> Mời ứng tuyển vào Job
                </button>

                {/* 2. Direct Chat Button */}
                <button 
                  type="button" 
                  className={styles.btnChat}
                  disabled={chatLoadingId === candidate.id}
                  onClick={() => handleDirectChat(candidate)}
                >
                  {chatLoadingId === candidate.id ? (
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <MessageSquare size={14} />
                  )}
                  Trò chuyện ngay
                </button>

                {/* 3. View CV Button */}
                <button 
                  type="button" 
                  className={styles.btnViewCv}
                  onClick={() => handleOpenDetailModal(candidate)}
                >
                  <Eye size={14} /> Xem hồ sơ & CV
                </button>
              </div>
            </div>
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <Send size={18} color="#10b981" />
                <h3>Mời ứng viên ứng tuyển vào vị trí</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setInviteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Candidate Info Mini Box */}
              <div className={styles.candidateSummaryBox}>
                <div className={styles.avatarMini}>
                  {targetCandidate.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{targetCandidate.fullName}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {targetCandidate.currentPosition || 'Chuyên viên IT'} • {targetCandidate.location || 'Việt Nam'}
                  </span>
                </div>
              </div>

              {/* Job Selector */}
              <div className={styles.formGroup}>
                <label>Chọn vị trí tuyển dụng của công ty bạn (*)</label>
                {loadingJobs ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#64748b' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải danh sách công việc...
                  </div>
                ) : companyJobs.length === 0 ? (
                  <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8, color: '#b45309', fontSize: '13px' }}>
                    Công ty bạn hiện chưa có tin tuyển dụng nào đang đăng. Vui lòng đăng tin tuyển dụng trước khi mời ứng viên.
                  </div>
                ) : (
                  <select 
                    value={selectedJobId} 
                    onChange={(e) => setSelectedJobId(Number(e.target.value))}
                    style={{ width: '100%', height: 42, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                  >
                    {companyJobs.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.salaryFrom && j.salaryTo ? `${j.salaryFrom.toLocaleString()} - ${j.salaryTo.toLocaleString()} VND` : 'Thỏa thuận'}) - {j.city || 'Toàn quốc'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Custom Invitation Message */}
              <div className={styles.formGroup}>
                <label>Lời nhắn trân trọng gửi đến ứng viên (Tự động gửi kèm Email & Thông báo)</label>
                <textarea 
                  rows={4}
                  value={customInviteMsg}
                  onChange={(e) => setCustomInviteMsg(e.target.value)}
                  placeholder="Nhập lời mời trân trọng của nhà tuyển dụng..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                💡 <strong>Hệ thống tự động:</strong> Khi gửi lời mời, ứng viên sẽ nhận được thông báo đẩy thời gian thực (SignalR), email thư mời trang trọng kèm link trực tiếp vào tin tuyển dụng và một phòng hội thoại chat được kích hoạt sẵn để kết nối trao đổi.
              </div>
            </div>

            <div className={styles.modalFooter}>
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
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                {sendingInvite ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang gửi lời mời...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Gửi lời mời ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW CANDIDATE DETAIL & CV */}
      {detailModalOpen && selectedCandidateDetail && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '720px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <FileText size={18} color="#4f46e5" />
                <h3>Hồ sơ năng lực ứng viên: {selectedCandidateDetail.fullName}</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setDetailModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Header profile info */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className={styles.avatarMini} style={{ width: 64, height: 64, fontSize: 24 }}>
                  {selectedCandidateDetail.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{selectedCandidateDetail.fullName}</h3>
                  <div style={{ display: 'flex', gap: 12, fontSize: '13px', color: '#64748b' }}>
                    {selectedCandidateDetail.location && <span>📍 {selectedCandidateDetail.location}</span>}
                    {selectedCandidateDetail.email && <span>📧 {selectedCandidateDetail.email}</span>}
                    {selectedCandidateDetail.phoneNumber && <span>📞 {selectedCandidateDetail.phoneNumber}</span>}
                  </div>
                </div>
              </div>

              {/* Objective */}
              {selectedCandidateDetail.objective && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Mục tiêu nghề nghiệp & Giới thiệu
                  </label>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    {selectedCandidateDetail.objective}
                  </p>
                </div>
              )}

              {/* Experience Summary */}
              {selectedCandidateDetail.experienceSummary && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Tóm tắt kinh nghiệm làm việc
                  </label>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    {selectedCandidateDetail.experienceSummary}
                  </p>
                </div>
              )}

              {/* Skills */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Kỹ năng chuyên môn
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedCandidateDetail.skills && selectedCandidateDetail.skills.map((s, idx) => (
                    <span key={idx} style={{ fontSize: '12px', padding: '4px 10px', background: '#eef2ff', color: '#4338ca', borderRadius: 6, fontWeight: 600 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* CV File Preview / Download */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8 }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Tệp đính kèm CV chính thức
                </label>
                {selectedCandidateDetail.defaultCvUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={20} color="#4f46e5" />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                          {selectedCandidateDetail.defaultCvTitle || 'CV_Chinh_Thuc.pdf'}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Định dạng PDF / Đã xác thực</span>
                      </div>
                    </div>
                    <a 
                      href={selectedCandidateDetail.defaultCvUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className={styles.btnPrimary}
                      style={{ padding: '6px 14px', fontSize: '12.5px', height: 36 }}
                    >
                      <ExternalLink size={14} /> Mở xem CV
                    </a>
                  </div>
                ) : (
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                    Ứng viên chưa đính kèm file CV PDF tải lên, thông tin hồ sơ được trích xuất từ CV Builder trực tuyến.
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
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
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <Send size={14} /> Mời ứng tuyển ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
