import api from './api.service';

export interface ProvinceItem {
  code: string;
  name: string;
  type: 'city' | 'province';
  legacyNames: string[];
  aliases: string[];
  jobCount?: number;
}

export interface IndustryItem {
  code: string;
  name: string;
  jobCount?: number;
}

export const STATIC_PROVINCES: ProvinceItem[] = [
  // 6 Central Cities
  {
    code: 'ha-noi',
    name: 'Hà Nội',
    type: 'city',
    legacyNames: [],
    aliases: ['hn', 'ha noi', 'hanoi', 'thu do']
  },
  {
    code: 'ho-chi-minh',
    name: 'TP. Hồ Chí Minh',
    type: 'city',
    legacyNames: ['Bình Dương', 'Bà Rịa – Vũng Tàu', 'Bà Rịa - Vũng Tàu', 'Bà Rịa', 'Vũng Tàu', 'Bình Dương cũ'],
    aliases: ['hcm', 'tphcm', 'tp hcm', 'tp.hcm', 'sai gon', 'sài gòn', 'ho chi minh', 'binh duong', 'ba ria', 'vung tau']
  },
  {
    code: 'hai-phong',
    name: 'Hải Phòng',
    type: 'city',
    legacyNames: ['Hải Dương'],
    aliases: ['hp', 'hai phong', 'hai duong']
  },
  {
    code: 'da-nang',
    name: 'Đà Nẵng',
    type: 'city',
    legacyNames: ['Quảng Nam'],
    aliases: ['dn', 'đn', 'da nang', 'quang nam']
  },
  {
    code: 'can-tho',
    name: 'Cần Thơ',
    type: 'city',
    legacyNames: ['Sóc Trăng', 'Hậu Giang'],
    aliases: ['ct', 'can tho', 'soc trang', 'hau giang']
  },
  {
    code: 'hue',
    name: 'Huế',
    type: 'city',
    legacyNames: ['Thừa Thiên Huế'],
    aliases: ['thua thien hue', 'thừa thiên huế', 'hue']
  },

  // 28 Provinces in alphabetical order
  {
    code: 'an-giang',
    name: 'An Giang',
    type: 'province',
    legacyNames: ['Kiên Giang'],
    aliases: ['kien giang']
  },
  {
    code: 'bac-ninh',
    name: 'Bắc Ninh',
    type: 'province',
    legacyNames: ['Bắc Giang'],
    aliases: ['bac giang', 'bac ninh']
  },
  {
    code: 'ca-mau',
    name: 'Cà Mau',
    type: 'province',
    legacyNames: ['Bạc Liêu'],
    aliases: ['bac lieu', 'ca mau']
  },
  {
    code: 'cao-bang',
    name: 'Cao Bằng',
    type: 'province',
    legacyNames: [],
    aliases: ['cao bang']
  },
  {
    code: 'dak-lak',
    name: 'Đắk Lắk',
    type: 'province',
    legacyNames: ['Phú Yên'],
    aliases: ['dak lak', 'dac lac', 'phu yen', 'buon ma thuot']
  },
  {
    code: 'dien-bien',
    name: 'Điện Biên',
    type: 'province',
    legacyNames: [],
    aliases: ['dien bien']
  },
  {
    code: 'dong-nai',
    name: 'Đồng Nai',
    type: 'province',
    legacyNames: ['Bình Phước'],
    aliases: ['dong nai', 'binh phuoc', 'bien hoa']
  },
  {
    code: 'dong-thap',
    name: 'Đồng Tháp',
    type: 'province',
    legacyNames: ['Tiền Giang'],
    aliases: ['dong thap', 'tien giang', 'my tho']
  },
  {
    code: 'gia-lai',
    name: 'Gia Lai',
    type: 'province',
    legacyNames: ['Bình Định'],
    aliases: ['gia lai', 'binh dinh', 'quy nhon', 'pleiku']
  },
  {
    code: 'ha-tinh',
    name: 'Hà Tĩnh',
    type: 'province',
    legacyNames: [],
    aliases: ['ha tinh']
  },
  {
    code: 'hung-yen',
    name: 'Hưng Yên',
    type: 'province',
    legacyNames: ['Thái Bình'],
    aliases: ['hung yen', 'thai binh']
  },
  {
    code: 'khanh-hoa',
    name: 'Khánh Hòa',
    type: 'province',
    legacyNames: ['Ninh Thuận'],
    aliases: ['khanh hoa', 'nha trang', 'ninh thuan', 'phan rang']
  },
  {
    code: 'lai-chau',
    name: 'Lai Châu',
    type: 'province',
    legacyNames: [],
    aliases: ['lai chau']
  },
  {
    code: 'lam-dong',
    name: 'Lâm Đồng',
    type: 'province',
    legacyNames: ['Đắk Nông', 'Bình Thuận'],
    aliases: ['lam dong', 'da lat', 'dak nong', 'binh thuan', 'phan thiet']
  },
  {
    code: 'lang-son',
    name: 'Lạng Sơn',
    type: 'province',
    legacyNames: [],
    aliases: ['lang son']
  },
  {
    code: 'lao-cai',
    name: 'Lào Cai',
    type: 'province',
    legacyNames: ['Yên Bái'],
    aliases: ['lao cai', 'sapa', 'sa pa', 'yen bai']
  },
  {
    code: 'nghe-an',
    name: 'Nghệ An',
    type: 'province',
    legacyNames: [],
    aliases: ['nghe an', 'vinh']
  },
  {
    code: 'ninh-binh',
    name: 'Ninh Bình',
    type: 'province',
    legacyNames: ['Hà Nam', 'Nam Định'],
    aliases: ['ninh binh', 'ha nam', 'nam dinh']
  },
  {
    code: 'phu-tho',
    name: 'Phú Thọ',
    type: 'province',
    legacyNames: ['Vĩnh Phúc', 'Hòa Bình'],
    aliases: ['phu tho', 'vinh phuc', 'hoa binh', 'viet tri']
  },
  {
    code: 'quang-ngai',
    name: 'Quảng Ngãi',
    type: 'province',
    legacyNames: ['Kon Tum'],
    aliases: ['quang ngai', 'kon tum']
  },
  {
    code: 'quang-ninh',
    name: 'Quảng Ninh',
    type: 'province',
    legacyNames: [],
    aliases: ['quang ninh', 'ha long']
  },
  {
    code: 'quang-tri',
    name: 'Quảng Trị',
    type: 'province',
    legacyNames: ['Quảng Bình'],
    aliases: ['quang tri', 'quang binh', 'dong hoi']
  },
  {
    code: 'son-la',
    name: 'Sơn La',
    type: 'province',
    legacyNames: [],
    aliases: ['son la', 'moc chau']
  },
  {
    code: 'tay-ninh',
    name: 'Tây Ninh',
    type: 'province',
    legacyNames: ['Long An'],
    aliases: ['tay ninh', 'long an', 'tan an']
  },
  {
    code: 'thai-nguyen',
    name: 'Thái Nguyên',
    type: 'province',
    legacyNames: ['Bắc Kạn'],
    aliases: ['thai nguyen', 'bac kan']
  },
  {
    code: 'thanh-hoa',
    name: 'Thanh Hóa',
    type: 'province',
    legacyNames: [],
    aliases: ['thanh hoa']
  },
  {
    code: 'tuyen-quang',
    name: 'Tuyên Quang',
    type: 'province',
    legacyNames: ['Hà Giang'],
    aliases: ['tuyen quang', 'ha giang']
  },
  {
    code: 'vinh-long',
    name: 'Vĩnh Long',
    type: 'province',
    legacyNames: ['Bến Tre', 'Trà Vinh'],
    aliases: ['vinh long', 'ben tre', 'tra vinh']
  }
];

