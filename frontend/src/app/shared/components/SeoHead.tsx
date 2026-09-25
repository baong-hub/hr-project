import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title = 'HR Portal — Nền tảng Tìm việc & Tuyển dụng Nhân sự AI',
  description = 'Khám phá hàng ngàn cơ hội việc làm chất lượng cao, gợi ý nghề nghiệp thông minh với AI Matching & bảo vệ dữ liệu cá nhân theo Nghị định 13.',
  keywords = 'tuyển dụng, việc làm, tìm việc nhanh, HR portal, ứng viên, nhà tuyển dụng, AI recruitment',
  canonicalUrl,
  ogType = 'website',
  ogImage = '/hr.png',
  jsonLd
}) => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const effectiveCanonical = canonicalUrl || currentUrl;
  const siteName = 'HR Portal';

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {effectiveCanonical && <link rel="canonical" href={effectiveCanonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {effectiveCanonical && <meta property="og:url" content={effectiveCanonical} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Structured Data (JSON-LD) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
