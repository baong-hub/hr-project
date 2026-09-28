using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HR.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProvinceAndCategoryCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP PROCEDURE IF EXISTS AddColIfNotExist;
CREATE PROCEDURE AddColIfNotExist()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'category_code') THEN
        ALTER TABLE `jobs` ADD `category_code` varchar(60) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'province_code') THEN
        ALTER TABLE `jobs` ADD `province_code` varchar(40) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'industry_code') THEN
        ALTER TABLE `companies` ADD `industry_code` varchar(60) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'province_code') THEN
        ALTER TABLE `companies` ADD `province_code` varchar(40) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_jobs_category_code') THEN
        ALTER TABLE `jobs` ADD INDEX `idx_jobs_category_code` (`category_code`);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_jobs_province_code') THEN
        ALTER TABLE `jobs` ADD INDEX `idx_jobs_province_code` (`province_code`);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND INDEX_NAME = 'idx_companies_industry_code') THEN
        ALTER TABLE `companies` ADD INDEX `idx_companies_industry_code` (`industry_code`);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND INDEX_NAME = 'idx_companies_province_code') THEN
        ALTER TABLE `companies` ADD INDEX `idx_companies_province_code` (`province_code`);
    END IF;
END;
CALL AddColIfNotExist();
DROP PROCEDURE IF EXISTS AddColIfNotExist;
");

            // Backfill province_code on jobs
            migrationBuilder.Sql(@"
UPDATE jobs SET province_code = 'ho-chi-minh' WHERE province_code IS NULL AND (LOWER(city) LIKE '%hồ chí minh%' OR LOWER(city) LIKE '%ho chi minh%' OR LOWER(city) LIKE '%tp.hcm%' OR LOWER(city) LIKE '%tphcm%' OR LOWER(city) LIKE '%sài gòn%' OR LOWER(city) LIKE '%sai gon%' OR LOWER(city) LIKE '%bình dương%' OR LOWER(city) LIKE '%binh duong%' OR LOWER(city) LIKE '%bà rịa%' OR LOWER(city) LIKE '%ba ria%' OR LOWER(city) LIKE '%vũng tàu%' OR LOWER(city) LIKE '%vung tau%');
UPDATE jobs SET province_code = 'ha-noi' WHERE province_code IS NULL AND (LOWER(city) LIKE '%hà nội%' OR LOWER(city) LIKE '%ha noi%' OR LOWER(city) = 'hn' OR LOWER(city) LIKE '%hanoi%');
UPDATE jobs SET province_code = 'da-nang' WHERE province_code IS NULL AND (LOWER(city) LIKE '%đà nẵng%' OR LOWER(city) LIKE '%da nang%' OR LOWER(city) = 'đn' OR LOWER(city) = 'dn' OR LOWER(city) LIKE '%quảng nam%' OR LOWER(city) LIKE '%quang nam%');
UPDATE jobs SET province_code = 'hai-phong' WHERE province_code IS NULL AND (LOWER(city) LIKE '%hải phòng%' OR LOWER(city) LIKE '%hai phong%' OR LOWER(city) = 'hp' OR LOWER(city) LIKE '%hải dương%' OR LOWER(city) LIKE '%hai duong%');
UPDATE jobs SET province_code = 'can-tho' WHERE province_code IS NULL AND (LOWER(city) LIKE '%cần thơ%' OR LOWER(city) LIKE '%can tho%' OR LOWER(city) = 'ct' OR LOWER(city) LIKE '%sóc trăng%' OR LOWER(city) LIKE '%soc trang%' OR LOWER(city) LIKE '%hậu giang%' OR LOWER(city) LIKE '%hau giang%');
UPDATE jobs SET province_code = 'hue' WHERE province_code IS NULL AND (LOWER(city) LIKE '%huế%' OR LOWER(city) LIKE '%hue%' OR LOWER(city) LIKE '%thừa thiên%');
UPDATE jobs SET province_code = 'dong-nai' WHERE province_code IS NULL AND (LOWER(city) LIKE '%đồng nai%' OR LOWER(city) LIKE '%dong nai%' OR LOWER(city) LIKE '%bình phước%' OR LOWER(city) LIKE '%binh phuoc%');
UPDATE jobs SET province_code = 'bac-ninh' WHERE province_code IS NULL AND (LOWER(city) LIKE '%bắc ninh%' OR LOWER(city) LIKE '%bac ninh%' OR LOWER(city) LIKE '%bắc giang%' OR LOWER(city) LIKE '%bac giang%');
UPDATE jobs SET province_code = 'khanh-hoa' WHERE province_code IS NULL AND (LOWER(city) LIKE '%khánh hòa%' OR LOWER(city) LIKE '%khanh hoa%' OR LOWER(city) LIKE '%nha trang%' OR LOWER(city) LIKE '%ninh thuận%');
UPDATE jobs SET province_code = 'lam-dong' WHERE province_code IS NULL AND (LOWER(city) LIKE '%lâm đồng%' OR LOWER(city) LIKE '%lam dong%' OR LOWER(city) LIKE '%đà lạt%' OR LOWER(city) LIKE '%đắk nông%' OR LOWER(city) LIKE '%bình thuận%');
UPDATE jobs SET province_code = 'dak-lak' WHERE province_code IS NULL AND (LOWER(city) LIKE '%đắk lắk%' OR LOWER(city) LIKE '%dak lak%' OR LOWER(city) LIKE '%buôn ma thuột%' OR LOWER(city) LIKE '%phú yên%');
UPDATE jobs SET province_code = 'ninh-binh' WHERE province_code IS NULL AND (LOWER(city) LIKE '%ninh bình%' OR LOWER(city) LIKE '%hà nam%' OR LOWER(city) LIKE '%nam định%');
UPDATE jobs SET province_code = 'phu-tho' WHERE province_code IS NULL AND (LOWER(city) LIKE '%phú thọ%' OR LOWER(city) LIKE '%vĩnh phúc%' OR LOWER(city) LIKE '%hòa bình%');
UPDATE jobs SET province_code = 'tay-ninh' WHERE province_code IS NULL AND (LOWER(city) LIKE '%tây ninh%' OR LOWER(city) LIKE '%long an%');
UPDATE jobs SET province_code = 'thai-nguyen' WHERE province_code IS NULL AND (LOWER(city) LIKE '%thái nguyên%' OR LOWER(city) LIKE '%bắc kạn%');
UPDATE jobs SET province_code = 'hung-yen' WHERE province_code IS NULL AND (LOWER(city) LIKE '%hưng yên%' OR LOWER(city) LIKE '%thái bình%');
UPDATE jobs SET province_code = 'an-giang' WHERE province_code IS NULL AND (LOWER(city) LIKE '%an giang%' OR LOWER(city) LIKE '%kiên giang%');
UPDATE jobs SET province_code = 'quang-ninh' WHERE province_code IS NULL AND (LOWER(city) LIKE '%quảng ninh%' OR LOWER(city) LIKE '%hạ long%');
UPDATE jobs SET province_code = 'thanh-hoa' WHERE province_code IS NULL AND (LOWER(city) LIKE '%thanh hóa%' OR LOWER(city) LIKE '%thanh hoa%');
UPDATE jobs SET province_code = 'nghe-an' WHERE province_code IS NULL AND (LOWER(city) LIKE '%nghệ an%' OR LOWER(city) LIKE '%nghe an%' OR LOWER(city) LIKE '%vinh%');
UPDATE jobs SET province_code = 'vinh-long' WHERE province_code IS NULL AND (LOWER(city) LIKE '%vĩnh long%' OR LOWER(city) LIKE '%bến tre%' OR LOWER(city) LIKE '%trà vinh%');
UPDATE jobs SET province_code = 'dong-thap' WHERE province_code IS NULL AND (LOWER(city) LIKE '%đồng tháp%' OR LOWER(city) LIKE '%tiền giang%');

-- Backfill category_code on jobs
UPDATE jobs SET category_code = 'cong-nghe-thong-tin' WHERE category_code IS NULL AND (LOWER(category) LIKE '%it%' OR LOWER(category) LIKE '%phần mềm%' OR LOWER(category) LIKE '%phần c%' OR LOWER(category) LIKE '%software%' OR LOWER(category) LIKE '%lập trình%' OR LOWER(category) LIKE '%công nghệ thông tin%');
UPDATE jobs SET category_code = 'ke-toan-kiem-toan' WHERE category_code IS NULL AND (LOWER(category) LIKE '%kế toán%' OR LOWER(category) LIKE '%kiểm toán%' OR LOWER(category) LIKE '%ke toan%' OR LOWER(category) LIKE '%account%');
UPDATE jobs SET category_code = 'kinh-doanh-ban-hang' WHERE category_code IS NULL AND (LOWER(category) LIKE '%kinh doanh%' OR LOWER(category) LIKE '%bán hàng%' OR LOWER(category) LIKE '%sales%' OR LOWER(category) LIKE '%sale%');
UPDATE jobs SET category_code = 'marketing-truyen-thong' WHERE category_code IS NULL AND (LOWER(category) LIKE '%marketing%' OR LOWER(category) LIKE '%truyền thông%' OR LOWER(category) LIKE '%quảng cáo%' OR LOWER(category) LIKE '%pr%');
UPDATE jobs SET category_code = 'nhan-su-tuyen-dung' WHERE category_code IS NULL AND (LOWER(category) LIKE '%nhân sự%' OR LOWER(category) LIKE '%tuyển dụng%' OR LOWER(category) LIKE '%hr%');
UPDATE jobs SET category_code = 'ngan-hang-tai-chinh' WHERE category_code IS NULL AND (LOWER(category) LIKE '%ngân hàng%' OR LOWER(category) LIKE '%tài chính%' OR LOWER(category) LIKE '%chứng khoán%' OR LOWER(category) LIKE '%finance%' OR LOWER(category) LIKE '%banking%');
UPDATE jobs SET category_code = 'thiet-ke-sang-tao' WHERE category_code IS NULL AND (LOWER(category) LIKE '%thiết kế%' OR LOWER(category) LIKE '%design%' OR LOWER(category) LIKE '%ui%' OR LOWER(category) LIKE '%ux%' OR LOWER(category) LIKE '%đồ họa%');
UPDATE jobs SET category_code = 'ban-le-tieu-dung-tmdt' WHERE category_code IS NULL AND (LOWER(category) LIKE '%bán lẻ%' OR LOWER(category) LIKE '%tiêu dùng%' OR LOWER(category) LIKE '%tmdt%' OR LOWER(category) LIKE '%thương mại điện tử%' OR LOWER(category) LIKE '%retail%');
UPDATE jobs SET category_code = 'dich-vu-khach-hang' WHERE category_code IS NULL AND (LOWER(category) LIKE '%dịch vụ khách hàng%' OR LOWER(category) LIKE '%chăm sóc khách hàng%' OR LOWER(category) LIKE '%cskh%' OR LOWER(category) LIKE '%customer service%');
UPDATE jobs SET category_code = 'hanh-chinh-van-phong' WHERE category_code IS NULL AND (LOWER(category) LIKE '%hành chính%' OR LOWER(category) LIKE '%văn phòng%' OR LOWER(category) LIKE '%admin%' OR LOWER(category) LIKE '%thư ký%');
UPDATE jobs SET category_code = 'giao-duc-dao-tao' WHERE category_code IS NULL AND (LOWER(category) LIKE '%giáo dục%' OR LOWER(category) LIKE '%đào tạo%' OR LOWER(category) LIKE '%nghiên cứu%' OR LOWER(category) LIKE '%teacher%' OR LOWER(category) LIKE '%giảng viên%');
UPDATE jobs SET category_code = 'bat-dong-san' WHERE category_code IS NULL AND (LOWER(category) LIKE '%bất động sản%' OR LOWER(category) LIKE '%nhà đất%' OR LOWER(category) LIKE '%real estate%');
UPDATE jobs SET category_code = 'van-tai-kho-van-logistics' WHERE category_code IS NULL AND (LOWER(category) LIKE '%vận tải%' OR LOWER(category) LIKE '%kho vận%' OR LOWER(category) LIKE '%logistics%' OR LOWER(category) LIKE '%supply chain%');
UPDATE jobs SET category_code = 'xuat-nhap-khau' WHERE category_code IS NULL AND (LOWER(category) LIKE '%xuất nhập khẩu%' OR LOWER(category) LIKE '%ngoại thương%' OR LOWER(category) LIKE '%import%' OR LOWER(category) LIKE '%export%');
UPDATE jobs SET category_code = 'y-te-duoc' WHERE category_code IS NULL AND (LOWER(category) LIKE '%y tế%' OR LOWER(category) LIKE '%dược%' OR LOWER(category) LIKE '%pharma%' OR LOWER(category) LIKE '%bác sĩ%' OR LOWER(category) LIKE '%sức khỏe%');
UPDATE jobs SET category_code = 'xay-dung-kien-truc' WHERE category_code IS NULL AND (LOWER(category) LIKE '%xây dựng%' OR LOWER(category) LIKE '%kiến trúc%' OR LOWER(category) LIKE '%nội thất%' OR LOWER(category) LIKE '%construction%');
UPDATE jobs SET category_code = 'co-khi-che-tao' WHERE category_code IS NULL AND (LOWER(category) LIKE '%cơ khí%' OR LOWER(category) LIKE '%chế tạo%' OR LOWER(category) LIKE '%tự động hóa%' OR LOWER(category) LIKE '%mechanical%');
UPDATE jobs SET category_code = 'dien-dien-tu-vien-thong' WHERE category_code IS NULL AND (LOWER(category) LIKE '%điện tử%' OR LOWER(category) LIKE '%viễn thông%' OR LOWER(category) LIKE '%điện%' OR LOWER(category) LIKE '%telecom%');
UPDATE jobs SET category_code = 'san-xuat-van-hanh' WHERE category_code IS NULL AND (LOWER(category) LIKE '%sản xuất%' OR LOWER(category) LIKE '%vận hành%' OR LOWER(category) LIKE '%qa%' OR LOWER(category) LIKE '%qc%');
UPDATE jobs SET category_code = 'nha-hang-khach-san' WHERE category_code IS NULL AND (LOWER(category) LIKE '%nhà hàng%' OR LOWER(category) LIKE '%khách sạn%' OR LOWER(category) LIKE '%ẩm thực%' OR LOWER(category) LIKE '%f&b%' OR LOWER(category) LIKE '%hotel%');
UPDATE jobs SET category_code = 'du-lich-su-kien' WHERE category_code IS NULL AND (LOWER(category) LIKE '%du lịch%' OR LOWER(category) LIKE '%lữ hành%' OR LOWER(category) LIKE '%sự kiện%' OR LOWER(category) LIKE '%tour%');
UPDATE jobs SET category_code = 'bien-phien-dich' WHERE category_code IS NULL AND (LOWER(category) LIKE '%phiên dịch%' OR LOWER(category) LIKE '%biên dịch%' OR LOWER(category) LIKE '%ngoại ngữ%' OR LOWER(category) LIKE '%tiếng anh%' OR LOWER(category) LIKE '%tiếng nhật%');
UPDATE jobs SET category_code = 'phap-ly' WHERE category_code IS NULL AND (LOWER(category) LIKE '%pháp lý%' OR LOWER(category) LIKE '%luật%' OR LOWER(category) LIKE '%legal%');
UPDATE jobs SET category_code = 'bao-hiem' WHERE category_code IS NULL AND (LOWER(category) LIKE '%bảo hiểm%' OR LOWER(category) LIKE '%insurance%');

-- Backfill company province_code and industry_code if address/industry exists
UPDATE companies SET province_code = 'ho-chi-minh' WHERE province_code IS NULL AND (LOWER(address) LIKE '%hồ chí minh%' OR LOWER(address) LIKE '%ho chi minh%' OR LOWER(address) LIKE '%tp.hcm%' OR LOWER(address) LIKE '%bình dương%' OR LOWER(address) LIKE '%bà rịa%');
UPDATE companies SET province_code = 'ha-noi' WHERE province_code IS NULL AND (LOWER(address) LIKE '%hà nội%' OR LOWER(address) LIKE '%ha noi%');
UPDATE companies SET province_code = 'da-nang' WHERE province_code IS NULL AND (LOWER(address) LIKE '%đà nẵng%' OR LOWER(address) LIKE '%da nang%');
UPDATE companies SET industry_code = 'cong-nghe-thong-tin' WHERE industry_code IS NULL AND (LOWER(industry) LIKE '%it%' OR LOWER(industry) LIKE '%phần mềm%' OR LOWER(industry) LIKE '%software%' OR LOWER(industry) LIKE '%công nghệ thông tin%');
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_jobs_category_code",
                table: "jobs");

            migrationBuilder.DropIndex(
                name: "idx_jobs_province_code",
                table: "jobs");

            migrationBuilder.DropIndex(
                name: "idx_companies_industry_code",
                table: "companies");

            migrationBuilder.DropIndex(
                name: "idx_companies_province_code",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "category_code",
                table: "jobs");

            migrationBuilder.DropColumn(
                name: "province_code",
                table: "jobs");

            migrationBuilder.DropColumn(
                name: "industry_code",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "province_code",
                table: "companies");
        }
    }
}
