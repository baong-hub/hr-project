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
}

export interface FollowResultDto {
  companyId: number;
  isFollowing: boolean;
  followersCount: number;
}
