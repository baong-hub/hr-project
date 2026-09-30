import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Globe,
  CheckCircle2,
  ExternalLink,
  Heart,
  Briefcase,
} from 'lucide-react';
import { companiesService } from '../../../core/services/companies.service';
import { jobsService } from '../../../core/services/jobs.service';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';
import type { CompanyDto } from '../../../core/models/company.model';
import type { JobDto } from '../../../core/models/job.model';
import { JobCard } from '../../../shared/components/cards/JobCard';
import { SeoHead } from '../../../shared/components/SeoHead';
import styles from './CompanyDetailPage.module.scss';

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyId = Number(id);

  const [company, setCompany] = useState<CompanyDto | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs'>('overview');

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    if (!companyId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const companyRes = await companiesService.getCompanyById(companyId);
        if (companyRes.data?.success && companyRes.data.data) {
          const compData = companyRes.data.data;
          setCompany(compData);
          setIsFollowing(Boolean(compData.isFollowing));
          setFollowersCount(compData.followersCount || 0);

          // Fetch jobs for this company
          try {
            const jobsRes = await jobsService.getJobs({ page: 1, pageSize: 50 });
            if (jobsRes.data?.success && jobsRes.data.data?.items) {
              const matchedJobs = jobsRes.data.data.items.filter(
                (j: JobDto) =>
                  j.companyId === companyId ||
                  (j.companyName || '').toLowerCase() === (compData.name || '').toLowerCase()
              );
              setJobs(matchedJobs);
            }
          } catch (jobErr) {
            console.error('Failed to load company jobs', jobErr);
          }
        } else {
          setError(companyRes.data?.error?.message || 'Không tìm thấy thông tin doanh nghiệp.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Lỗi kết nối khi tải hồ sơ doanh nghiệp.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [companyId]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để theo dõi doanh nghiệp.');
      navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowersCount((prev) => (wasFollowing ? Math.max(0, prev - 1) : prev + 1));

    try {
      const res = await companiesService.followCompany(companyId);
      if (res.data?.success && res.data.data) {
        setIsFollowing(res.data.data.isFollowing);
        setFollowersCount(res.data.data.followersCount);
        toast.success(
          res.data.data.isFollowing
            ? 'Đã theo dõi doanh nghiệp thành công!'
            : 'Đã hủy theo dõi doanh nghiệp.'
        );
      }
    } catch {
      setIsFollowing(wasFollowing);
      setFollowersCount((prev) => (wasFollowing ? prev + 1 : Math.max(0, prev - 1)));
      toast.error('Lỗi khi cập nhật trạng thái theo dõi.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.companyDetailPage}>
        <div className={styles.loadingState}>
          Đang tải thông tin doanh nghiệp...
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className={styles.companyDetailPage}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>
            {error || 'Doanh nghiệp không tồn tại.'}
          </p>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/companies')}
          >
            ← Quay lại danh sách doanh nghiệp
          </button>
        </div>
      </div>
    );
  }

  const initial = company.name ? company.name.trim().charAt(0).toUpperCase() : 'C';

  // Organization Schema.org JSON-LD
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: company.description,
    logo: company.logoUrl || (typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined),
    url: company.website,
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.address || '',
      addressCountry: 'VN',
    },
  };

  return (
    <div className={styles.companyDetailPage}>
      <SeoHead
        title={`${company.name} — Thông tin doanh nghiệp & Tuyển dụng | HR Portal`}
        description={
          company.description
            ? company.description.slice(0, 160)
            : `Khám phá môi trường làm việc, thông tin pháp nhân và các vị trí tuyển dụng tại ${company.name}.`
        }
        ogType="profile"
        ogImage={company.logoUrl || '/logo.png'}
        jsonLd={orgJsonLd}
      />

      {/* Back button */}
      <button
        type="button"
        className={styles.backBtn}
        onClick={() => navigate('/companies')}
      >
        <ArrowLeft size={16} />
        <span>Quay lại danh sách doanh nghiệp</span>
      </button>

      {/* Profile Header */}
      <section className={styles.headerProfileCard} aria-label="Thông tin công ty">
        <div className={styles.profileLeft}>
          <div className={styles.companyLogo}>
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} />
            ) : (
              <span className={styles.logoInitial}>{initial}</span>
            )}
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1>{company.name}</h1>
              {(company.isVerified || company.verificationStatus === 'VERIFIED') && (
                <CheckCircle2
                  size={18}
                  className={styles.verifiedBadge}
                  aria-label="Doanh nghiệp đã xác thực"
                />
              )}
            </div>

            <div className={styles.metaRow}>
              {company.industry && (
                <span className={styles.metaItem}>
                  <Building2 size={13} /> {company.industry}
                </span>
              )}
              {company.sizeRange && (
                <span className={styles.metaItem}>
                  <Users size={13} /> {company.sizeRange}
                </span>
              )}
              {company.website && (
                <span className={styles.metaItem}>
                  <Globe size={13} />
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Trang web chính thức
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.profileActions}>
          <button
            type="button"
            className={`${styles.followBtn} ${isFollowing ? styles.following : ''}`}
            onClick={handleFollowToggle}
            disabled={followLoading}
          >
            <Heart size={14} fill={isFollowing ? 'currentColor' : 'none'} />
            <span>{isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
            {followersCount > 0 && <span>({followersCount})</span>}
          </button>

          <Link to={`/companies/${company.id}/careers`} className={styles.careersBtn}>
            <span>Cổng tuyển dụng (Careers)</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </section>

      {/* Tabs */}
      <div className={styles.tabsContainer} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan doanh nghiệp
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'jobs'}
          className={`${styles.tabBtn} ${activeTab === 'jobs' ? styles.active : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Việc làm đang tuyển
          <span className={styles.tabCount}>{jobs.length}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' ? (
        <section className={styles.overviewGrid} aria-label="Tổng quan doanh nghiệp">
          {/* Main Description */}
          <div className={styles.mainProseCard}>
            <h2>Giới thiệu về doanh nghiệp</h2>
            <div className={styles.proseBody}>
              {company.description ||
                'Thông tin giới thiệu chi tiết về doanh nghiệp đang được cập nhật.'}
            </div>
          </div>

          {/* Sidebar Info */}
          <aside className={styles.sideDetailCard} aria-label="Thông tin liên hệ">
            <h3>Thông tin doanh nghiệp</h3>
            <div className={styles.infoList}>
              {company.industry && (
                <div className={styles.infoItem}>
                  <Building2 size={16} className={styles.infoIcon} />
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Lĩnh vực hoạt động</span>
                    <span className={styles.infoValue}>{company.industry}</span>
                  </div>
                </div>
              )}

              {company.sizeRange && (
                <div className={styles.infoItem}>
                  <Users size={16} className={styles.infoIcon} />
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Quy mô nhân sự</span>
                    <span className={styles.infoValue}>{company.sizeRange}</span>
                  </div>
                </div>
              )}

              {company.address && (
                <div className={styles.infoItem}>
                  <MapPin size={16} className={styles.infoIcon} />
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Địa chỉ trụ sở</span>
                    <span className={styles.infoValue}>{company.address}</span>
                  </div>
                </div>
              )}

              <div className={styles.infoItem}>
                <Briefcase size={16} className={styles.infoIcon} />
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Cơ hội tuyển dụng</span>
                  <span className={styles.infoValue}>
                    {jobs.length > 0 ? `${jobs.length} vị trí đang mở` : 'Hiện chưa có tin tuyển'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      ) : (
        <section aria-label="Danh sách việc làm của doanh nghiệp">
          {jobs.length === 0 ? (
            <div className={styles.emptyJobs}>
              <Briefcase size={36} />
              <h3>Doanh nghiệp hiện chưa có việc làm đang mở</h3>
              <p>Hãy bấm "Theo dõi" để nhận thông báo sớm nhất khi có vị trí tuyển dụng mới.</p>
            </div>
          ) : (
            <div className={styles.jobsGrid}>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CompanyDetailPage;