export const STATIC_INDUSTRIES: IndustryItem[] = [
  { code: 'ban-le-tieu-dung-tmdt', name: 'Bán lẻ / Hàng tiêu dùng / Thương mại điện tử' },
  { code: 'bao-hiem', name: 'Bảo hiểm' },
  { code: 'bao-ve-dich-vu-toa-nha', name: 'Bảo vệ / Dịch vụ tòa nhà' },
  { code: 'bien-phien-dich', name: 'Biên / Phiên dịch / Ngoại ngữ' },
  { code: 'bat-dong-san', name: 'Bất động sản' },
  { code: 'co-khi-che-tao', name: 'Cơ khí / Chế tạo / Tự động hóa' },
  { code: 'cong-nghe-thong-tin', name: 'Công nghệ thông tin / Phần mềm' },
  { code: 'dau-khi-nang-luong', name: 'Dầu khí / Năng lượng / Khoáng sản' },
  { code: 'det-may-da-giay', name: 'Dệt may / Da giày / Thời trang' },
  { code: 'dich-vu-khach-hang', name: 'Dịch vụ khách hàng' },
  { code: 'dien-dien-tu-vien-thong', name: 'Điện / Điện tử / Viễn thông' },
  { code: 'du-lich-su-kien', name: 'Du lịch / Lữ hành / Sự kiện' },
  { code: 'giao-duc-dao-tao', name: 'Giáo dục / Đào tạo / Nghiên cứu' },
  { code: 'hanh-chinh-van-phong', name: 'Hành chính / Văn phòng / Thư ký' },
  { code: 'hoa-chat-sinh-hoc-moi-truong', name: 'Hóa chất / Sinh học / Môi trường' },
  { code: 'ke-toan-kiem-toan', name: 'Kế toán / Kiểm toán' },
  { code: 'kinh-doanh-ban-hang', name: 'Kinh doanh / Bán hàng' },
  { code: 'lao-dong-pho-thong', name: 'Lao động phổ thông / Thời vụ' },
  { code: 'marketing-truyen-thong', name: 'Marketing / Truyền thông / Quảng cáo' },
  { code: 'ngan-hang-tai-chinh', name: 'Ngân hàng / Tài chính / Chứng khoán' },
  { code: 'nhan-su-tuyen-dung', name: 'Nhân sự / Tuyển dụng' },
  { code: 'nha-hang-khach-san', name: 'Nhà hàng / Khách sạn / Ẩm thực' },
  { code: 'nong-lam-ngu', name: 'Nông / Lâm / Ngư nghiệp / Thú y' },
  { code: 'o-to-xe-may', name: 'Ô tô / Xe máy / Dịch vụ kỹ thuật' },
  { code: 'phap-ly', name: 'Pháp lý / Luật' },
  { code: 'phi-loi-nhuan', name: 'Phi chính phủ / Phi lợi nhuận' },
  { code: 'san-xuat-van-hanh', name: 'Sản xuất / Vận hành / QA-QC' },
  { code: 'thiet-ke-sang-tao', name: 'Thiết kế / Mỹ thuật / Sáng tạo' },
  { code: 'thuc-pham-do-uong', name: 'Thực phẩm / Đồ uống' },
  { code: 'tu-van-quan-ly-du-an', name: 'Tư vấn / Quản lý dự án' },
  { code: 'van-tai-kho-van-logistics', name: 'Vận tải / Kho vận / Logistics' },
  { code: 'bao-chi-noi-dung-xuat-ban', name: 'Báo chí / Biên tập / Xuất bản' },
  { code: 'xay-dung-kien-truc', name: 'Xây dựng / Kiến trúc / Nội thất' },
  { code: 'xuat-nhap-khau', name: 'Xuất nhập khẩu / Ngoại thương' },
  { code: 'y-te-duoc', name: 'Y tế / Dược / Chăm sóc sức khỏe' },
  { code: 'khac', name: 'Khác' }
];

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function matchProvince(input: string, provinces: ProvinceItem[] = STATIC_PROVINCES): ProvinceItem | undefined {
  if (!input) return undefined;
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const normalized = normalizeText(raw);

  // 1. Exact code match
  const byCode = provinces.find((p) => p.code === lower || p.code === normalized);
  if (byCode) return byCode;

  // 2. Exact or normalized name match
  const byName = provinces.find((p) => {
    return p.name.toLowerCase() === lower || normalizeText(p.name) === normalized;
  });
  if (byName) return byName;

  // 3. Aliases match
  const byAlias = provinces.find((p) =>
    p.aliases.some((a) => a.toLowerCase() === lower || normalizeText(a) === normalized)
  );
  if (byAlias) return byAlias;

  // 4. Legacy names match (e.g. "Bình Dương", "Hải Dương")
  const byLegacy = provinces.find((p) =>
    p.legacyNames.some((l) => l.toLowerCase() === lower || normalizeText(l) === normalized)
  );
  if (byLegacy) return byLegacy;

  // 5. Partial / contains match
  const byPartial = provinces.find((p) => {
    const pNorm = normalizeText(p.name);
    return (
      normalized.includes(pNorm) ||
      pNorm.includes(normalized) ||
      p.legacyNames.some((l) => {
        const lNorm = normalizeText(l);
        return normalized.includes(lNorm) || lNorm.includes(normalized);
      })
    );
  });
  if (byPartial) return byPartial;

  return undefined;
}

