import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Eye, 
  ArrowRight, 
  User, 
  Sparkles 
} from 'lucide-react';
import { articlesService } from '../../../core/services/articles.service';
import type { ArticleSummary } from '../../../core/services/articles.service';
import { SeoHead } from '../../../shared/components/SeoHead';

export const BlogListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('q') || '';

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInputValue, setSearchInputValue] = useState(currentSearch);

  useEffect(() => {
    articlesService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    articlesService.getArticles({
      category: currentCategory === 'all' ? undefined : currentCategory,
      search: currentSearch || undefined,
      pageSize: 12
    })
      .then(res => setArticles(res.items))
      .catch(err => console.error('Error fetching articles:', err))
      .finally(() => setLoading(false));
  }, [currentCategory, currentSearch]);

  const handleCategorySelect = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'all') params.delete('category');
    else params.set('category', cat);
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInputValue.trim()) params.set('q', searchInputValue.trim());
    else params.delete('q');
    setSearchParams(params);
  };

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const standardArticles = articles.length > 0 ? articles.slice(1) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '80px' }}>
      <SeoHead
        title="Cẩm nang nghề nghiệp, Bí quyết viết CV & Phỏng vấn 2026 | HR Portal"
        description="Khám phá trọn bộ cẩm nang xin việc chuẩn quốc tế: mẹo viết CV chuẩn ATS, tuyển tập câu hỏi phỏng vấn kỹ thuật, luật lao động và xu hướng mức lương thị trường."
        canonicalUrl="https://tuyendung.hamo.vn/blog"
        keywords="cẩm nang nghề nghiệp, mẹo viết cv, phỏng vấn xin việc, câu hỏi phỏng vấn it, luật lao động, tuyển dụng"
      />

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '70px 24px 60px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '10%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '6px 14px',
            borderRadius: '999px',
            color: '#60a5fa',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '18px'
          }}>
            <Sparkles size={16} /> Cẩm nang phát triển sự nghiệp & Tuyển dụng
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Kiến thức nghề nghiệp, Bí quyết CV & Chiến lược tuyển dụng
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 32px 0', lineHeight: 1.6 }}>
            Tổng hợp bài viết chất lượng cao từ các chuyên gia Headhunter và Tech Leader hàng đầu giúp bạn tự tin vượt qua mọi vòng tuyển dụng.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ maxWidth: '560px', margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              placeholder="Tìm kiếm bài viết (VD: CV chuẩn ATS, phỏng vấn React, lương thử việc...)"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 120px 16px 46px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '10px 20px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Category Pills */}
        <div style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '16px',
          marginBottom: '36px',
          scrollbarWidth: 'none'
        }}>
          <button
            onClick={() => handleCategorySelect('all')}
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              border: currentCategory === 'all' ? 'none' : '1px solid #e2e8f0',
              background: currentCategory === 'all' ? '#2563eb' : '#ffffff',
              color: currentCategory === 'all' ? '#ffffff' : '#475569',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              boxShadow: currentCategory === 'all' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
            }}
          >
            Tất cả chủ đề
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              style={{
                padding: '10px 20px',
                borderRadius: '999px',
                border: currentCategory === cat ? 'none' : '1px solid #e2e8f0',
                background: currentCategory === cat ? '#2563eb' : '#ffffff',
                color: currentCategory === cat ? '#ffffff' : '#475569',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: currentCategory === cat ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              animation: 'spin 0.8s linear infinite'
            }} />
            Đang tải cẩm nang bài viết...
          </div>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <BookOpen size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', margin: '0 0 8px 0' }}>
              Không tìm thấy bài viết nào
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>
              Hãy thử tìm kiếm với từ khoá khác hoặc chọn lại chủ đề danh mục.
            </p>
            <button
              onClick={() => { setSearchInputValue(''); handleCategorySelect('all'); }}
              style={{
                padding: '10px 20px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Xem tất cả bài viết
            </button>
          </div>
        )}

        {/* Featured Article Card */}
        {!loading && featuredArticle && (
          <div style={{ marginBottom: '48px' }}>
            <Link 
              to={`/blog/${featuredArticle.slug}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0',
                transition: 'transform 0.25s, box-shadow 0.25s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{ height: '340px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={featuredArticle.thumbnailUrl || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=80'}
                  alt={featuredArticle.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}>
                  {featuredArticle.category}
                </span>
              </div>
              <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={15} /> {featuredArticle.authorName}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} /> {featuredArticle.readingTimeMinutes} phút đọc
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={15} /> {featuredArticle.viewCount.toLocaleString()} lượt xem
                    </span>
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0', lineHeight: 1.35 }}>
                    {featuredArticle.title}
                  </h2>
                  <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                    {featuredArticle.summary}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 600, fontSize: '14px' }}>
                  Đọc toàn bộ bài viết <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Regular Articles Grid */}
        {!loading && standardArticles.length > 0 && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '24px' }}>
              Bài viết mới nhất
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '28px'
            }}>
              {standardArticles.map((art) => (
                <Link
                  key={art.id}
                  to={`/blog/${art.slug}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    background: '#ffffff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.03)';
                  }}
                >
                  <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={art.thumbnailUrl || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=80'}
                      alt={art.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {art.category}
                    </span>
                  </div>
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {art.readingTimeMinutes} phút đọc
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={13} /> {art.viewCount.toLocaleString()} xem
                        </span>
                      </div>
                      <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        {art.title}
                      </h4>
                      <p style={{
                        fontSize: '13px',
                        color: '#64748b',
                        lineHeight: 1.55,
                        margin: '0 0 16px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {art.summary}
                      </p>
                    </div>
                    <div style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px'
                    }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>{art.authorName}</span>
                      <span style={{ color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Xem tiếp <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
