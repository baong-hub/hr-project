import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Clock, 
  Eye, 
  User, 
  Briefcase, 
  ChevronRight, 
  Tag, 
  CheckCircle2, 
  Copy 
} from 'lucide-react';
import { articlesService } from '../../../core/services/articles.service';
import type { ArticleDetail } from '../../../core/services/articles.service';
import { jobsService } from '../../../core/services/jobs.service';
import type { JobDto } from '../../../core/models/job.model';
import { SeoHead } from '../../../shared/components/SeoHead';

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    articlesService.getArticleBySlug(slug)
      .then((data) => {
        setArticle(data);
        // Load related jobs based on category or first tag
        const keyword = data.tags && data.tags.length > 0 ? data.tags[0] : data.category;
        jobsService.getJobs({ keyword, pageSize: 4 })
          .then(res => setRelatedJobs(res.data?.data?.items || []))
          .catch(() => {});
      })
      .catch((err) => console.error('Failed to load article:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ minHeight: '60vh', textAlign: 'center', padding: '100px 24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
          Không tìm thấy bài viết
        </h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Bài viết bạn đang tìm kiếm có thể đã bị gỡ hoặc đường dẫn không chính xác.</p>
        <Link to="/blog" style={{
          padding: '10px 20px',
          background: '#2563eb',
          color: '#ffffff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600
        }}>
          Quay lại Cẩm nang
        </Link>
      </div>
    );
  }

  const pageUrl = `https://tuyendung.hamo.vn/blog/${article.slug}`;

  // Article JSON-LD Structured Data
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl
    },
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.summary,
    image: [article.thumbnailUrl || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=80'],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.authorName
    },
    publisher: {
      '@type': 'Organization',
      name: 'HR Portal',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tuyendung.hamo.vn/logo.png'
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '100px' }}>
      <SeoHead
        title={`${article.seoTitle || article.title} | HR Portal`}
        description={article.seoDescription || article.summary}
        canonicalUrl={pageUrl}
        ogImage={article.thumbnailUrl}
        ogType="article"
        keywords={article.seoKeywords || article.tags?.join(', ')}
        jsonLd={articleSchema}
      />

      {/* Breadcrumb Header */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/blog" style={{ color: '#64748b', textDecoration: 'none' }}>Cẩm nang</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#2563eb', fontWeight: 500 }}>{article.category}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '40px', alignItems: 'start' }}>
          
          {/* Main Article Content */}
          <article style={{ background: '#ffffff', borderRadius: '20px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-block',
                marginBottom: '16px'
              }}>
                {article.category}
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, margin: '0 0 20px 0' }}>
                {article.title}
              </h1>

              {/* Author & Meta */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                paddingBottom: '24px',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '13px',
                color: '#64748b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 600 }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{article.authorName}</div>
                      <div style={{ fontSize: '12px' }}>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> {article.readingTimeMinutes} phút đọc
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={14} /> {article.viewCount.toLocaleString()} lượt xem
                  </div>
                </div>

                {/* Share action */}
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: copied ? '#ecfdf5' : '#ffffff',
                    color: copied ? '#059669' : '#475569',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                  {copied ? 'Đã sao chép link' : 'Chia sẻ bài viết'}
                </button>
              </div>
            </div>

            {/* Featured Image */}
            {article.thumbnailUrl && (
              <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
                <img
                  src={article.thumbnailUrl}
                  alt={article.title}
                  style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Summary Box */}
            <div style={{
              background: '#f8fafc',
              borderLeft: '4px solid #2563eb',
              padding: '18px 24px',
              borderRadius: '0 12px 12px 0',
              marginBottom: '36px',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#334155',
              fontStyle: 'italic'
            }}>
              {article.summary}
            </div>

            {/* HTML Body Content */}
            <div 
              style={{
                fontSize: '16px',
                lineHeight: 1.8,
                color: '#1e293b'
              }}
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={15} /> Từ khoá liên quan:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {article.tags.map(t => (
                    <Link
                      key={t}
                      to={`/blog?q=${encodeURIComponent(t)}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: '12px',
                        textDecoration: 'none',
                        fontWeight: 500,
                        transition: 'background 0.2s'
                      }}
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Right Sidebar: Related Jobs & Internal Linking */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* CTA Box */}
            <div style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px 0' }}>
                Đang tìm việc làm phù hợp?
              </h3>
              <p style={{ fontSize: '13px', color: '#bfdbfe', lineHeight: 1.5, margin: '0 0 18px 0' }}>
                Khám phá hơn 1,000+ việc làm lương cao từ các doanh nghiệp đã xác thực trên HR Portal.
              </p>
              <Link
                to="/jobs"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#ffffff',
                  color: '#2563eb',
                  fontWeight: 600,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13px'
                }}
              >
                Khám phá việc làm ngay
              </Link>
            </div>

            {/* Related Jobs List */}
            {relatedJobs.length > 0 && (
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} style={{ color: '#2563eb' }} /> Việc làm liên quan
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {relatedJobs.map(job => (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: '12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        transition: 'all 0.2s',
                        display: 'block'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#93c5fd';
                        e.currentTarget.style.background = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#f1f5f9';
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                    >
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                        {job.title}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                        {job.companyName || 'Doanh nghiệp ẩn danh'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>
                          {job.salaryFrom && job.salaryTo ? `${job.salaryFrom} - ${job.salaryTo} tr` : 'Thỏa thuận'}
                        </span>
                        <span style={{ color: '#94a3b8' }}>{job.city || 'Toàn quốc'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
