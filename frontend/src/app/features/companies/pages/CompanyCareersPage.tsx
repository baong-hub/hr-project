import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { companiesService } from '../../../core/services/companies.service';
import { jobsService } from '../../../core/services/jobs.service';
import { authService } from '../../../core/services/auth.service';
import type { CompanyDto, CultureHighlight, CompanyFaq, CompanyTestimonial } from '../../../core/models/company.model';
import type { JobDto } from '../../../core/models/job.model';
import { toast } from '../../../core/services/toast.service';
import { matchCity, CITY_OPTIONS } from '../../../core/utils/city.utils';
import styles from './CompanyCareersPage.module.scss';
import {
  Building2,
  MapPin,
  Users,
  Globe,
  Calendar,
  Heart,
  Briefcase,
  Search,
  CheckCircle2,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Plane,
  Laptop,
  Coins,
  Clock,
  GraduationCap,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Play
} from 'lucide-react';

const DEFAULT_GALLERY = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'
];

const DEFAULT_CULTURE_HIGHLIGHTS: CultureHighlight[] = [
  {
    title: 'Đổi mới sáng tạo & Tự chủ cao',
    description: 'Khuyến khích mọi thành viên chủ động đề xuất giải pháp, thử nghiệm công nghệ mới và kiến tạo giá trị đột phá.',
    icon: 'Sparkles'
  },
  {
    title: 'Lấy con người làm trọng tâm',
    description: 'Tôn trọng sự đa dạng, lắng nghe phản hồi 360 độ và tạo điều kiện tối đa để mỗi cá nhân phát huy năng lực.',
    icon: 'Users'
  },
  {
    title: 'Work-Life Balance & Sức khỏe toàn diện',
    description: 'Chính sách làm việc Hybrid linh hoạt, chế độ nghỉ phép dài ngày và chăm sóc sức khỏe thể chất lẫn tinh thần.',
    icon: 'Heart'
  },
  {
    title: 'Lộ trình thăng tiến minh bạch',
    description: 'Đánh giá năng lực theo OKR/KPI rõ ràng, ngân sách đào tạo dồi dào cùng cơ hội phát triển lên các vai trò lãnh đạo.',
    icon: 'GraduationCap'
  }
];

const DEFAULT_FAQS: CompanyFaq[] = [
  {
    question: 'Quy trình tuyển dụng tại công ty diễn ra như thế nào và trong bao lâu?',
    answer: 'Quy trình tuyển dụng chuẩn gồm 3 bước: (1) Sàng lọc CV & Đánh giá năng lực online, (2) Phỏng vấn chuyên môn với Trưởng bộ phận, (3) Trao đổi văn hóa & Nhận Offer chính thức. Toàn bộ quy trình diễn ra nhanh chóng trong vòng 5 - 10 ngày làm việc.'
  },
  {
    question: 'Chế độ thử việc và đãi ngộ có tương đương nhân viên chính thức không?',
    answer: 'Tại công ty, ứng viên thử việc được hưởng từ 85% đến 100% lương chính thức tùy vị trí, kèm theo toàn bộ phụ cấp và quyền tham gia các chương trình teambuilding, đào tạo nội bộ ngay từ ngày đầu tiên.'
  },
  {
    question: 'Công ty có hỗ trợ chế độ làm việc từ xa (Remote / Hybrid) không?',
    answer: 'Có, chúng tôi áp dụng mô hình Hybrid linh hoạt (cho phép 2 - 3 ngày làm việc từ xa mỗi tuần) đối với khối công nghệ và kỹ thuật. Nhân sự ở xa hoặc có hoàn cảnh đặc biệt có thể đăng ký 100% Remote sau giai đoạn hòa nhập.'
  },
  {
    question: 'Công ty có chính sách hỗ trợ học tập và thi chứng chỉ quốc tế không?',
    answer: 'Mỗi nhân viên có ngân sách học tập riêng từ 15 - 25 triệu VNĐ/năm để mua khóa học (Udemy, Coursera) và tài trợ 100% lệ phí thi các chứng chỉ quốc tế uy tín (AWS, GCP, Azure, Scrum, PMP).'
  },
  {
    question: 'Môi trường làm việc và văn hóa giao tiếp trong team ra sao?',
    answer: 'Môi trường làm việc cởi mở, bình đẳng không khoảng cách cấp bậc. Chúng tôi đề cao tinh thần hỗ trợ đồng đội, trao đổi thẳng thắn và cùng nhau vượt qua các thử thách công nghệ lớn.'
  }
];

