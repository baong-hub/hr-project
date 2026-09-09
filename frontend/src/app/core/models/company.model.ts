export interface CultureHighlight {
  title: string;
  description: string;
  icon?: string;
}

export interface CompanyFaq {
  question: string;
  answer: string;
}

export interface CompanyTestimonial {
  authorName: string;
  authorRole: string;
  avatarUrl?: string;
  content: string;
  rating: number;
}

export interface CompanyDto {
  id: number;
  name: string;
  logoUrl?: string;
  bannerUrl?: string;
  taxCode?: string;
  website?: string;
  industry: string;
  sizeRange: string;
  foundedYear?: number;
  address: string;
  description?: string;
  benefits?: string;
  contact?: string;
  socialLinks?: string; // JSON string
  verificationStatus: CompanyVerificationStatus;
  followersCount: number;
  isFollowing?: boolean;
  videoUrl?: string;
  officeGallery?: string; // JSON array of string URLs
  cultureHighlights?: string; // JSON array of CultureHighlight
  companyFaqs?: string; // JSON array of CompanyFaq
  testimonials?: string; // JSON array of CompanyTestimonial
}

export type CompanyVerificationStatus = 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface UpdateCompanyDto {
  name: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  website?: string;
  sizeRange: string;
  industry: string;
  addressList: string;
  benefits?: string;
  videoUrl?: string;
  officeGallery?: string;
  cultureHighlights?: string;
  companyFaqs?: string;
  testimonials?: string;
  contact?: string;
  socialLinks?: string;
}

export interface FollowResultDto {
  companyId: number;
  isFollowing: boolean;
  followersCount: number;
}
