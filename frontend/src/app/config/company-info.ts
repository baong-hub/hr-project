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
  legalName: '[CẦN ĐIỀN: Tên Công Ty / Legal Entity Name]',
  address: '[CẦN ĐIỀN: Địa chỉ trụ sở chính]',
  phone: '[CẦN ĐIỀN: Hotline / Điện thoại liên hệ]',
  email: '[CẦN ĐIỀN: Email hỗ trợ]',
  taxCode: '[CẦN ĐIỀN: Mã số thuế]',
  operatingHours: 'Thứ Hai - Thứ Sáu (8:00 - 17:30)',
};
