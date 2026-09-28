import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  User,
  ChevronRight,
  CheckCircle2,
  Copy,
  Tag,
} from 'lucide-react';
import { articlesService, type ArticleDetail } from '../../../core/services/articles.service';
import { jobsService } from '../../../core/services/jobs.service';
import { toast } from '../../../core/services/toast.service';
import type { JobDto } from '../../../core/models/job.model';
import { SeoHead } from '../../../shared/components/SeoHead';
import styles from './BlogDetailPage.module.scss';

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    articlesService
      .getArticleBySlug(slug)
      .then((data) => {
        setArticle(data);
        const searchKeyword =
          data.tags && data.tags.length > 0 ? data.tags[0] : data.category;
        jobsService
          .getJobs({ keyword: searchKeyword, pageSize: 4 })
          .then((res) => setRelatedJobs(res.data?.data?.items || []))
          .catch(() => {});
      })
      .catch((err) => console.error('Failed to load article:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatSalary = (from?: number, to?: number) => {
    if (!from && !to) return 'Thỏa thuận';
    const fmt = (n: number) => (n / 1000000).toFixed(0) + ' triệu';
    if (from && to) return `${fmt(from)} - ${fmt(to)}`;
    if (from) return `Từ ${fmt(from)}`;
    return `Đến ${fmt(to!)}`;
  };

  if (loading) {
    return (
      <div className={styles.blogDetailPage}>
        <div className={styles.loadingState}>
          Đang tải bài viết...
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className={styles.blogDetailPage}>
        <div className={styles.emptyState}>
          <h2>Không tìm thấy bài viết</h2>
          <p>Bài viết bạn đang tìm kiếm có thể đã bị gỡ hoặc đường dẫn không chính xác.</p>
          <Link to="/blog" className={styles.backLink}>
            ← Quay lại trang Cẩm nang
          </Link>
        </div>
      </div>
    );
  }

  // Schema.org Article Structured Data
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.summary,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.authorName || 'Ban biên tập HR Portal',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HR Portal',
      logo: {
        '@type': 'ImageObject',
        url: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png',
      },
    },
  };

  return (
    <div className={styles.blogDetailPage}>
      <SeoHead
        title={`${article.seoTitle || article.title} | Cẩm nang HR Portal`}
        description={article.seoDescription || article.summary}
        ogType="article"
        ogImage={article.thumbnailUrl || '/logo.png'}
        jsonLd={articleSchema}
      />

      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumbs} aria-label="Đường dẫn trang">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={13} className={styles.separator} />
        <Link to="/blog">Cẩm nang</Link>
        {article.category && (
          <>
            <ChevronRight size={13} className={styles.separator} />
            <Link to={`/blog?category=${encodeURIComponent(article.category)}`}>
              {article.category}
            </Link>
          </>
        )}
        <ChevronRight size={13} className={styles.separator} />
        <span className={styles.current}>{article.title}</span>
      </nav>

      <div className={styles.layoutGrid}>
        {/* Main Reading Column */}
        <article className={styles.mainColumn} aria-label="Nội dung bài viết">
          <header className={styles.articleHeader}>
            <div className={styles.tagRow}>
              <span className={styles.categoryPill}>{article.category}</span>
              <span className={styles.readTime}>
                <Clock size={13} /> {article.readingTimeMinutes || 5} phút đọc
              </span>
            </div>

            <h1 className={styles.articleTitle}>{article.title}</h1>

            <div className={styles.articleMetaRow}>
              <div className={styles.authorItem}>
                <User size={14} />
                <span>{article.authorName || 'Ban biên tập HR Portal'}</span>
              </div>
              <span>•</span>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
              </time>
            </div>
          </header>

          {/* Prose Content */}
          <div
            className={styles.articleProse}
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className={styles.tagsRow} aria-label="Từ khóa chủ đề">
              <Tag size={14} className={styles.tagIcon} />
              {article.tags.map((tag) => (
                <span key={tag} className={styles.tagItem}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Right Sidebar */}
        <aside className={styles.sidebarColumn} aria-label="Thao tác và liên quan">
          {/* Share Card */}
          <div className={styles.shareCard}>
            <h3>Chia sẻ bài viết</h3>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={14} className={styles.copiedIcon} />
                  <span>Đã sao chép liên kết</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Sao chép liên kết</span>
                </>
              )}
            </button>
          </div>

          {/* Related Jobs Widget */}
          {relatedJobs.length > 0 && (
            <div className={styles.relatedJobsCard}>
              <h3>Cơ hội việc làm liên quan</h3>
              <div className={styles.jobList}>
                {relatedJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className={styles.jobItem}
                  >
                    <h4 className={styles.jobTitle}>{job.title}</h4>
                    <p className={styles.jobCompany}>
                      {job.companyName} • {job.city}
                    </p>
                    <span className={styles.jobSalary}>
                      {formatSalary(job.salaryFrom, job.salaryTo)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default BlogDetailPage;