const DEFAULT_TESTIMONIALS: CompanyTestimonial[] = [
  {
    authorName: 'Nguyễn Tuấn Anh',
    authorRole: 'Tech Lead / Senior Architect',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    content: 'Gia nhập công ty được hơn 3 năm, điều tôi tâm đắc nhất là được tự do lựa chọn công nghệ và kiến trúc hệ thống hiện đại. Văn hóa tôn trọng kỹ sư và không ngại thử sai giúp đội ngũ phát triển rất nhanh.',
    rating: 5
  },
  {
    authorName: 'Trần Thu Trang',
    authorRole: 'Product Designer (UI/UX)',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    content: 'Môi trường làm việc tại đây cực kỳ năng động và tích cực. Pantry luôn đầy ắp đồ ăn nhẹ, thiết bị làm việc chuẩn xịn và đặc biệt là chế độ chăm sóc sức khỏe cho cả gia đình rất chu đáo.',
    rating: 5
  },
  {
    authorName: 'Lê Hoàng Nam',
    authorRole: 'Senior Fullstack Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    content: 'Chính sách remote linh hoạt và cơ chế thưởng dự án rõ ràng là lý do tôi gắn bó lâu dài. Đội ngũ lãnh đạo luôn lắng nghe tâm tư và tạo mọi điều kiện để anh em cân bằng giữa công việc và gia đình.',
    rating: 5
  }
];

