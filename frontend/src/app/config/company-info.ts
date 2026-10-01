export interface CompanyInfo {
  name: string;
  legalName: string;
  address: string;
  phone: string;
  email: string;
  taxCode: string;
  operatingHours: string;
}

export const COMPANY_INFO: CompanyInfo = {
  name: 'HR Portal',
  legalName: 'Công ty TNHH Công nghệ & Nhân sự HR Portal',
  address: 'Tầng 8, Tòa nhà Innovation Center, 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  phone: '1900 6868 - (028) 7300 8888',
  email: 'support@hrportal.vn',
  taxCode: '0316889999',
  operatingHours: 'Thứ Hai - Thứ Sáu (8:00 - 17:30)',
};

