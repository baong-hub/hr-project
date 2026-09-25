import api from './api.service';

export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl?: string;
  category: string;
  tags: string[];
  authorName: string;
  publishedAt: string;
  viewCount: number;
  readingTimeMinutes: number;
}

export interface ArticleDetail extends ArticleSummary {
  contentHtml: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedArticlesResult {
  items: ArticleSummary[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ArticleQueryFilter {
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: 'newest' | 'popular';
  page?: number;
  pageSize?: number;
}

export const articlesService = {
  async getArticles(params?: ArticleQueryFilter): Promise<PagedArticlesResult> {
    const res = await api.get('/articles', { params });
    return res.data?.data || { items: [], meta: { page: 1, pageSize: 9, total: 0, totalPages: 0 } };
  },

  async getArticleBySlug(slug: string): Promise<ArticleDetail> {
    const res = await api.get(`/articles/${slug}`);
    return res.data?.data;
  },

  async getCategories(): Promise<string[]> {
    const res = await api.get('/articles/categories');
    return res.data?.data || [];
  }
};
