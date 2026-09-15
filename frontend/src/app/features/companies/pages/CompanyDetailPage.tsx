import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { companiesService } from '../../../core/services/companies.service';
import { jobsService } from '../../../core/services/jobs.service';
import { authService } from '../../../core/services/auth.service';
import type { CompanyDto } from '../../../core/models/company.model';
import type { JobDto } from '../../../core/models/job.model';

export const CompanyDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyId = Number(id);

  const [company, setCompany] = useState<CompanyDto | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'jobs'>('about');

  // Follow State
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  const currentUser = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const companyResponse = await companiesService.getCompanyById(companyId);
      if (companyResponse.data.success && companyResponse.data.data) {
        const companyData = companyResponse.data.data;
        setCompany(companyData);
        setIsFollowing(!!companyData.isFollowing);
        setFollowersCount(companyData.followersCount);

        // Fetch jobs for this company
        try {
          const jobsResponse = await jobsService.getJobs({ page: 1, pageSize: 100 });
          if (jobsResponse.data.success && jobsResponse.data.data) {
            // Filter jobs belonging to this company
            const filteredJobs = jobsResponse.data.data.items.filter(
              (j) => (j.companyName || '').toLowerCase() === (companyData?.name || '').toLowerCase()
            );
            setJobs(filteredJobs);
          }
        } catch (jobErr) {
          console.error('Error fetching jobs for company:', jobErr);
        }
      } else {
        setError(companyResponse.data.error?.message || 'Không tìm thấy thông tin doanh nghiệp.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Có lỗi xảy ra khi tải thông tin doanh nghiệp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetails();
    }
  }, [companyId]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    try {
      setFollowLoading(true);
      const response = await companiesService.followCompany(companyId);
      if (response.data.success && response.data.data) {
        setIsFollowing(response.data.data.isFollowing);
        setFollowersCount(response.data.data.followersCount);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Không thể thực hiện thao tác theo dõi.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{
          border: '4px solid var(--color-border-default)',
          borderTop: '4px solid var(--color-brand-primary)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto var(--space-4)'
        }} />
        {t('companies.loading', 'Đang tải thông tin chi tiết doanh nghiệp...')}
      </div>
    );
  }

  if (error || !company) {
    return (
      <div style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          padding: 'var(--space-6)',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-danger)',
          marginBottom: 'var(--space-4)'
        }}>
          {error || t('companies.empty_title', 'Không tìm thấy dữ liệu doanh nghiệp.')}
        </div>
        <button onClick={() => navigate('/companies')} style={{
          padding: '10px 20px',
          backgroundColor: 'var(--color-brand-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          {t('companies.back_to_list', 'Quay lại danh sách')}
        </button>
      </div>
    );
  }

  // Authorization check for editing profile
  const isAdmin = currentUser?.role === 'ADMIN';
  const isCompanyOwnerOrHR = currentUser?.role === 'COMPANY_OWNER' || currentUser?.role === 'HR_MANAGER';
  const belongsToCompany = currentUser?.companyId === company.id;
  const canEdit = isAdmin || (isCompanyOwnerOrHR && belongsToCompany);

  return (
    <div style={{ width: '100%', padding: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', boxSizing: 'border-box', textAlign: 'left' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '12px' }}>
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
          <ArrowLeft size={16} /> {t('companies.back_to_list', 'Quay lại danh sách doanh nghiệp')}
        </button>
      </div>

      {/* Banner & Logo Cover Container */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-12)' }}>
        {/* Large Banner */}
        <div style={{
          height: '280px',
          backgroundColor: company.bannerUrl ? 'transparent' : 'var(--color-brand-primary-soft)',
          backgroundImage: company.bannerUrl ? `url(${company.bannerUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
          border: '1px solid var(--color-border-default)'
        }} />

        {/* Logo Overlay */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#fff',
          border: '4px solid #fff',
          boxShadow: 'var(--shadow-md)',
          position: 'absolute',
          bottom: '-50px',
          left: 'var(--space-6)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontWeight: 'bold', color: 'var(--color-brand-primary)', fontSize: '36px' }}>
              {company.name.charAt(0)}
            </span>
          )}
        </div>
      </div>

      {/* Title & Interaction Bar */}
      <div style={{
        padding: '0 var(--space-6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)'
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: '0 0 var(--space-2)' }}>{company.name}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', flexWrap: 'wrap' }}>
            <span>🏢 {t('companies.industry_prefix', { industry: company.industry, defaultValue: `Ngành: ${company.industry}` })}</span>
            <span>👥 {t('companies.size_prefix', { size: company.sizeRange, defaultValue: `Quy mô: ${company.sizeRange} nhân viên` })}</span>
            {company.foundedYear && <span>📅 {t('companies.founded_prefix', { year: company.foundedYear, defaultValue: `Thành lập: Năm ${company.foundedYear}` })}</span>}
            <span>👥 {t('companies.followers_count', { count: followersCount, defaultValue: `Lượt theo dõi: ${followersCount}` })}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {/* Edit Profile Button for owners */}
          {canEdit && (
            <button
              onClick={() => navigate('/employer/company/edit')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 'var(--font-weight-medium)',
                fontSize: 'var(--font-size-base)'
              }}
            >
              ⚙️ {t('companies.btn_edit_page', 'Chỉnh sửa trang')}
            </button>
          )}

          {/* Follow toggle button */}
          <button
            onClick={handleFollowToggle}
            disabled={followLoading}
            style={{
              padding: '10px 24px',
              backgroundColor: isFollowing ? 'var(--color-success-bg)' : 'var(--color-brand-secondary)',
              color: isFollowing ? 'var(--color-success)' : '#fff',
              border: isFollowing ? '1px solid var(--color-success)' : 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 'var(--font-weight-bold)',
              fontSize: 'var(--font-size-base)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'background-color var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              if (!isFollowing) e.currentTarget.style.backgroundColor = 'var(--color-brand-secondary-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isFollowing) e.currentTarget.style.backgroundColor = 'var(--color-brand-secondary)';
            }}
          >
            {followLoading ? t('common.loading', 'Đang xử lý...') : isFollowing ? t('companies.btn_following', '✓ Đang theo dõi') : t('companies.btn_follow', '+ Theo dõi công ty')}
          </button>

          <button
            onClick={() => navigate(`/companies/${companyId}/careers`)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              transition: 'transform 0.15s ease'
            }}
          >
            🌟 {t('companies.btn_explore_careers', 'Khám phá Cổng tuyển dụng & Thương hiệu')} ↗
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{
        borderBottom: '1px solid var(--color-border-default)',
        padding: '0 var(--space-6)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        gap: 'var(--space-6)'
      }}>
        <button
          onClick={() => setActiveTab('about')}
          style={{
            padding: '14px 0',
            border: 'none',
            borderBottom: activeTab === 'about' ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'about' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'about' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-md)'
          }}
        >
          {t('companies.tab_about', 'Giới thiệu công ty')}
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          style={{
            padding: '14px 0',
            border: 'none',
            borderBottom: activeTab === 'jobs' ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'jobs' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'jobs' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-md)'
          }}
        >
          {t('companies.tab_jobs', { count: jobs.length, defaultValue: `Tin tuyển dụng (${jobs.length})` })}
        </button>
      </div>

      {/* Tab Contents */}
      <div style={{ padding: '0 var(--space-6)' }}>
        {activeTab === 'about' ? (
          /* TAB ABOUT */
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            {/* Description */}
            <div style={{
              backgroundColor: 'var(--color-bg-card)',
              padding: 'var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-default)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-lg)', borderBottom: '1px solid var(--color-border-default)', paddingBottom: 'var(--space-2)' }}>
                {t('companies.about_detail', 'Chi tiết giới thiệu')}
              </h3>
              <div style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-base)',
                lineHeight: 'var(--line-height-loose)',
                whiteSpace: 'pre-line'
              }}>
                {company.description || t('companies.no_desc', 'Chưa có thông tin mô tả chi tiết từ doanh nghiệp.')}
              </div>

              {company.benefits && (
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-lg)', borderBottom: '1px solid var(--color-border-default)', paddingBottom: 'var(--space-2)' }}>
                    {t('companies.benefits_title', 'Chế độ đãi ngộ & Phúc lợi')}
                  </h3>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-loose)', whiteSpace: 'pre-line' }}>
                    {company.benefits}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar info: Branch and website */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Contact card */}
              <div style={{
                backgroundColor: 'var(--color-bg-card)',
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-default)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>
                  {t('companies.contact_info', 'Thông tin liên hệ')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {company.website && (
                    <div>
                      <strong>Website:</strong><br />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand-secondary)', textDecoration: 'none' }}>
                        {company.website}
                      </a>
                    </div>
                  )}
                  {company.contact && (
                    <div>
                      <strong>{t('common.note', 'Liên hệ')}:</strong><br />
                      {company.contact}
                    </div>
                  )}
                  {company.taxCode && (
                    <div>
                      <strong>Mã số thuế:</strong><br />
                      {company.taxCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Office Locations */}
              <div style={{
                backgroundColor: 'var(--color-bg-card)',
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-default)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>
                  📍 {t('companies.address_label', { address: '', defaultValue: 'Địa chỉ văn phòng' })}
                </h3>
                <div style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 'var(--line-height-normal)',
                  whiteSpace: 'pre-line'
                }}>
                  {company.address}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB JOBS */
          <div>
            {jobs.length === 0 ? (
              <div style={{
                padding: 'var(--space-12) 0',
                textAlign: 'center',
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-muted)'
              }}>
                {t('jobs.no_jobs_found', 'Hiện tại doanh nghiệp này chưa đăng tin tuyển dụng nào.')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {jobs.map((job) => (
                  <div key={job.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--color-bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border-default)',
                    boxShadow: 'var(--shadow-sm)',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)'
                  }}>
                    <div>
                      <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
                        {job.title}
                      </h3>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', flexWrap: 'wrap' }}>
                        <span>📍 {job.city}</span>
                        <span>💰 {t('jobs.job_benefits', 'Mức lương')}: {job.salaryFrom && job.salaryTo ? `${job.salaryFrom.toLocaleString()} - ${job.salaryTo.toLocaleString()} VND` : t('jobs.salary_negotiable', 'Thỏa thuận')}</span>
                        <span>⏳ {t('jobs.deadline', { date: new Date(job.expiredAt).toLocaleDateString(t('common.locale', 'vi-VN')), defaultValue: `Hạn nộp: ${new Date(job.expiredAt).toLocaleDateString(t('common.locale', 'vi-VN'))}` })}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      style={{
                        padding: '8px 20px',
                        backgroundColor: 'var(--color-brand-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontWeight: 'var(--font-weight-medium)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      {t('jobs.btn_apply_now', 'Ứng tuyển ngay')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