export function matchIndustry(input: string, industries: IndustryItem[] = STATIC_INDUSTRIES): IndustryItem | undefined {
  if (!input) return undefined;
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const normalized = normalizeText(raw);

  const byCode = industries.find((i) => i.code === lower || i.code === normalized);
  if (byCode) return byCode;

  const byName = industries.find((i) => {
    return i.name.toLowerCase() === lower || normalizeText(i.name) === normalized;
  });
  if (byName) return byName;

  const byPartial = industries.find((i) => {
    const iNorm = normalizeText(i.name);
    return normalized.includes(iNorm) || iNorm.includes(normalized);
  });
  if (byPartial) return byPartial;

  return undefined;
}

let cachedProvinces: ProvinceItem[] | null = null;
let cachedIndustries: IndustryItem[] | null = null;

export const metaService = {
  getProvinces: async (): Promise<ProvinceItem[]> => {
    if (cachedProvinces && cachedProvinces.length > 0) {
      return cachedProvinces;
    }
    try {
      const res = await api.get('/meta/provinces');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        cachedProvinces = data;
        return data;
      }
    } catch {
      // Fallback silently to static provinces
    }
    cachedProvinces = STATIC_PROVINCES;
    return STATIC_PROVINCES;
  },

  getIndustries: async (): Promise<IndustryItem[]> => {
    if (cachedIndustries && cachedIndustries.length > 0) {
      return cachedIndustries;
    }
    try {
      const res = await api.get('/meta/industries');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        cachedIndustries = data;
        return data;
      }
    } catch {
      // Fallback silently to static industries
    }
    cachedIndustries = STATIC_INDUSTRIES;
    return STATIC_INDUSTRIES;
  },

  getJobFacets: async (params?: Record<string, any>) => {
    const res = await api.get('/jobs/facets', { params });
    return res.data?.data || res.data;
  },

  normalizeText,
  matchProvince,
  matchIndustry,
};

export default metaService;