export const CompanyCareersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyId = Number(id);

  const [company, setCompany] = useState<CompanyDto | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Follow State
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  // Job Search Filter States
  const [jobSearch, setJobSearch] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  // FAQs Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    if (!companyId) return;

    const fetchCareersData = async () => {
      setLoading(true);
      setError(null);
      try {
        const compRes = await companiesService.getCompanyById(companyId);
        if (compRes.data.success && compRes.data.data) {
          const cData = compRes.data.data;
          setCompany(cData);
          setIsFollowing(!!cData.isFollowing);
          setFollowersCount(cData.followersCount || 0);

          // Fetch Jobs
          try {
            const jobsRes = await jobsService.getJobs({ page: 1, pageSize: 100 });
            if (jobsRes.data.success && jobsRes.data.data) {
              const allItems = jobsRes.data.data.items || [];
              const matchedJobs = allItems.filter(
                j => (j.companyName || '').toLowerCase() === (cData.name || '').toLowerCase()
              );
              setJobs(matchedJobs);
              setFilteredJobs(matchedJobs);
            }
          } catch (jobErr) {
            console.error(jobErr);
          }
        } else {
          setError(compRes.data.error?.message || 'Không tìm thấy thông tin doanh nghiệp.');
        }
      } catch (err: any) {
        setError('Có lỗi xảy ra khi kết nối máy chủ trang tuyển dụng.');
      } finally {
        setLoading(false);
      }
    };

    fetchCareersData();
  }, [companyId]);

  // Filter Jobs when search or city changes
  useEffect(() => {
    let result = [...jobs];
    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        (j.department && j.department.toLowerCase().includes(q))
      );
    }
    if (selectedCity) {
      result = result.filter(j => matchCity(j.city || '', selectedCity));
    }
    setFilteredJobs(result);
  }, [jobSearch, selectedCity, jobs]);

  // Handle Follow Toggle
  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để theo dõi doanh nghiệp.');
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      const res = await companiesService.followCompany(companyId);
      if (res.data.success && res.data.data) {
        setIsFollowing(res.data.data.isFollowing);
        setFollowersCount(res.data.data.followersCount);
        toast.success(
          res.data.data.isFollowing
            ? 'Đã theo dõi doanh nghiệp thành công!'
            : 'Đã hủy theo dõi doanh nghiệp.'
        );
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật theo dõi.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 16 }}>
        <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', width: 40, height: 40 }} />
        <span style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Đang tải Cổng tuyển dụng & Thương hiệu doanh nghiệp...</span>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', padding: 32, textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <Building2 size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>Không tìm thấy trang tuyển dụng</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>{error || 'Doanh nghiệp này không tồn tại hoặc chưa kích hoạt trang thương hiệu.'}</p>
        <Link to="/companies" style={{ display: 'inline-flex', padding: '10px 20px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
          Xem danh sách doanh nghiệp khác
        </Link>
      </div>
    );
  }

  // Parse custom highlights, faqs, testimonials or use default
  let galleryList: string[] = DEFAULT_GALLERY;
  if (company.officeGallery) {
    try {
      const parsed = JSON.parse(company.officeGallery);
      if (Array.isArray(parsed) && parsed.length > 0) galleryList = parsed;
    } catch { }
  }

  let cultureHighlights: CultureHighlight[] = DEFAULT_CULTURE_HIGHLIGHTS;
  if (company.cultureHighlights) {
    try {
      const parsed = JSON.parse(company.cultureHighlights);
      if (Array.isArray(parsed) && parsed.length > 0) cultureHighlights = parsed;
    } catch { }
  }

  let faqsList: CompanyFaq[] = DEFAULT_FAQS;
  if (company.companyFaqs) {
    try {
      const parsed = JSON.parse(company.companyFaqs);
      if (Array.isArray(parsed) && parsed.length > 0) faqsList = parsed;
    } catch { }
  }

  let testimonialsList: CompanyTestimonial[] = DEFAULT_TESTIMONIALS;
  if (company.testimonials) {
    try {
      const parsed = JSON.parse(company.testimonials);
      if (Array.isArray(parsed) && parsed.length > 0) testimonialsList = parsed;
    } catch { }
  }

  // Check if videoUrl is YouTube and format to embed
  const getEmbedVideoUrl = (url?: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'www.youtube.com/embed/');
    }
    return url;
  };

  const embedUrl = getEmbedVideoUrl(company.videoUrl);

  return (
    <div className={styles.careersPortal}>
      {/* Back Button */}
      <div style={{ marginBottom: '12px', paddingTop: '4px' }}>
        <button
          onClick={() => navigate('/companies')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--color-bg-default, #fff)',
            border: '1px solid var(--color-border-default, #e2e8f0)',
            borderRadius: 'var(--radius-md, 8px)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-text-secondary, #64748b)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-subtle, #f8fafc)'; e.currentTarget.style.color = 'var(--color-text-primary, #1e293b)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg-default, #fff)'; e.currentTarget.style.color = 'var(--color-text-secondary, #64748b)'; }}
        >
          <ArrowLeft size={16} /> Quay lại danh sách doanh nghiệp
        </button>
      </div>

      {/* 1. HERO BRANDING SECTION */}
      <section className={styles.heroBanner}>
        <div className={styles.coverWrapper}>
          {company.bannerUrl && <img src={company.bannerUrl} alt={company.name} />}
          <div className={styles.coverOverlay} />
        </div>

        <div className={styles.brandingBar}>
          <div className={styles.logoCol}>
            <div className={styles.logoBox}>
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} />
              ) : (
                company.name.charAt(0)
              )}
            </div>
            <div className={styles.companyTitle}>
              <div className={styles.nameRow}>
                <h1>{company.name}</h1>
                <span className={styles.verifiedBadge}>
                  <CheckCircle2 size={12} /> DOANH NGHIỆP XÁC THỰC
                </span>
              </div>
              <p className={styles.tagline}>
                {company.industry} • {company.sizeRange} nhân sự • Gia nhập đội ngũ kiến tạo tương lai
              </p>
            </div>
          </div>

          <div className={styles.ctaActions}>
            <button 
              type="button" 
              className={`${styles.btnFollow} ${isFollowing ? styles.following : ''}`}
              disabled={followLoading}
              onClick={handleFollowToggle}
            >
              <Heart size={16} fill={isFollowing ? '#4f46e5' : 'none'} color={isFollowing ? '#4f46e5' : '#64748b'} />
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'} ({followersCount})
            </button>

            <a href="#active-jobs" className={styles.btnViewJobs}>
              <Briefcase size={16} /> Xem {jobs.length} việc làm đang tuyển
            </a>
          </div>
        </div>

        {/* METADATA PILLS BAR */}
        <div className={styles.metaPillsBar}>
          <div className={styles.metaPill}>
            <Building2 />
            <span>Ngành nghề: <strong>{company.industry}</strong></span>
          </div>
          <div className={styles.metaPill}>
            <Users />
            <span>Quy mô: <strong>{company.sizeRange} nhân sự</strong></span>
          </div>
          {company.foundedYear && (
            <div className={styles.metaPill}>
              <Calendar />
              <span>Thành lập: <strong>Năm {company.foundedYear}</strong></span>
            </div>
          )}
          <div className={styles.metaPill}>
            <MapPin />
            <span>Trụ sở: <strong>{company.address}</strong></span>
          </div>
          {company.website && (
            <div className={styles.metaPill}>
              <Globe />
              <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer">
                Website công ty <ExternalLink size={12} style={{ display: 'inline' }} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 2. CULTURE & VIDEO SHOWCASE */}
      <section>
        <div className={styles.sectionHeader}>
          <span className={styles.subBadge}><Sparkles size={12} /> Văn hóa & Con người</span>
          <h2>Môi Trường Làm Việc Đột Phá</h2>
          <p>
            Tại {company.name}, chúng tôi tin rằng thành công vượt bậc bắt đầu từ việc trao quyền, nuôi dưỡng tài năng và tạo ra một không gian nơi mỗi cá nhân đều có thể tỏa sáng.
          </p>
        </div>

        <div className={styles.showcaseGrid}>
          {/* Video Showcase Player */}
          <div className={styles.videoCard}>
            {embedUrl ? (
              <iframe 
                src={embedUrl} 
                title="Company Culture Video" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen 
              />
            ) : (
              <div className={styles.videoPlaceholder}>
                <div className={styles.playBtn} onClick={() => alert('Video giới thiệu văn hóa đang được chuẩn bị.')}>
                  <Play size={24} fill="#fff" color="#fff" />
                </div>
                <span>Khám phá hành trình văn hóa tại {company.name}</span>
              </div>
            )}
          </div>

          {/* Culture highlights & values */}
          <div className={styles.cultureTextCol}>
            <p className={styles.cultureIntro}>
              {company.description || 
                `${company.name} tự hào xây dựng một văn hóa doanh nghiệp cởi mở, minh bạch và gắn kết. Chúng tôi tôn trọng sự khác biệt, đề cao tinh thần đổi mới và không ngừng nỗ lực để mang lại trải nghiệm làm việc tốt nhất cho toàn thể cán bộ nhân viên.`
              }
            </p>

            <div className={styles.valuesList}>
              {cultureHighlights.map((h, i) => (
                <div key={i} className={styles.valueItem}>
                  <div className={styles.valueIcon}>
                    <Sparkles size={20} />
                  </div>
                  <div className={styles.valueInfo}>
                    <h4>{h.title}</h4>
                    <p>{h.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. OFFICE & WORKING ENVIRONMENT GALLERY */}
      <section>
        <div className={styles.sectionHeader}>
          <span className={styles.subBadge}><Building2 size={12} /> Không gian làm việc</span>
          <h2>Góc Nhìn Thực Tế Tại Văn Phòng</h2>
          <p>Không gian làm việc mở chuẩn quốc tế, trang thiết bị tối tân và khu pantry thư giãn đầy năng lượng.</p>
        </div>

        <div className={styles.galleryGrid}>
          {galleryList.slice(0, 6).map((imgUrl, idx) => (
            <div key={idx} className={styles.galleryItem}>
              <img src={imgUrl} alt={`Office photo ${idx + 1}`} />
              <div className={styles.galleryOverlay}>
                <span>Không gian làm việc sáng tạo #{idx + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PERKS & BENEFITS */}
      <section>
        <div className={styles.sectionHeader}>
          <span className={styles.subBadge}><ShieldCheck size={12} /> Chế độ & Đãi ngộ</span>
          <h2>Lợi Ích Đặc Quyền Cho Nhân Sự</h2>
          <p>Chúng tôi cam kết mang lại chính sách đãi ngộ xứng đáng, đồng hành cùng sự an tâm và phát triển dài hạn của bạn.</p>
        </div>

        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <div className={styles.bIcon}><ShieldCheck /></div>
            <div className={styles.bContent}>
              <h3>Bảo Hiểm Sức Khỏe Toàn Diện</h3>
              <p>Gói bảo hiểm sức khỏe cao cấp (PVI/Bảo Việt) chi trả nội & ngoại trú cho nhân viên và gói ưu đãi đặc quyền cho người thân.</p>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.bIcon}><Plane /></div>
            <div className={styles.bContent}>
              <h3>Du Lịch & Team Building Hàng Năm</h3>
              <p>Chuyến du lịch nghỉ dưỡng chuẩn 5 sao hàng năm, các sự kiện dã ngoại, sinh nhật và hoạt động gắn kết sôi nổi mỗi quý.</p>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.bIcon}><Laptop /></div>
            <div className={styles.bContent}>
              <h3>Thiết Bị Công Nghệ Tối Tân</h3>
              <p>Trang bị MacBook Pro M-series thế hệ mới nhất, 2 màn hình 4K Dell UltraSharp cùng ghế công thái học cao cấp.</p>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.bIcon}><Coins /></div>
            <div className={styles.bContent}>
              <h3>Chính Sách Thưởng & ESOP</h3>
              <p>Thưởng lương tháng 13 đảm bảo, thưởng nóng hiệu suất (Performance Bonus) định kỳ và cơ hội sở hữu cổ phần ưu đãi ESOP.</p>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.bIcon}><Clock /></div>
            <div className={styles.bContent}>
              <h3>Thời Gian Linh Hoạt & Hybrid</h3>
              <p>Chế độ làm việc Hybrid (làm việc từ xa 2-3 ngày/tuần), giờ giấc làm việc linh hoạt, 14 - 16 ngày nghỉ phép hưởng nguyên lương.</p>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.bIcon}><GraduationCap /></div>
            <div className={styles.bContent}>
              <h3>Ngân Sách Học Tập & Chứng Chỉ</h3>
              <p>Hỗ trợ $1,000 ngân sách đào tạo mỗi năm, tài trợ 100% lệ phí thi các chứng chỉ công nghệ quốc tế danh giá.</p>
            </div>
          </div>
        </div>

        {/* Custom Benefits text if provided */}
        {company.benefits && (
          <div style={{ marginTop: 24, padding: 20, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: 6 }}>Phúc lợi bổ sung từ công ty:</strong>
            {company.benefits}
          </div>
        )}
      </section>

      {/* 5. ACTIVE JOB OPENINGS */}
      <section id="active-jobs" className={styles.jobsSection}>
        <div className={styles.sectionHeader} style={{ marginBottom: 24 }}>
          <span className={styles.subBadge}><Briefcase size={12} /> Tuyển dụng trực tiếp</span>
          <h2>Cơ Hội Nghề Nghiệp Đang Mở</h2>
          <p>Khám phá các vị trí công việc phù hợp với kỹ năng và định hướng phát triển của bạn.</p>
        </div>

        {/* Filter bar */}
        <div className={styles.jobFiltersBar}>
          <div className={styles.filterInput}>
            <Search />
            <input 
              type="text" 
              placeholder="Tìm theo tên vị trí hoặc từ khóa..." 
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterInput}>
            <MapPin />
            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
              {CITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px', color: '#64748b', fontWeight: 600 }}>
            Hiển thị <strong>&nbsp;{filteredJobs.length}&nbsp;</strong> vị trí phù hợp
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
            <Briefcase size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
            <p style={{ margin: 0 }}>Hiện chưa có vị trí nào khớp với bộ lọc tìm kiếm của bạn.</p>
          </div>
        ) : (
          <div className={styles.jobCardsList}>
            {filteredJobs.map(job => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobMainInfo}>
                  <h3>{job.title}</h3>
                  <div className={styles.jobBadges}>
                    {job.department && (
                      <span className={styles.jBadge}>
                        <Building2 size={13} /> {job.department}
                      </span>
                    )}
                    <span className={styles.jBadge}>
                      <MapPin size={13} /> {job.city || 'Toàn quốc'}
                    </span>
                    <span className={`${styles.jBadge} ${styles.salary}`}>
                      💰 {job.salaryFrom && job.salaryTo 
                        ? `${job.salaryFrom.toLocaleString()} - ${job.salaryTo.toLocaleString()} VND`
                        : 'Mức lương thỏa thuận'}
                    </span>
                    {job.expiredAt && (
                      <span className={styles.jBadge}>
                        📅 Hạn nộp: {job.expiredAt.split('T')[0]}
                      </span>
                    )}
                  </div>
                </div>

                <Link to={`/jobs/${job.id}`} className={styles.btnApply}>
                  Ứng tuyển ngay <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. EMPLOYEE TESTIMONIALS & REVIEWS */}
      <section>
        <div className={styles.sectionHeader}>
          <span className={styles.subBadge}><Star size={12} /> Đánh giá nội bộ</span>
          <h2>Đội Ngũ Nói Gì Về Chúng Tôi?</h2>
          <p>Lắng nghe những trải nghiệm thực tế từ các kỹ sư và chuyên viên đang cống hiến tại {company.name}.</p>
        </div>

        <div className={styles.testimonialsGrid}>
          {testimonialsList.map((item, idx) => (
            <div key={idx} className={styles.testimonialCard}>
              <div className={styles.starsRow}>
                {[...Array(item.rating || 5)].map((_, sIdx) => (
                  <Star key={sIdx} size={15} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>

              <p className={styles.testContent}>"{item.content}"</p>

              <div className={styles.authorRow}>
                <div className={styles.authorAvatar}>
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt={item.authorName} />
                  ) : (
                    item.authorName.charAt(0)
                  )}
                </div>
                <div className={styles.authorDetails}>
                  <h4>{item.authorName}</h4>
                  <span>{item.authorRole}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. COMPANY FAQS & Q&A ACCORDION */}
      <section>
        <div className={styles.sectionHeader}>
          <span className={styles.subBadge}><Sparkles size={12} /> Hỏi & Đáp</span>
          <h2>Câu Hỏi Thường Gặp Về Văn Hóa & Tuyển Dụng</h2>
          <p>Giải đáp nhanh những thắc mắc của ứng viên về quy trình phỏng vấn và cuộc sống tại {company.name}.</p>
        </div>

        <div className={styles.faqsContainer}>
          {faqsList.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}>
                <div 
                  className={styles.faqQuestion} 
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                >
                  <span>{faq.question}</span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {isOpen && (
                  <div className={styles.faqAnswer}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
