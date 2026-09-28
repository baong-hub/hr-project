using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;

namespace HR.Domain.Reference;

public record ProvinceItem(
    string Code,
    string Name,
    string Type,
    List<string> LegacyNames,
    List<string> Aliases
);

public record JobCategoryItem(
    string Code,
    string Name
);

public static class AdministrativeReference
{
    private static readonly Lazy<List<ProvinceItem>> _provinces = new(LoadProvinces);
    private static readonly Lazy<List<JobCategoryItem>> _categories = new(LoadCategories);

    public static IReadOnlyList<ProvinceItem> Provinces => _provinces.Value;
    public static IReadOnlyList<JobCategoryItem> Categories => _categories.Value;

    public static string Normalize(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var normalized = text.Trim().ToLowerInvariant();
        normalized = normalized.Replace("đ", "d").Replace("Đ", "d");

        var formD = normalized.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();

        foreach (var ch in formD)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (uc != UnicodeCategory.NonSpacingMark)
            {
                if (char.IsLetterOrDigit(ch) || char.IsWhiteSpace(ch))
                {
                    sb.Append(ch);
                }
                else
                {
                    sb.Append(' ');
                }
            }
        }

        var clean = sb.ToString().Normalize(NormalizationForm.FormC);
        var parts = clean.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        return string.Join(" ", parts);
    }

    public static string? MatchProvince(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var raw = text.Trim();
        var norm = Normalize(raw);
        if (string.IsNullOrEmpty(norm)) return null;

        // 1. Direct match on code
        var byCode = Provinces.FirstOrDefault(p => string.Equals(p.Code, raw, StringComparison.OrdinalIgnoreCase));
        if (byCode != null) return byCode.Code;

        // 2. Exact match on normalized official name
        var byName = Provinces.FirstOrDefault(p => Normalize(p.Name) == norm);
        if (byName != null) return byName.Code;

        // 3. Match aliases or legacy names
        foreach (var p in Provinces)
        {
            if (p.Aliases.Any(a => Normalize(a) == norm))
                return p.Code;

            if (p.LegacyNames.Any(l => Normalize(l) == norm))
                return p.Code;
        }

        // 4. Substring containment match for common multi-word addresses (e.g. "Quận 1, TP. Hồ Chí Minh", "Khu công nghiệp VSIP Bình Dương")
        foreach (var p in Provinces)
        {
            // Check legacy names in address text
            foreach (var legacy in p.LegacyNames)
            {
                var normLegacy = Normalize(legacy);
                if (norm.Contains(normLegacy))
                    return p.Code;
            }

            // Check aliases in address text
            foreach (var alias in p.Aliases)
            {
                var normAlias = Normalize(alias);
                if (normAlias.Length >= 4 && norm.Contains(normAlias))
                    return p.Code;
            }

            var normOfficial = Normalize(p.Name);
            if (normOfficial.Length >= 4 && norm.Contains(normOfficial))
                return p.Code;
        }

        return null;
    }

    public static string? MatchCategory(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var raw = text.Trim();
        var norm = Normalize(raw);
        if (string.IsNullOrEmpty(norm)) return null;

        // Direct code match
        var byCode = Categories.FirstOrDefault(c => string.Equals(c.Code, raw, StringComparison.OrdinalIgnoreCase));
        if (byCode != null) return byCode.Code;

        // Exact name match
        var byName = Categories.FirstOrDefault(c => Normalize(c.Name) == norm);
        if (byName != null) return byName.Code;

        // Common keyword / legacy text mappings
        if (norm.Contains("it") || norm.Contains("phan mem") || norm.Contains("lap trinh") || norm.Contains("software") || norm.Contains("developer") || norm.Contains("cong nghe thong tin"))
            return "cong-nghe-thong-tin";

        if (norm.Contains("ke toan") || norm.Contains("kiem toan") || norm.Contains("accounting") || norm.Contains("audit"))
            return "ke-toan-kiem-toan";

        if (norm.Contains("ban hang") || norm.Contains("kinh doanh") || norm.Contains("sales") || norm.Contains("sale"))
            return "kinh-doanh-ban-hang";

        if (norm.Contains("marketing") || norm.Contains("truyen thong") || norm.Contains("quang cao") || norm.Contains("pr") || norm.Contains("seo"))
            return "marketing-truyen-thong";

        if (norm.Contains("nhan su") || norm.Contains("tuyen dung") || norm.Contains("hr") || norm.Contains("recruitment"))
            return "nhan-su-tuyen-dung";

        if (norm.Contains("tai chinh") || norm.Contains("ngan hang") || norm.Contains("chuan khoan") || norm.Contains("finance") || norm.Contains("bank"))
            return "ngan-hang-tai-chinh";

        if (norm.Contains("hanh chinh") || norm.Contains("van phong") || norm.Contains("thu ky") || norm.Contains("admin"))
            return "hanh-chinh-van-phong";

        if (norm.Contains("cham soc khach hang") || norm.Contains("dich vu khach hang") || norm.Contains("cskh") || norm.Contains("customer service"))
            return "dich-vu-khach-hang";

        if (norm.Contains("bat dong san") || norm.Contains("nha dat") || norm.Contains("real estate"))
            return "bat-dong-san";

        if (norm.Contains("xay dung") || norm.Contains("kien truc") || norm.Contains("noi that"))
            return "xay-dung-kien-truc";

        if (norm.Contains("co khi") || norm.Contains("che tao") || norm.Contains("tu dong hoa"))
            return "co-khi-che-tao";

        if (norm.Contains("dien") || norm.Contains("dien tu") || norm.Contains("vien thong"))
            return "dien-dien-tu-vien-thong";

        if (norm.Contains("giao duc") || norm.Contains("dao tao") || norm.Contains("giang vien") || norm.Contains("giao vien"))
            return "giao-duc-dao-tao";

        if (norm.Contains("du lich") || norm.Contains("su kien") || norm.Contains("huong dan vien"))
            return "du-lich-su-kien";

        if (norm.Contains("nha hang") || norm.Contains("khach san") || norm.Contains("am thuc") || norm.Contains("bep"))
            return "nha-hang-khach-san";

        if (norm.Contains("y te") || norm.Contains("duoc") || norm.Contains("bac si") || norm.Contains("dieu duong"))
            return "y-te-duoc";

        if (norm.Contains("van tai") || norm.Contains("kho van") || norm.Contains("logistics") || norm.Contains("giao nhan"))
            return "van-tai-kho-van-logistics";

        if (norm.Contains("xuat nhap khau") || norm.Contains("ngoai thuong") || norm.Contains("import") || norm.Contains("export"))
            return "xuat-nhap-khau";

        if (norm.Contains("thiet ke") || norm.Contains("do hoa") || norm.Contains("ui ux") || norm.Contains("graphic"))
            return "thiet-ke-sang-tao";

        // Partial match against categories
        foreach (var c in Categories)
        {
            var parts = Normalize(c.Name).Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var part in parts)
            {
                var cleanPart = part.Trim();
                if (cleanPart.Length >= 4 && norm.Contains(cleanPart))
                    return c.Code;
            }
        }

        return null;
    }

    private static List<ProvinceItem> LoadProvinces()
    {
        try
        {
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Reference", "vn-provinces.json");
            if (!File.Exists(path))
            {
                var asmLoc = Path.GetDirectoryName(typeof(AdministrativeReference).Assembly.Location) ?? string.Empty;
                path = Path.Combine(asmLoc, "Reference", "vn-provinces.json");
            }

            if (File.Exists(path))
            {
                var json = File.ReadAllText(path);
                var items = JsonSerializer.Deserialize<List<ProvinceItem>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (items != null && items.Count > 0) return items;
            }
        }
        catch
        {
            // Fallback to static in-memory list
        }

        return GetFallbackProvinces();
    }

    private static List<JobCategoryItem> LoadCategories()
    {
        try
        {
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Reference", "job-categories.json");
            if (!File.Exists(path))
            {
                var asmLoc = Path.GetDirectoryName(typeof(AdministrativeReference).Assembly.Location) ?? string.Empty;
                path = Path.Combine(asmLoc, "Reference", "job-categories.json");
            }

            if (File.Exists(path))
            {
                var json = File.ReadAllText(path);
                var items = JsonSerializer.Deserialize<List<JobCategoryItem>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (items != null && items.Count > 0) return items;
            }
        }
        catch
        {
            // Fallback
        }

        return GetFallbackCategories();
    }

    private static List<ProvinceItem> GetFallbackProvinces() => new()
    {
        new("ha-noi", "Hà Nội", "city", new(), new() { "hn", "hà nội", "ha noi", "hanoi" }),
        new("ho-chi-minh", "TP. Hồ Chí Minh", "city", new() { "Bình Dương", "Bà Rịa – Vũng Tàu", "Bà Rịa - Vũng Tàu", "Bà Rịa Vũng Tàu" }, new() { "hcm", "tp.hcm", "tp. hcm", "tp hcm", "tphcm", "sài gòn", "saigon", "hồ chí minh", "ho chi minh", "hcmc", "binh duong", "ba ria vung tau" }),
        new("hai-phong", "Hải Phòng", "city", new() { "Hải Dương" }, new() { "hp", "hải phòng", "hai phong", "haiphong", "hải dương", "hai duong" }),
        new("da-nang", "Đà Nẵng", "city", new() { "Quảng Nam" }, new() { "dn", "đà nẵng", "da nang", "danang", "quảng nam", "quang nam" }),
        new("can-tho", "Cần Thơ", "city", new() { "Sóc Trăng", "Hậu Giang" }, new() { "ct", "cần thơ", "can tho", "cantho", "sóc trăng", "soc trang", "hậu giang", "hau giang" }),
        new("hue", "Huế", "city", new() { "Thừa Thiên Huế" }, new() { "huế", "hue", "thừa thiên huế", "thua thien hue", "tth" }),
        new("an-giang", "An Giang", "province", new() { "Kiên Giang" }, new() { "an giang", "kiên giang", "kien giang", "long xuyên", "rạch giá", "phú quốc" }),
        new("bac-ninh", "Bắc Ninh", "province", new() { "Bắc Giang" }, new() { "bắc ninh", "bac ninh", "bắc giang", "bac giang" }),
        new("ca-mau", "Cà Mau", "province", new() { "Bạc Liêu" }, new() { "cà mau", "ca mau", "bạc liêu", "bac lieu" }),
        new("cao-bang", "Cao Bằng", "province", new(), new() { "cao bằng", "cao bang" }),
        new("dak-lak", "Đắk Lắk", "province", new() { "Phú Yên" }, new() { "đắk lắk", "dak lak", "đắc lắc", "dac lac", "buôn ma thuột", "phú yên", "phu yen", "tuy hòa" }),
        new("dien-bien", "Điện Biên", "province", new(), new() { "điện biên", "dien bien", "điện biên phủ" }),
        new("dong-nai", "Đồng Nai", "province", new() { "Bình Phước" }, new() { "đồng nai", "dong nai", "biên hòa", "bình phước", "binh phuoc", "đồng xoài" }),
        new("dong-thap", "Đồng Tháp", "province", new() { "Tiền Giang" }, new() { "đồng tháp", "dong thap", "cao lãnh", "sa đéc", "tiền giang", "tien giang", "mỹ tho" }),
        new("gia-lai", "Gia Lai", "province", new() { "Bình Định" }, new() { "gia lai", "pleiku", "bình định", "binh dinh", "quy nhơn" }),
        new("ha-tinh", "Hà Tĩnh", "province", new(), new() { "hà tĩnh", "ha tinh" }),
        new("hung-yen", "Hưng Yên", "province", new() { "Thái Bình" }, new() { "hưng yên", "hung yen", "thái bình", "thai binh" }),
        new("khanh-hoa", "Khánh Hòa", "province", new() { "Ninh Thuận" }, new() { "khánh hòa", "khanh hoa", "nha trang", "cam ranh", "ninh thuận", "ninh thuan", "phan rang" }),
        new("lai-chau", "Lai Châu", "province", new(), new() { "lai châu", "lai chau" }),
        new("lam-dong", "Lâm Đồng", "province", new() { "Đắk Nông", "Bình Thuận" }, new() { "lâm đồng", "lam dong", "đà lạt", "da lat", "bảo lộc", "đắk nông", "dak nong", "gia nghĩa", "bình thuận", "binh thuan", "phan thiết" }),
        new("lang-son", "Lạng Sơn", "province", new(), new() { "lạng sơn", "lang son" }),
        new("lao-cai", "Lào Cai", "province", new() { "Yên Bái" }, new() { "lào cai", "lao cai", "sa pa", "sapa", "yên bái", "yen bai" }),
        new("nghe-an", "Nghệ An", "province", new(), new() { "nghe an", "nghệ an", "vinh" }),
        new("ninh-binh", "Ninh Bình", "province", new() { "Hà Nam", "Nam Định" }, new() { "ninh bình", "ninh binh", "hà nam", "ha nam", "phủ lý", "nam định", "nam dinh" }),
        new("phu-tho", "Phú Thọ", "province", new() { "Vĩnh Phúc", "Hòa Bình" }, new() { "phú thọ", "phu tho", "việt trì", "vĩnh phúc", "vinh phuc", "vĩnh yên", "hòa bình", "hoa binh" }),
        new("quang-ngai", "Quảng Ngãi", "province", new() { "Kon Tum" }, new() { "quảng ngãi", "quang ngai", "kon tum" }),
        new("quang-ninh", "Quảng Ninh", "province", new(), new() { "quảng ninh", "quang ninh", "hạ long", "ha long", "cẩm phả", "móng cái" }),
        new("quang-tri", "Quảng Trị", "province", new() { "Quảng Bình" }, new() { "quảng trị", "quang tri", "đông hà", "quảng bình", "quang binh", "đồng hới" }),
        new("son-la", "Sơn La", "province", new(), new() { "sơn la", "son la", "mộc châu" }),
        new("tay-ninh", "Tây Ninh", "province", new() { "Long An" }, new() { "tây ninh", "tay ninh", "long an", "tân an" }),
        new("thai-nguyen", "Thái Nguyên", "province", new() { "Bắc Kạn" }, new() { "thái nguyên", "thai nguyen", "bắc kạn", "bac kan" }),
        new("thanh-hoa", "Thanh Hóa", "province", new(), new() { "thanh hóa", "thanh hoa", "sầm sơn" }),
        new("tuyen-quang", "Tuyên Quang", "province", new() { "Hà Giang" }, new() { "tuyên quang", "tuyen quang", "hà giang", "ha giang" }),
        new("vinh-long", "Vĩnh Long", "province", new() { "Bến Tre", "Trà Vinh" }, new() { "vĩnh long", "vinh long", "bến tre", "ben tre", "trà vinh", "tra vinh" })
    };

    private static List<JobCategoryItem> GetFallbackCategories() => new()
    {
        new("ban-le-tieu-dung-tmdt", "Bán lẻ / Hàng tiêu dùng / Thương mại điện tử"),
        new("bao-hiem", "Bảo hiểm"),
        new("bao-ve-dich-vu-toa-nha", "Bảo vệ / Dịch vụ tòa nhà"),
        new("bien-phien-dich", "Biên / Phiên dịch / Ngoại ngữ"),
        new("bat-dong-san", "Bất động sản"),
        new("co-khi-che-tao", "Cơ khí / Chế tạo / Tự động hóa"),
        new("cong-nghe-thong-tin", "Công nghệ thông tin / Phần mềm"),
        new("dau-khi-nang-luong", "Dầu khí / Năng lượng / Khoáng sản"),
        new("det-may-da-giay", "Dệt may / Da giày / Thời trang"),
        new("dich-vu-khach-hang", "Dịch vụ khách hàng"),
        new("dien-dien-tu-vien-thong", "Điện / Điện tử / Viễn thông"),
        new("du-lich-su-kien", "Du lịch / Lữ hành / Sự kiện"),
        new("giao-duc-dao-tao", "Giáo dục / Đào tạo / Nghiên cứu"),
        new("hanh-chinh-van-phong", "Hành chính / Văn phòng / Thư ký"),
        new("hoa-chat-sinh-hoc-moi-truong", "Hóa chất / Sinh học / Môi trường"),
        new("ke-toan-kiem-toan", "Kế toán / Kiểm toán"),
        new("kinh-doanh-ban-hang", "Kinh doanh / Bán hàng"),
        new("lao-dong-pho-thong", "Lao động phổ thông / Thời vụ"),
        new("marketing-truyen-thong", "Marketing / Truyền thông / Quảng cáo"),
        new("ngan-hang-tai-chinh", "Ngân hàng / Tài chính / Chứng khoán"),
        new("nhan-su-tuyen-dung", "Nhân sự / Tuyển dụng"),
        new("nha-hang-khach-san", "Nhà hàng / Khách sạn / Ẩm thực"),
        new("nong-lam-ngu", "Nông / Lâm / Ngư nghiệp / Thú y"),
        new("o-to-xe-may", "Ô tô / Xe máy / Dịch vụ kỹ thuật"),
        new("phap-ly", "Pháp lý / Luật"),
        new("phi-loi-nhuan", "Phi chính phủ / Phi lợi nhuận"),
        new("san-xuat-van-hanh", "Sản xuất / Vận hành / QA-QC"),
        new("thiet-ke-sang-tao", "Thiết kế / Mỹ thuật / Sáng tạo"),
        new("thuc-pham-do-uong", "Thực phẩm / Đồ uống"),
        new("tu-van-quan-ly-du-an", "Tư vấn / Quản lý dự án"),
        new("van-tai-kho-van-logistics", "Vận tải / Kho vận / Logistics"),
        new("bao-chi-noi-dung-xuat-ban", "Báo chí / Biên tập / Xuất bản"),
        new("xay-dung-kien-truc", "Xây dựng / Kiến trúc / Nội thất"),
        new("xuat-nhap-khau", "Xuất nhập khẩu / Ngoại thương"),
        new("y-te-duoc", "Y tế / Dược / Chăm sóc sức khỏe"),
        new("khac", "Khác")
    };
}
