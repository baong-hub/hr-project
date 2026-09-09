/**
 * Chuẩn hóa tên thành phố để so sánh linh hoạt.
 * Giải quyết vấn đề dữ liệu không đồng nhất giữa DB và UI:
 *   DB: "TP. HCM", "Hà Nội", "Đà Nẵng"
 *   UI: "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"
 */

// Map tất cả các biến thể tên thành phố → key chuẩn
const CITY_ALIASES: Record<string, string> = {
  'tp. hcm': 'hcm',
  'tp.hcm': 'hcm',
  'tp hcm': 'hcm',
  'hcm': 'hcm',
  'hồ chí minh': 'hcm',
  'ho chi minh': 'hcm',
  'tp. hồ chí minh': 'hcm',
  'tp.hồ chí minh': 'hcm',
  'tp hồ chí minh': 'hcm',
  'thành phố hồ chí minh': 'hcm',
  'sài gòn': 'hcm',
  'saigon': 'hcm',
  'hà nội': 'hanoi',
  'ha noi': 'hanoi',
  'hanoi': 'hanoi',
  'đà nẵng': 'danang',
  'da nang': 'danang',
  'danang': 'danang',
  'hải phòng': 'haiphong',
  'hai phong': 'haiphong',
  'cần thơ': 'cantho',
  'can tho': 'cantho',
  'remote': 'remote',
  'từ xa': 'remote',
};

/**
 * Trả về key chuẩn hóa cho một tên thành phố.
 * Ví dụ: "TP. HCM" → "hcm", "Hà Nội" → "hanoi", "Quận 1, TP. HCM" → "hcm"
 */
export function normalizeCityKey(city: string): string {
  if (!city) return '';
  const lower = city.trim().toLowerCase();
  if (CITY_ALIASES[lower]) return CITY_ALIASES[lower];

  // Tìm kiếm theo chuỗi con (substring) nếu chuỗi dài hơn (ví dụ "Quận 1, TP. HCM")
  for (const [alias, key] of Object.entries(CITY_ALIASES)) {
    if (lower.includes(alias)) {
      return key;
    }
  }
  return lower;
}

/**
 * So sánh 2 tên thành phố có khớp nhau không (linh hoạt).
 * matchCity("TP. HCM", "Hồ Chí Minh") → true
 * matchCity("Hà Nội", "Hà Nội") → true
 */
export function matchCity(cityA: string, cityB: string): boolean {
  if (!cityA || !cityB) return false;
  const keyA = normalizeCityKey(cityA);
  const keyB = normalizeCityKey(cityB);
  if (keyA && keyB && keyA === keyB) return true;
  const lowA = cityA.toLowerCase();
  const lowB = cityB.toLowerCase();
  return lowA.includes(lowB) || lowB.includes(lowA);
}

/**
 * Danh sách các thành phố chuẩn dùng cho dropdown filter.
 * value là key chuẩn hóa, label là tên hiển thị.
 */
export const CITY_OPTIONS = [
  { value: '', label: 'Tất cả địa điểm' },
  { value: 'hanoi', label: 'Hà Nội' },
  { value: 'hcm', label: 'TP. Hồ Chí Minh' },
  { value: 'danang', label: 'Đà Nẵng' },
  { value: 'haiphong', label: 'Hải Phòng' },
  { value: 'cantho', label: 'Cần Thơ' },
  { value: 'remote', label: 'Remote / Từ xa' },
];
