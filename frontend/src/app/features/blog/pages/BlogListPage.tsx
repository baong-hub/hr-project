import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Clock, User } from 'lucide-react';
import { articlesService, type ArticleSummary } from '../../../core/services/articles.service';
import { SeoHead } from '../../../shared/components/SeoHead';
import styles from './BlogListPage.module.scss';

export const BlogListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('q') || '';

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    articlesService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    articlesService
      .getArticles({
        category: currentCategory === 'all' ? undefined : currentCategory,
        search: currentSearch || undefined,
        pageSize: 15,
      })
      .then((res) => setArticles(res.items))
      .catch((err) => console.error('Error fetching articles:', err))
      .finally(() => setLoading(false));
  }, [currentCategory, currentSearch]);

  const handleCategorySelect = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'all') next.delete('category');
    else next.set('category', cat);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('q', searchInput.trim());
    else next.delete('q');
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className={styles.blogListPage}>
      <SeoHead
        title="Cẩm nang nghề nghiệp & Bí quyết tuyển dụng | HR Portal"
        description="Tổng hợp hướng dẫn viết CV chuẩn ATS, kinh nghiệm phỏng vấn kỹ thuật, phân tích thị trường lao động và định hướng nghề nghiệp."
      />

      {/* Hero Section */}
      <section className={styles.heroSection} aria-label="Giới thiệu cẩm nang">
        <div className={styles.heroTag}>
          <BookOpen size={14} />
          <span>Cẩm nang nghề nghiệp 2026</span>
        </div>
        <h1>Kiến thức & Kinh nghiệm Tuyển dụng</h1>
        <p>
          Chia sẻ thông tin thực tế về quy trình phỏng vấn, xu hướng lương thưởng và kỹ năng phát triển sự nghiệp
        </p>

        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm bài viết, chủ đề phỏng vấn, kỹ năng..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>
            Tìm kiếm
          </button>
        </form>
      </section>

      {/* Category Pills Bar */}
      <nav className={styles.categoryBar} aria-label="Chuyên mục bài viết">
        <button
          type="button"
          className={`${styles.catPill} ${currentCategory === 'all' ? styles.active : ''}`}
          onClick={() => handleCategorySelect('all')}
        >
          Tất cả chủ đề
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`${styles.catPill} ${currentCategory === cat ? styles.active : ''}`}
            onClick={() => handleCategorySelect(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Articles Grid */}
      <main aria-label="Danh sách bài viết">
        {loading ? (
          <div className={styles.emptyArticles}>
            <BookOpen size={36} />
            <h3>Đang tải bài viết...</h3>
          </div>
        ) : articles.length === 0 ? (
          <div className={styles.emptyArticles}>
            <BookOpen size={36} />
            <h3>Không tìm thấy bài viết nào</h3>
            <p>Hãy thử tìm kiếm với từ khóa khác hoặc chọn chuyên mục khác.</p>
          </div>
        ) : (
          <div className={styles.articlesGrid}>
            {articles.map((art) => (
              <Link
                key={art.id}
                to={`/blog/${art.slug}`}
                className={styles.articleCard}
              >
                <div className={styles.editorialHeader}>
                  <span className={styles.categoryBadge}>{art.category}</span>
                  <span className={styles.readTime}>
                    <Clock size={12} /> {art.readingTimeMinutes || 5} phút đọc
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h2 className={styles.articleTitle}>{art.title}</h2>
                  <p className={styles.articleSummary}>{art.summary}</p>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.authorWrap}>
                    <User size={12} />
                    <span>{art.authorName || 'Ban biên tập HR'}</span>
                  </div>
                  <span>{new Date(art.publishedAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogListPage;
