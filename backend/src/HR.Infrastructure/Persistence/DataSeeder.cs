using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HR.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context, 
        Microsoft.Extensions.Configuration.IConfiguration? configuration = null, 
        Microsoft.Extensions.Hosting.IHostEnvironment? environment = null)
    {
        await context.Database.MigrateAsync();
        await SeedCompaniesAsync(context);
        await SeedSitesAsync(context);
        await SeedRoleLevelsAsync(context);
        await SeedRolesAndPermissionsAsync(context);
        await SeedAdminUserAsync(context, configuration, environment);
        await SeedSettingConfigsAsync(context);
        await SeedJobsAsync(context);
        await SeedJobViewLogsAsync(context);
        await SeedMasterDataAsync(context);
        await SeedDepartmentsAsync(context);
        await SeedArticlesAsync(context);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCompaniesAsync(ApplicationDbContext context)
    {
        var defaultCompanies = new List<Company>
        {
            new Company
            {
                Code = "HR",
                Name = "HỆ THỐNG TÌM VIỆC & TUYỂN DỤNG HR",
                Description = "Cổng thông tin việc làm và quản lý tuyển dụng doanh nghiệp hàng đầu Việt Nam",
                Industry = "Công nghệ thông tin",
                IndustryCode = "IT",
                SizeRange = "100-500 nhân viên",
                Address = "Tòa nhà HR Building, Duy Tân, Cầu Giấy, Hà Nội",
                AddressList = "Hà Nội, TP. Hồ Chí Minh",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80"
            },
            new Company
            {
                Code = "FPT",
                Name = "Tập đoàn FPT (FPT Corporation)",
                Description = "FPT là tập đoàn công nghệ thông tin và viễn thông hàng đầu Việt Nam, tiên phong trong chuyển đổi số, trí tuệ nhân tạo (AI) và xuất khẩu phần mềm toàn cầu.",
                Industry = "Công nghệ thông tin",
                IndustryCode = "IT",
                SizeRange = "10,000+ nhân viên",
                Address = "Tòa nhà FPT Tower, 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội",
                AddressList = "Hà Nội, TP. HCM, Đà Nẵng, Quy Nhơn",
                Website = "https://fpt.com.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Lương thưởng tháng 13, thưởng dự án & thưởng hiệu quả kinh doanh.\n- Chăm sóc sức khỏe FPT Care cho bản thân và người thân.\n- Cơ hội làm việc Onsite tại Nhật Bản, Mỹ, Châu Âu, Singapore."
            },
            new Company
            {
                Code = "VIETTEL",
                Name = "Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)",
                Description = "Viettel là tập đoàn viễn thông và công nghệ lớn nhất Việt Nam, top 50 thương hiệu viễn thông giá trị nhất thế giới với mạng lưới kinh doanh tại 11 quốc gia.",
                Industry = "Viễn thông & Công nghệ",
                IndustryCode = "IT",
                SizeRange = "10,000+ nhân viên",
                Address = "Lô D26 Khu đô thị mới Cầu Giấy, Yên Hòa, Cầu Giấy, Hà Nội",
                AddressList = "Hà Nội, TP. HCM, Đà Nẵng",
                Website = "https://viettel.com.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Thu nhập thuộc top đầu ngành viễn thông & công nghệ.\n- Chế độ bảo hiểm đặc thù ngành, phụ cấp quốc phòng.\n- Môi trường kỷ luật, thách thức và thăng tiến rõ ràng."
            },
            new Company
            {
                Code = "VNG",
                Name = "VNG Corporation (Công ty Cổ phần VNG)",
                Description = "VNG là kỳ lân công nghệ đầu tiên của Việt Nam với sinh thái sản phẩm Zalo, VNGGames, ZaloPay và VNG Cloud phục vụ hàng chục triệu người dùng.",
                Industry = "Công nghệ & Giải trí số",
                IndustryCode = "IT",
                SizeRange = "1000-5000 nhân viên",
                Address = "VNG Campus, Z06 Đường 13, KCX Tân Thuận, Quận 7, TP. HCM",
                AddressList = "TP. HCM, Hà Nội, Đà Nẵng",
                Website = "https://vng.com.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Khu văn phòng đẳng cấp Silicon Valley với phòng Gym, Bể bơi, Căng tin 5 sao miễn phí.\n- Gói bảo hiểm sức khỏe VIP toàn diện.\n- Văn hóa cởi mở, sáng tạo và nhiều cơ hội thăng tiến."
            },
            new Company
            {
                Code = "TCB",
                Name = "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)",
                Description = "Techcombank là một trong những ngân hàng thương mại cổ phần hàng đầu Việt Nam, tiên phong trong chuyển đổi số ngân hàng (Digital Banking & Cloud).",
                Industry = "Tài chính - Ngân hàng",
                IndustryCode = "FINANCE",
                SizeRange = "5000-10,000 nhân viên",
                Address = "Số 6 Quang Trung, Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
                AddressList = "Hà Nội, TP. HCM, Đà Nẵng",
                Website = "https://techcombank.com.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1541359927273-d76820fc43f9?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Thưởng kinh doanh theo hiệu suất công việc xuất sắc (4-6 tháng lương/năm).\n- Ưu đãi lãi suất vay mua nhà/xe dành riêng cho cán bộ nhân viên.\n- Môi trường ngân hàng chuẩn quốc tế."
            },
            new Company
            {
                Code = "MOMO",
                Name = "MoMo (M-Service Corporation)",
                Description = "MoMo là siêu ứng dụng tài chính số 1 Việt Nam với hơn 31 triệu người dùng, dẫn đầu mảng thanh toán điện tử, tín dụng tiêu dùng và công nghệ tài chính.",
                Industry = "Fintech / Công nghệ tài chính",
                IndustryCode = "FINANCE",
                SizeRange = "1000-5000 nhân viên",
                Address = "Lầu 6, Tòa nhà Phú Mỹ Hưng, 8 Hoàng Văn Thái, Quận 7, TP. HCM",
                AddressList = "TP. HCM, Hà Nội",
                Website = "https://momo.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Thưởng ESOP cho nhân sự xuất sắc.\n- Máy tính Macbook Pro / Dell XPS mới 100% khi nhận việc.\n- Môi trường làm việc trẻ trung, linh hoạt, nhiều hoạt động Teambuilding."
            },
            new Company
            {
                Code = "SHOPEE",
                Name = "Shopee Vietnam (Công ty TNHH Shopee)",
                Description = "Shopee là sàn thương mại điện tử hàng đầu tại Đông Nam Á và Đài Loan, cung cấp trải nghiệm mua sắm trực tuyến mượt mà, tiện lợi cho hàng triệu khách hàng.",
                Industry = "Thương mại điện tử",
                IndustryCode = "SALES",
                SizeRange = "1000-5000 nhân viên",
                Address = "Tầng 17, Tòa nhà Saigon Centre Tower 2, 67 Lê Lợi, Quận 1, TP. HCM",
                AddressList = "TP. HCM, Hà Nội",
                Website = "https://shopee.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1556742049-0a670fc8077a?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Mức lương cạnh tranh hàng đầu ngành E-Commerce.\n- Phụ cấp ăn trưa, quà tặng các dịp lễ tết và sự kiện lớn.\n- Cơ hội thăng tiến nhanh theo năng lực thực tế."
            },
            new Company
            {
                Code = "VINGROUP",
                Name = "Tập đoàn Vingroup (Vinhomes / VinFast / Vinpearl)",
                Description = "Vingroup là tập đoàn kinh tế tư nhân đa ngành lớn nhất Việt Nam, hoạt động trong các lĩnh vực Công nghệ - Công nghiệp (VinFast), Thương mại Dịch vụ (Vinhomes, Vinpearl).",
                Industry = "Đa ngành / Bất động sản / Ô tô",
                IndustryCode = "CONSTRUCTION",
                SizeRange = "10,000+ nhân viên",
                Address = "Số 7 Đường Bằng Lăng 1, KĐT Vinhomes Riverside, Long Biên, Hà Nội",
                AddressList = "Hà Nội, TP. HCM, Hải Phòng, Nha Trang, Phú Quốc",
                Website = "https://vingroup.net",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Mức lương thưởng siêu hấp dẫn, chính sách đãi ngộ hàng đầu.\n- Chiết khấu ưu đãi khi mua nhà Vinhomes, ô tô VinFast, nghỉ dưỡng Vinpearl.\n- Cơ hội kiến tạo những dự án mang tầm vóc quốc gia và quốc tế."
            },
            new Company
            {
                Code = "SUNGROUP",
                Name = "Tập đoàn Sun Group",
                Description = "Sun Group là tập đoàn hàng đầu Việt Nam trong lĩnh vực Du lịch nghỉ dưỡng, Vui chơi giải trí, Bất động sản cao cấp và Hạ tầng cơ sở với nhiều công trình kỷ luật thế giới.",
                Industry = "Bất động sản & Du lịch nghỉ dưỡng",
                IndustryCode = "HOSPITALITY",
                SizeRange = "5000-10,000 nhân viên",
                Address = "Tòa nhà Sun City, 13 Phố Hai Bà Trưng, Hoàn Kiếm, Hà Nội",
                AddressList = "Hà Nội, Đà Nẵng, Phú Quốc, Quảng Ninh, Sa Pa",
                Website = "https://sungroup.com.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Vé cáp treo & vé vui chơi Sun World miễn phí cho cán bộ nhân viên và gia đình.\n- Gói đãi ngộ du lịch nghỉ dưỡng 5 sao hàng năm.\n- Môi trường làm việc chuyên nghiệp, nhân văn."
            },
            new Company
            {
                Code = "UNILEVER",
                Name = "Unilever Vietnam",
                Description = "Unilever là tập đoàn hàng tiêu dùng nhanh (FMCG) hàng đầu thế giới với các thương hiệu quen thuộc như OMO, Lifebuoy, Sunsilk, Dove, Knorr, Comfort.",
                Industry = "Hàng tiêu dùng nhanh (FMCG)",
                IndustryCode = "MARKETING",
                SizeRange = "1000-5000 nhân viên",
                Address = "Tòa nhà Unilever, 156 Nguyễn Lương Bằng, Quận 7, TP. HCM",
                AddressList = "TP. HCM, Hà Nội",
                Website = "https://unilever.com.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Môi trường làm việc Agile, chuẩn toàn cầu được bình chọn Nơi làm việc tốt nhất Việt Nam.\n- Lương thưởng hấp dẫn, gói sản phẩm Unilever hàng tháng cho nhân viên.\n- Chương trình đào tạo lãnh đạo bài bản."
            },
            new Company
            {
                Code = "MASAN",
                Name = "Tập đoàn Masan (Masan Group)",
                Description = "Masan là tập đoàn bán lẻ & tiêu dùng hàng đầu Việt Nam sở hữu chuỗi WinMart/WinMart+, Chin-su, Nam Ngư, Wake-up 247, MeatDeli và Phúc Long.",
                Industry = "Hàng tiêu dùng & Bán lẻ",
                IndustryCode = "SALES",
                SizeRange = "10,000+ nhân viên",
                Address = "Tầng 8, Tòa nhà Central Plaza, 17 Lê Duẩn, Quận 1, TP. HCM",
                AddressList = "TP. HCM, Hà Nội, Bình Dương",
                Website = "https://masangroup.com",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1542744887-51321027969f?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Thưởng quý & thưởng cuối năm vượt trội.\n- Ưu đãi mua sắm trên toàn hệ thống chuỗi bán lẻ WinMart & Phúc Long.\n- Lộ trình thăng tiến rõ ràng cho nhân tài."
            },
            new Company
            {
                Code = "GRAB",
                Name = "Grab Vietnam",
                Description = "Grab là siêu ứng dụng hàng đầu Đông Nam Á cung cấp dịch vụ đặt xe, giao đồ ăn GrabFood, giao hàng GrabExpress và thanh toán điện tử.",
                Industry = "Vận tải & Giao nhận công nghệ",
                IndustryCode = "LOGISTICS",
                SizeRange = "1000-5000 nhân viên",
                Address = "Tầng 15, Tòa nhà Mapletree Business Centre, 1060 Nguyễn Văn Linh, Quận 7, TP. HCM",
                AddressList = "TP. HCM, Hà Nội",
                Website = "https://grab.com/vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Tặng credit sử dụng GrabCar / GrabFood hàng tháng cho nhân viên.\n- Chế độ làm việc Hybrid flexible (làm việc từ xa linh hoạt).\n- Bảo hiểm sức khỏe quốc tế cao cấp."
            },
            new Company
            {
                Code = "VCB",
                Name = "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
                Description = "Vietcombank là ngân hàng thương mại hàng đầu Việt Nam với quy mô tài sản lớn nhất, đi đầu trong mảng thanh toán quốc tế và dịch vụ tài chính doanh nghiệp.",
                Industry = "Tài chính - Ngân hàng",
                IndustryCode = "FINANCE",
                SizeRange = "10,000+ nhân viên",
                Address = "198 Trần Quang Khải, Hoàn Kiếm, Hà Nội",
                AddressList = "Hà Nội, TP. HCM, Đà Nẵng, Hải Phòng, Cần Thơ",
                Website = "https://vietcombank.com.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Thương hiệu ngân hàng uy tín số 1 Việt Nam.\n- Chế độ đãi ngộ, lương thưởng và phúc lợi ổn định lâu dài.\n- Môi trường làm việc chuyên nghiệp, bài bản."
            },
            new Company
            {
                Code = "SAMSUNG",
                Name = "Samsung Electronics Vietnam",
                Description = "Samsung Electronics là tập đoàn điện tử công nghệ số 1 thế giới với các tổ hợp sản xuất thiết bị di động, bán dẫn và trung tâm R&D Samsung lớn nhất Đông Nam Á tại Hà Nội.",
                Industry = "Sản xuất & Điện tử cao cấp",
                IndustryCode = "MANUFACTURING",
                SizeRange = "10,000+ nhân viên",
                Address = "KCN Yên Phong, Xã Long Châu, Yên Phong, Bắc Ninh",
                AddressList = "Hà Nội, Bắc Ninh, Thái Nguyên, TP. HCM",
                Website = "https://samsung.com/vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Xe đưa đón cán bộ công nhân viên tận nơi hàng ngày.\n- Ký túc xá hiện đại, căng tin phục vụ các món ăn đa dạng.\n- Thưởng sản xuất & thưởng thành tích xuất sắc."
            },
            new Company
            {
                Code = "DHG",
                Name = "Công ty Cổ phần Dược Hậu Giang (DHG Pharma)",
                Description = "DHG Pharma là doanh nghiệp dược phẩm hàng đầu Việt Nam đạt tiêu chuẩn JAPAN-GMP, chuyên sản xuất và kinh doanh các sản phẩm thuốc chất lượng cao.",
                Industry = "Y tế - Dược phẩm",
                IndustryCode = "HEALTHCARE",
                SizeRange = "1000-5000 nhân viên",
                Address = "288 Nguyễn Văn Cừ, Phường An Hòa, Ninh Kiều, Cần Thơ",
                AddressList = "Cần Thơ, TP. HCM, Hà Nội",
                Website = "https://dhgpharma.com.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Mức lương cạnh tranh trong ngành dược phẩm.\n- Môi trường làm việc ổn định, tôn trọng sự cống hiến.\n- Đào tạo chuyên môn dược tiên tiến theo tiêu chuẩn quốc tế."
            },
            new Company
            {
                Code = "FE",
                Name = "Tổ chức Giáo dục FPT (FPT Education)",
                Description = "FPT Education là hệ thống giáo dục tư nhân hàng đầu tại Việt Nam bao gồm Đại học FPT, Phổ thông FPT, FPT Polytechnic, đào tạo hàng chục ngàn sinh viên mỗi năm.",
                Industry = "Giáo dục - Đào tạo",
                IndustryCode = "EDUCATION",
                SizeRange = "1000-5000 nhân viên",
                Address = "Khu Giáo dục và Đào tạo – Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội",
                AddressList = "Hà Nội, TP. HCM, Đà Nẵng, Cần Thơ, Quy Nhơn",
                Website = "https://fpt.edu.vn",
                IsVerified = true,
                IsActive = true,
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                LogoUrl = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&auto=format&fit=crop&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80",
                Benefits = "- Ưu đãi học phí tới 50%-100% cho con em cán bộ giảng viên.\n- Môi trường giáo dục giàu tính sáng tạo và học thuật.\n- Cơ hội tham gia nghiên cứu khoa học và hợp tác quốc tế."
            }
        };

        foreach (var comp in defaultCompanies)
        {
            var existing = await context.Companies.FirstOrDefaultAsync(c => c.Code == comp.Code);
            if (existing == null)
            {
                context.Companies.Add(comp);
            }
            else
            {
                existing.Name = comp.Name;
                existing.Description = comp.Description;
                existing.Industry = comp.Industry;
                existing.IndustryCode = comp.IndustryCode;
                existing.SizeRange = comp.SizeRange;
                existing.Address = comp.Address;
                existing.AddressList = comp.AddressList;
                existing.Website = comp.Website;
                existing.IsVerified = true;
                existing.VerificationStatus = CompanyVerificationStatus.VERIFIED;
                if (string.IsNullOrEmpty(existing.LogoUrl)) existing.LogoUrl = comp.LogoUrl;
                if (string.IsNullOrEmpty(existing.BannerUrl)) existing.BannerUrl = comp.BannerUrl;
                if (string.IsNullOrEmpty(existing.Benefits)) existing.Benefits = comp.Benefits;
            }
        }
        await context.SaveChangesAsync();

        // Ensure all companies are VERIFIED
        var unverifiedCompanies = await context.Companies
            .Where(c => c.VerificationStatus == CompanyVerificationStatus.DRAFT)
            .ToListAsync();
        if (unverifiedCompanies.Any())
        {
            foreach (var c in unverifiedCompanies)
            {
                c.VerificationStatus = CompanyVerificationStatus.VERIFIED;
            }
            await context.SaveChangesAsync();
        }

        // Ensure every company has an associated Employer entity & user account
        var allCompanies = await context.Companies.ToListAsync();
        var site = await context.Sites.FirstOrDefaultAsync() ?? new Site { Code = "HQ", Name = "Trụ sở chính", IsActive = true };
        if (site.Id == 0)
        {
            context.Sites.Add(site);
            await context.SaveChangesAsync();
        }

        var employerRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Nhà tuyển dụng") 
            ?? await context.Roles.FirstOrDefaultAsync(r => r.Name == "Super Admin");

        foreach (var company in allCompanies)
        {
            var hasEmployer = await context.Employers.AnyAsync(e => e.CompanyId == company.Id);
            if (!hasEmployer)
            {
                var empUsername = $"recruiter_{company.Code.ToLower()}";
                var empUser = await context.Users.FirstOrDefaultAsync(u => u.Username == empUsername);
                if (empUser == null)
                {
                    empUser = new User
                    {
                        Username = empUsername,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Recruiter@123"),
                        FullName = $"Đại diện Tuyển dụng - {company.Name}",
                        Email = $"{empUsername}@hr.local",
                        SiteId = site.Id,
                        RoleId = employerRole!.Id,
                        AccountType = AccountType.User,
                        IsActive = true
                    };
                    context.Users.Add(empUser);
                    await context.SaveChangesAsync();

                    context.UserRoles.Add(new UserRole { UserId = empUser.Id, RoleId = employerRole.Id });
                    context.UserSites.Add(new UserSite { UserId = empUser.Id, SiteId = site.Id });
                    await context.SaveChangesAsync();
                }

                context.Employers.Add(new Employer
                {
                    UserId = empUser.Id,
                    CompanyId = company.Id,
                    Position = "Trưởng phòng Tuyển dụng",
                    RoleInCompany = RoleInCompany.RECRUITER
                });
                await context.SaveChangesAsync();
            }
        }
    }

    private static async Task SeedSitesAsync(ApplicationDbContext context)
    {
        if (await context.Sites.AnyAsync()) return;
        context.Sites.Add(new Site { Code = "HQ", Name = "Trụ sở chính", IsActive = true, CompanyId = 1 });
        await context.SaveChangesAsync();
    }

    private static async Task SeedRoleLevelsAsync(ApplicationDbContext context)
    {
        if (await context.RoleLevels.AnyAsync()) return;

        context.RoleLevels.AddRange(
            new RoleLevel { Level = 0, Name = "Super Admin" },
            new RoleLevel { Level = 1, Name = "Admin quản lý chung" },
            new RoleLevel { Level = 2, Name = "Quản lý doanh nghiệp" },
            new RoleLevel { Level = 5, Name = "Ứng viên / Nhân viên" }
        );
        await context.SaveChangesAsync();
    }

    private static async Task SeedRolesAndPermissionsAsync(ApplicationDbContext context)
    {
        // Define allowed menus and modules for HR Portal
        var allowedMenuCodes = new List<string>
        {
            "menu:jobs", "menu:cvs", "menu:applications", "menu:interviews", "menu:companies", "menu:system",
            "menu:candidate", "menu:notifications", "menu:reports", "menu:messages",
            "menu:talent-pool", "menu:assessments",
            "module:jobs", "module:cvs", "module:applications", "module:interviews", "module:companies",
            "module:saved-jobs", "module:notifications", "module:reports", "module:messages",
            "module:talent-pool", "module:assessments", "module:candidate-offers", "module:candidate-applications",
            "module:system-setting", "module:user", "module:user-role", "module:site",
            "module:master-data", "module:organization"
        };

        // Define allowed permission codes
        var allowedPermissionCodes = new List<string>
        {
            "jobs:view", "jobs:create", "jobs:update", "jobs:delete",
            "cvs:view", "cvs:create", "cvs:update", "cvs:delete", "cv:search",
            "applications:view", "applications:create", "applications:update", "applications:delete",
            "assessment:manage", "assessment:take",
            "offer:view", "offer:manage",
            "interviews:view", "interviews:create", "interviews:update", "interviews:delete",
            "companies:view", "companies:create", "companies:update", "companies:delete",
            "saved-jobs:view", "notifications:view", "reports:view",
            "messages:view", "messages:send",
            "user:view", "user:create", "user:update", "user:delete", "user:reset_password",
            "user-role:view", "user-role:manage", "user-role:assign",
            "site:view", "site:manage",
            "master-data:view", "master-data:create", "master-data:update", "master-data:delete",
            "organization:view", "organization:create", "organization:update", "organization:delete"
        };

        // Clean up old menus, permissions, and role associations from DB
        var rolePermissionsToRemove = await context.RolePermissions
            .Include(rp => rp.Permission)
            .Where(rp => !allowedPermissionCodes.Contains(rp.Permission.Code))
            .ToListAsync();
        if (rolePermissionsToRemove.Any())
        {
            context.RolePermissions.RemoveRange(rolePermissionsToRemove);
            await context.SaveChangesAsync();
        }

        var permissionsToRemove = await context.Permissions
            .Where(p => !allowedPermissionCodes.Contains(p.Code))
            .ToListAsync();
        if (permissionsToRemove.Any())
        {
            context.Permissions.RemoveRange(permissionsToRemove);
            await context.SaveChangesAsync();
        }

        var menusToRemove = await context.Menus
            .Where(m => !allowedMenuCodes.Contains(m.Code))
            .ToListAsync();
        if (menusToRemove.Any())
        {
            var menuIdsToRemove = menusToRemove.Select(m => m.Id).ToList();
            var dependentChildren = await context.Menus
                .Where(m => m.ParentId.HasValue && menuIdsToRemove.Contains(m.ParentId.Value))
                .ToListAsync();
            foreach (var child in dependentChildren)
            {
                child.ParentId = null;
            }
            if (dependentChildren.Any())
            {
                await context.SaveChangesAsync();
            }

            var childMenus = menusToRemove.Where(m => m.ParentId != null).ToList();
            var parentMenus = menusToRemove.Where(m => m.ParentId == null).ToList();
            if (childMenus.Any())
            {
                context.Menus.RemoveRange(childMenus);
                await context.SaveChangesAsync();
            }
            if (parentMenus.Any())
            {
                context.Menus.RemoveRange(parentMenus);
                await context.SaveChangesAsync();
            }
        }

        // --- 1. MENUS ---
        var topMenus = new List<Menu>
        {
            new() { Code = "menu:jobs", Name = "Quản lý việc làm", ShortName = "Việc làm", SortOrder = 1, Icon = "Briefcase", Route = "/jobs", IsActive = true },
            new() { Code = "menu:talent-pool", Name = "Săn ứng viên (Talent Pool)", ShortName = "Săn ứng viên", SortOrder = 2, Icon = "Users", Route = "/employer/candidates", IsActive = true },
            new() { Code = "menu:cvs", Name = "Hồ sơ & CV", ShortName = "CV", SortOrder = 3, Icon = "FileText", Route = "/cvs", IsActive = true },
            new() { Code = "menu:applications", Name = "Quản lý ứng tuyển", ShortName = "Ứng tuyển", SortOrder = 4, Icon = "Send", Route = "/employer/applications", IsActive = true },
            new() { Code = "menu:assessments", Name = "Đánh giá năng lực", ShortName = "Trắc nghiệm", SortOrder = 5, Icon = "GraduationCap", Route = "/employer/assessments", IsActive = true },
            new() { Code = "menu:candidate", Name = "Khu vực ứng viên", ShortName = "Ứng viên", SortOrder = 6, Icon = "UserCheck", Route = "/candidate/applications", IsActive = true },
            new() { Code = "menu:interviews", Name = "Lịch phỏng vấn", ShortName = "Lịch phỏng vấn", SortOrder = 7, Icon = "Calendar", Route = "/interviews", IsActive = true },
            new() { Code = "menu:companies", Name = "Trang doanh nghiệp", ShortName = "Doanh nghiệp", SortOrder = 8, Icon = "Home", Route = "/companies", IsActive = true },
            new() { Code = "menu:messages", Name = "Tin nhắn & Trò chuyện", ShortName = "Tin nhắn", SortOrder = 9, Icon = "MessageSquare", Route = "/messages", IsActive = true },
            new() { Code = "menu:notifications", Name = "Trung tâm thông báo", ShortName = "Thông báo", SortOrder = 10, Icon = "Bell", Route = "/notifications", IsActive = true },
            new() { Code = "menu:reports", Name = "Báo cáo & Thống kê", ShortName = "Báo cáo", SortOrder = 11, Icon = "BarChart3", Route = "/reports", IsActive = true },
            new() { Code = "menu:system", Name = "Cấu hình hệ thống", ShortName = "Cấu hình", SortOrder = 99, Icon = "Settings", IsActive = true }
        };

        foreach (var m in topMenus)
        {
            var existing = await context.Menus.FirstOrDefaultAsync(x => x.Code == m.Code);
            if (existing == null) context.Menus.Add(m);
            else 
            {
                existing.Name = m.Name; 
                existing.ShortName = m.ShortName;
                existing.SortOrder = m.SortOrder; 
                existing.Icon = m.Icon; 
                existing.Route = m.Route; 
                existing.IsActive = true;
            }
        }
        await context.SaveChangesAsync();

        // --- 2. MODULES ---
        var modules = new List<(string Code, string Name, string ShortName, string ParentCode, int SortOrder, string? Route)>
        {
            ("module:jobs", "Việc làm", "Việc làm", "menu:jobs", 1, "/jobs"),
            ("module:talent-pool", "Săn ứng viên (Talent Pool)", "Săn ứng viên", "menu:talent-pool", 1, "/employer/candidates"),
            ("module:cvs", "Hồ sơ & CV", "CV", "menu:cvs", 1, "/cvs"),
            ("module:applications", "Ứng tuyển", "Ứng tuyển", "menu:applications", 1, "/employer/applications"),
            ("module:assessments", "Đánh giá năng lực", "Trắc nghiệm", "menu:assessments", 1, "/employer/assessments"),
            ("module:candidate-applications", "Lịch sử ứng tuyển", "Ứng tuyển", "menu:candidate", 1, "/candidate/applications"),
            ("module:candidate-offers", "Thư mời nhận việc", "Job Offers", "menu:candidate", 2, "/candidate/offers"),
            ("module:saved-jobs", "Việc làm đã lưu", "Đã lưu", "menu:candidate", 3, "/candidate/saved-jobs"),
            ("module:interviews", "Lịch phỏng vấn", "Lịch phỏng vấn", "menu:interviews", 1, "/interviews"),
            ("module:companies", "Doanh nghiệp", "Doanh nghiệp", "menu:companies", 1, "/companies"),
            ("module:messages", "Tin nhắn", "Tin nhắn", "menu:messages", 1, "/messages"),
            ("module:notifications", "Thông báo", "Thông báo", "menu:notifications", 1, "/notifications"),
            ("module:reports", "Báo cáo & Thống kê", "Báo cáo", "menu:reports", 1, "/reports"),
            ("module:system-setting", "Cấu hình hệ thống", "Cấu hình", "menu:system", 1, "/user-settings/system-configs"),
            ("module:user", "Tài khoản", "Tài khoản", "menu:system", 2, "/users"),
            ("module:user-role", "Phân quyền", "Phân quyền", "menu:system", 3, "/user-roles"),
            ("module:master-data", "Danh mục dùng chung", "Danh mục", "menu:system", 4, "/master-data"),
            ("module:organization", "Cơ cấu tổ chức", "Tổ chức", "menu:system", 5, "/organization"),
            ("module:site", "Chi nhánh", "Chi nhánh", "menu:system", 6, "/sites")
        };

        var allMenusDict = await context.Menus.ToDictionaryAsync(x => x.Code);
        foreach (var mod in modules)
        {
            if (allMenusDict.TryGetValue(mod.ParentCode, out var parent))
            {
                if (!allMenusDict.TryGetValue(mod.Code, out var existing))
                {
                    var newMenu = new Menu { Code = mod.Code, Name = mod.Name, ShortName = mod.ShortName, ParentId = parent.Id, SortOrder = mod.SortOrder, Route = mod.Route, IsActive = true };
                    context.Menus.Add(newMenu);
                    allMenusDict[mod.Code] = newMenu;
                }
                else
                {
                    existing.Name = mod.Name;
                    existing.ShortName = mod.ShortName;
                    existing.ParentId = parent.Id;
                    existing.SortOrder = mod.SortOrder;
                    existing.Route = mod.Route;
                    existing.IsActive = true;
                }
            }
        }
        await context.SaveChangesAsync();

        // --- 3. ACTIONS / PERMISSIONS ---
        var permissionSpecs = new List<(string ModuleCode, string ActionCode, string ActionName)>
        {
            ("module:jobs", "jobs:view", "Xem danh sách việc làm"),
            ("module:jobs", "jobs:create", "Tạo tin tuyển dụng"),
            ("module:jobs", "jobs:update", "Sửa tin tuyển dụng"),
            ("module:jobs", "jobs:delete", "Xóa tin tuyển dụng"),

            ("module:cvs", "cvs:view", "Xem danh sách hồ sơ CV"),
            ("module:cvs", "cvs:create", "Tạo hồ sơ CV"),
            ("module:cvs", "cvs:update", "Cập nhật hồ sơ CV"),
            ("module:cvs", "cvs:delete", "Xóa hồ sơ CV"),

            ("module:applications", "applications:view", "Xem danh sách ứng tuyển"),
            ("module:applications", "applications:create", "Nộp đơn ứng tuyển"),
            ("module:applications", "applications:update", "Cập nhật trạng thái ứng tuyển"),
            ("module:applications", "applications:delete", "Xóa đơn ứng tuyển"),

            ("module:interviews", "interviews:view", "Xem lịch hẹn phỏng vấn"),
            ("module:interviews", "interviews:create", "Lên lịch phỏng vấn"),
            ("module:interviews", "interviews:update", "Cập nhật lịch phỏng vấn"),
            ("module:interviews", "interviews:delete", "Hủy lịch phỏng vấn"),

            ("module:companies", "companies:view", "Xem thông tin doanh nghiệp"),
            ("module:companies", "companies:create", "Đăng ký doanh nghiệp"),
            ("module:companies", "companies:update", "Cập nhật doanh nghiệp"),
            ("module:companies", "companies:delete", "Xóa thông tin doanh nghiệp"),

            ("module:candidate-applications", "applications:view", "Xem lịch sử ứng tuyển"),
            ("module:candidate-applications", "applications:create", "Nộp hồ sơ ứng tuyển"),
            ("module:saved-jobs", "saved-jobs:view", "Xem việc làm đã lưu"),
            ("module:talent-pool", "cv:search", "Tìm kiếm ứng viên Talent Pool"),
            ("module:assessments", "assessment:manage", "Quản lý đề thi trực tuyến"),
            ("module:assessments", "assessment:take", "Làm bài thi trực tuyến"),
            ("module:candidate-offers", "offer:view", "Xem thư mời nhận việc"),
            ("module:candidate-offers", "offer:manage", "Quản lý thư mời nhận việc"),
            ("module:messages", "messages:view", "Xem tin nhắn"),
            ("module:messages", "messages:send", "Gửi tin nhắn"),
            ("module:notifications", "notifications:view", "Xem thông báo"),
            ("module:reports", "reports:view", "Xem báo cáo thống kê"),

            ("module:user", "user:view", "Xem tài khoản"),
            ("module:user", "user:create", "Thêm tài khoản"),
            ("module:user", "user:update", "Sửa tài khoản"),
            ("module:user", "user:delete", "Xóa tài khoản"),
            ("module:user", "user:reset_password", "Đổi mật khẩu tài khoản"),

            ("module:user-role", "user-role:view", "Xem phân quyền"),
            ("module:user-role", "user-role:manage", "Quản lý vai trò"),
            ("module:user-role", "user-role:assign", "Gán vai trò"),

            ("module:site", "site:view", "Xem chi nhánh"),
            ("module:site", "site:manage", "Quản lý chi nhánh"),

            ("module:master-data", "master-data:view", "Xem danh mục dùng chung"),
            ("module:master-data", "master-data:create", "Thêm danh mục"),
            ("module:master-data", "master-data:update", "Sửa danh mục"),
            ("module:master-data", "master-data:delete", "Xóa danh mục"),

            ("module:organization", "organization:view", "Xem cơ cấu tổ chức"),
            ("module:organization", "organization:create", "Thêm phòng ban"),
            ("module:organization", "organization:update", "Sửa phòng ban"),
            ("module:organization", "organization:delete", "Xóa phòng ban")
        };

        allMenusDict = await context.Menus.ToDictionaryAsync(x => x.Code);
        var allPermissionsDict = await context.Permissions.ToDictionaryAsync(x => x.Code);

        foreach (var spec in permissionSpecs)
        {
            if (allMenusDict.TryGetValue(spec.ModuleCode, out var module))
            {
                if (!allPermissionsDict.TryGetValue(spec.ActionCode, out var existing))
                {
                    var newPerm = new Permission { Code = spec.ActionCode, Name = spec.ActionName, MenuId = module.Id, IsActive = true };
                    context.Permissions.Add(newPerm);
                    allPermissionsDict[spec.ActionCode] = newPerm;
                }
                else
                {
                    existing.Name = spec.ActionName;
                    existing.MenuId = module.Id;
                }
            }
        }
        await context.SaveChangesAsync();

        // --- 4. ROLES & SUPER ADMIN ---
        var superAdminLevel = await context.RoleLevels.FirstOrDefaultAsync(l => l.Level == 0);
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Super Admin");
        if (adminRole == null)
        {
            adminRole = new Role 
            { 
                Name = "Super Admin", 
                Description = "Quản trị viên hệ thống tuyển dụng", 
                IsActive = true, 
                Level = 0,
                RoleLevel = superAdminLevel!
            };
            context.Roles.Add(adminRole);
            await context.SaveChangesAsync();
        }

        // Grant all permissions to Super Admin
        var allPermissions = await context.Permissions.ToListAsync();
        var existingRolePerms = await context.RolePermissions
            .Where(rp => rp.RoleId == adminRole.Id)
            .ToListAsync();

        foreach (var perm in allPermissions)
        {
            if (!existingRolePerms.Any(rp => rp.PermissionId == perm.Id))
            {
                context.RolePermissions.Add(new RolePermission 
                { 
                    RoleId = adminRole.Id, 
                    PermissionId = perm.Id, 
                    DataScope = DataScope.ALL 
                });
            }
        }
        await context.SaveChangesAsync();

        // --- 5. SEED CANDIDATE & EMPLOYER ROLES ---
        var candidateLevel = await context.RoleLevels.FirstOrDefaultAsync(l => l.Level == 5);
        var candidateRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Ứng viên");
        if (candidateRole == null)
        {
            candidateRole = new Role
            {
                Name = "Ứng viên",
                Description = "Người đi tìm việc, có quyền quản lý CV và ứng tuyển việc làm",
                IsActive = true,
                Level = 5,
                RoleLevel = candidateLevel!
            };
            context.Roles.Add(candidateRole);
            await context.SaveChangesAsync();
        }

        var candidatePermCodes = new List<string>
        {
            "jobs:view",
            "cvs:view", "cvs:create", "cvs:update", "cvs:delete",
            "applications:view", "applications:create", "applications:delete",
            "assessment:take",
            "offer:view",
            "interviews:view",
            "companies:view",
            "saved-jobs:view",
            "messages:view", "messages:send",
            "notifications:view"
        };
        var dbCandidatePerms = await context.Permissions.Where(p => candidatePermCodes.Contains(p.Code)).ToListAsync();
        var existingCandidatePerms = await context.RolePermissions.Where(rp => rp.RoleId == candidateRole.Id).ToListAsync();
        foreach (var perm in dbCandidatePerms)
        {
            if (!existingCandidatePerms.Any(rp => rp.PermissionId == perm.Id))
            {
                context.RolePermissions.Add(new RolePermission
                {
                    RoleId = candidateRole.Id,
                    PermissionId = perm.Id,
                    DataScope = DataScope.OWN
                });
            }
        }

        var employerLevel = await context.RoleLevels.FirstOrDefaultAsync(l => l.Level == 2);
        var employerRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Nhà tuyển dụng");
        if (employerRole == null)
        {
            employerRole = new Role
            {
                Name = "Nhà tuyển dụng",
                Description = "Đại diện doanh nghiệp, có quyền đăng tin tuyển dụng và quản lý ứng viên",
                IsActive = true,
                Level = 2,
                RoleLevel = employerLevel!
            };
            context.Roles.Add(employerRole);
            await context.SaveChangesAsync();
        }

        var employerPermCodes = new List<string>
        {
            "jobs:view", "jobs:create", "jobs:update", "jobs:delete",
            "cvs:view", "cv:search",
            "applications:view", "applications:update",
            "assessment:manage",
            "offer:manage",
            "interviews:view", "interviews:create", "interviews:update", "interviews:delete",
            "companies:view", "companies:update",
            "messages:view", "messages:send",
            "notifications:view"
        };
        var dbEmployerPerms = await context.Permissions.Where(p => employerPermCodes.Contains(p.Code)).ToListAsync();
        var existingEmployerPerms = await context.RolePermissions.Where(rp => rp.RoleId == employerRole.Id).ToListAsync();
        foreach (var perm in dbEmployerPerms)
        {
            if (!existingEmployerPerms.Any(rp => rp.PermissionId == perm.Id))
            {
                context.RolePermissions.Add(new RolePermission
                {
                    RoleId = employerRole.Id,
                    PermissionId = perm.Id,
                    DataScope = DataScope.SITE
                });
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedAdminUserAsync(
        ApplicationDbContext context,
        Microsoft.Extensions.Configuration.IConfiguration? configuration,
        Microsoft.Extensions.Hosting.IHostEnvironment? environment)
    {
        // Clean up any legacy id=0 user/relations if present in database to avoid EF Core key tracking conflict
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `user_permissions` WHERE `user_id` = 0;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `user_roles` WHERE `user_id` = 0;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `user_sites` WHERE `user_id` = 0;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `users` WHERE `id` = 0;");

        var site = await context.Sites.FirstAsync();
        var adminRole = await context.Roles.FirstAsync(r => r.Name == "Super Admin");
        var candidateRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Ứng viên") ?? adminRole;

        var isProduction = environment != null && string.Equals(environment.EnvironmentName, "Production", StringComparison.OrdinalIgnoreCase);
        var configuredAdminPassword = configuration?["AdminSeed:Password"] 
            ?? configuration?["ADMIN_SEED_PASSWORD"];

        // Ở môi trường Production: chỉ seed admin nếu có biến môi trường ADMIN_SEED_PASSWORD cụ thể
        if (isProduction && string.IsNullOrWhiteSpace(configuredAdminPassword))
        {
            Console.WriteLine("[SECURITY] Môi trường Production phát hiện không có ADMIN_SEED_PASSWORD cấu hình; bỏ qua việc seed tài khoản admin mặc định.");
        }
        else if (!await context.Users.AnyAsync(u => u.Username == "admin"))
        {
            var adminPassword = !string.IsNullOrWhiteSpace(configuredAdminPassword) 
                ? configuredAdminPassword 
                : "Hamo@123";

            var admin = new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                FullName = "Quản trị viên HR",
                Email = "admin@hr.local",
                SiteId = site.Id,
                RoleId = adminRole.Id,
                AccountType = AccountType.Admin,
                IsActive = true
            };
            context.Users.Add(admin);
            await context.SaveChangesAsync();

            context.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRole.Id });
            context.UserSites.Add(new UserSite { UserId = admin.Id, SiteId = site.Id });
            await context.SaveChangesAsync();
            Console.WriteLine("[SECURITY] Đã khởi tạo tài khoản quản trị viên Super Admin.");
        }

        // Chỉ seed tài khoản ứng viên test trong môi trường Non-Production (Development/Staging)
        if (!isProduction && !await context.Users.AnyAsync(u => u.Username == "user"))
        {
            var testUser = new User
            {
                Username = "user",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123"),
                FullName = "Ứng viên Test",
                Email = "user@hr.local",
                SiteId = site.Id,
                RoleId = candidateRole.Id,
                AccountType = AccountType.User,
                IsActive = true
            };
            context.Users.Add(testUser);
            await context.SaveChangesAsync();

            context.UserRoles.Add(new UserRole { UserId = testUser.Id, RoleId = candidateRole.Id });
            context.UserSites.Add(new UserSite { UserId = testUser.Id, SiteId = site.Id });
            await context.SaveChangesAsync();
        }

        // Ensure all users have their user_roles populated based on users.role_id
        var usersWithoutRoles = await context.Users
            .Where(u => u.Id > 0 && !context.UserRoles.Any(ur => ur.UserId == u.Id))
            .ToListAsync();
            
        foreach (var u in usersWithoutRoles)
        {
            context.UserRoles.Add(new UserRole { UserId = u.Id, RoleId = u.RoleId });
        }
        await context.SaveChangesAsync();

        // Sync permissions for all users
        await HR.Infrastructure.Security.UserPermissionsHelper.SyncAllUsersPermissionsAsync(context);
    }

    private static async Task SeedSettingConfigsAsync(ApplicationDbContext context)
    {
        var existingKeys = await context.SettingConfigs.Select(s => s.ConfigKey).ToListAsync();

        var configs = new List<SettingConfig>
        {
            new() { ConfigKey = "system.timezone", ConfigValue = "Asia/Ho_Chi_Minh", Group = "System", Description = "Múi giờ mặc định (GMT+7)" },
            new() { ConfigKey = "system.date_format", ConfigValue = "DD/MM/YYYY", Group = "System", Description = "Định dạng ngày mặc định" },
            new() { ConfigKey = "system.datetime_format", ConfigValue = "DD/MM/YYYY HH:mm", Group = "System", Description = "Định dạng ngày giờ mặc định" },
            new() { ConfigKey = "smtp.host", ConfigValue = "smtp.gmail.com", Group = "SMTP", Description = "Máy chủ SMTP gửi mail (Mặc định Gmail: smtp.gmail.com)" },
            new() { ConfigKey = "smtp.port", ConfigValue = "587", Group = "SMTP", Description = "Cổng SMTP (Mặc định TLS: 587 hoặc SSL: 465)" },
            new() { ConfigKey = "smtp.username", ConfigValue = "baong@seryn.vn", Group = "SMTP", Description = "Tài khoản Gmail của công ty dùng để gửi thư" },
            new() { ConfigKey = "smtp.password", ConfigValue = "***REDACTED_APP_PASSWORD***", Group = "SMTP", Description = "Mật khẩu ứng dụng Gmail (Google App Password 16 ký tự)" },
            new() { ConfigKey = "smtp.enable_ssl", ConfigValue = "true", Group = "SMTP", Description = "Bật mã hóa bảo mật SSL/TLS (Bắt buộc cho Gmail)" },
            new() { ConfigKey = "smtp.from_email", ConfigValue = "baong@seryn.vn", Group = "SMTP", Description = "Email người gửi hiển thị (để trống sẽ dùng smtp.username)" },
            new() { ConfigKey = "smtp.from_name", ConfigValue = "Công ty TNHH HaMo Group - Phòng Tuyển Dụng", Group = "SMTP", Description = "Tên hiển thị người gửi khi ứng viên nhận thư" }
        };

        foreach (var c in configs)
        {
            if (!existingKeys.Contains(c.ConfigKey))
            {
                context.SettingConfigs.Add(c);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedJobsAsync(ApplicationDbContext context)
    {
        var companyDict = await context.Companies.ToDictionaryAsync(c => c.Code);
        var employerDict = await context.Employers
            .Include(e => e.Company)
            .Where(e => e.Company != null)
            .ToDictionaryAsync(e => e.Company!.Code);

        var defaultEmployer = await context.Employers.FirstOrDefaultAsync();
        if (defaultEmployer == null) return;

        int GetEmployerId(string code) => employerDict.TryGetValue(code, out var emp) ? emp.Id : defaultEmployer.Id;
        int GetCompanyId(string code) => companyDict.TryGetValue(code, out var comp) ? comp.Id : defaultEmployer.CompanyId ?? 1;

        var jobTemplates = new List<Job>
        {
            // 1. IT / PHẦN MỀM & CÔNG NGHỆ
            new Job
            {
                CompanyId = GetCompanyId("FPT"),
                EmployerId = GetEmployerId("FPT"),
                Title = "Senior ReactJS / Next.js Developer",
                Department = "Phát triển phần mềm (Software Engineering)",
                Category = "IT / Phần mềm",
                CategoryCode = "IT",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                ProvinceCode = "HN",
                Office = "Tòa nhà FPT Tower, 10 Phạm Văn Bạch, Cầu Giấy",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 22000000,
                SalaryTo = 38000000,
                ExperienceLevel = "3-5 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học chuyên ngành CNTT / Phần mềm",
                Description = "Tham gia dự án chuyển đổi số quy mô lớn cho khách hàng thị trường Nhật Bản & Mỹ.\n- Thiết kế kiến trúc Frontend sử dụng ReactJS 18+, Next.js App Router, TypeScript và TailwindCSS.\n- Tối ưu hiệu năng render (Core Web Vitals, SSR/SSG), tích hợp RESTful APIs và WebSockets.\n- Quản lý state nâng cao bằng Redux Toolkit hoặc Zustand.",
                Requirements = "- Tối thiểu 3 năm kinh nghiệm thực chiến với ReactJS, Next.js và TypeScript.\n- Hiểu sâu về Web Performance Optimization, SEO On-page và Clean Architecture.\n- Có kiến thức tốt về Git Workflow, CI/CD pipelines (GitHub Actions / GitLab CI).\n- Tiếng Anh hoặc tiếng Nhật giao tiếp tốt là một lợi thế lớn.",
                Benefits = "- Gói thu nhập từ 22 - 38 triệu/tháng + Thưởng dự án hấp dẫn.\n- Gói bảo hiểm sức khỏe FPT Care dành cho bản thân và người thân.\n- Đào tạo chứng chỉ quốc tế (AWS, Azure, GCP) 100% kinh phí từ tập đoàn.",
                ProbationDuration = "2 tháng (85% - 100% lương)",
                Openings = 5,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60),
                IsFeatured = true,
                FeaturedUntil = DateTime.UtcNow.AddDays(45),
                PriorityOrder = 1
            },
            new Job
            {
                CompanyId = GetCompanyId("VIETTEL"),
                EmployerId = GetEmployerId("VIETTEL"),
                Title = "Lead .NET Core Microservices Architect",
                Department = "Trung tâm Khối Hệ thống Viễn thông",
                Category = "IT / Phần mềm",
                CategoryCode = "IT",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                ProvinceCode = "HN",
                Office = "Lô D26 KĐT Mới Cầu Giấy, Yên Hòa, Cầu Giấy",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 35000000,
                SalaryTo = 60000000,
                ExperienceLevel = "Trên 5 năm kinh nghiệm",
                ExperienceYearsMin = 5,
                Education = "Đại học / Thạc sĩ chuyên ngành CNTT",
                Description = "Chịu trách nhiệm kiến trúc hệ thống backend chịu tải cao (High Concurrency / High Availability) với hàng chục triệu request/ngày.\n- Xây dựng Microservices trên nền tảng .NET 9 Core, gRPC, RabbitMQ / Apache Kafka.\n- Tối ưu CSDL MySQL, PostgreSQL, Redis Cache và ElasticSearch.\n- Triển khai Containerization (Docker, Kubernetes / K8s) trên Viettel Cloud.",
                Requirements = "- Tối thiểu 5 năm kinh nghiệm phát triển phần mềm trên nền tảng .NET / .NET Core C#.\n- Nắm vững Domain-Driven Design (DDD), Event-Driven Architecture, CQRS pattern.\n- Kinh nghiệm xử lý bài toán CSDL lớn, Caching multi-level, Distributed Tracing.\n- Tư duy hệ thống xuất sắc, khả năng dẫn dắt team từ 8-15 engineers.",
                Benefits = "- Mức lương cạnh tranh từ 35 - 60 triệu/tháng (xét thưởng 2-4 tháng lương/năm).\n- Chế độ đãi ngộ quốc phòng, bảo hiểm sức khỏe đặc thù ngành.\n- Môi trường làm việc chuyên nghiệp, thách thức tầm vóc quốc gia.",
                ProbationDuration = "2 tháng",
                Openings = 2,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(75),
                IsFeatured = true,
                FeaturedUntil = DateTime.UtcNow.AddDays(60),
                PriorityOrder = 2
            },
            new Job
            {
                CompanyId = GetCompanyId("MOMO"),
                EmployerId = GetEmployerId("MOMO"),
                Title = "Senior Mobile Developer (Flutter / React Native)",
                Department = "Khối Phát triển Siêu ứng dụng",
                Category = "IT / Phần mềm",
                CategoryCode = "IT",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "Tòa nhà Phú Mỹ Hưng, 8 Hoàng Văn Thái, Quận 7",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 25000000,
                SalaryTo = 45000000,
                ExperienceLevel = "3-5 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học chuyên ngành CNTT / Khoa học máy tính",
                Description = "Phát triển các module thanh toán, tài chính cá nhân và dịch vụ tiện ích trên ứng dụng MoMo cho 31+ triệu người dùng.\n- Tối ưu hóa UI/UX mượt mà 60fps, nâng cao tốc độ khởi động app và giảm dung lượng APK/IPA.\n- Xây dựng Native Modules (iOS Swift / Android Kotlin) khi tích hợp với SDK đối tác.",
                Requirements = "- Trên 3 năm kinh nghiệm lập trình Mobile ứng dụng Flutter hoặc React Native.\n- Thành thạo State Management (Bloc, Provider, Redux) và Native APIs.\n- Có kinh nghiệm publish ứng dụng thành công lên App Store & Google Play.\n- Tư duy Product-centric, chú trọng trải nghiệm người dùng cuối.",
                Benefits = "- Thu nhập 25 - 45 triệu/tháng + Cổ phiếu thưởng ESOP.\n- Trang bị Macbook Pro M3 / M4 chính hãng ngay ngày đầu làm việc.\n- Gói bảo hiểm sức khỏe cao cấp Bảo Việt / Liberty.",
                ProbationDuration = "2 tháng",
                Openings = 4,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(45),
                IsUrgent = true,
                UrgentUntil = DateTime.UtcNow.AddDays(30)
            },
            new Job
            {
                CompanyId = GetCompanyId("VNG"),
                EmployerId = GetEmployerId("VNG"),
                Title = "AI / LLM Research Engineer",
                Department = "VNG AI Lab & Machine Learning Research",
                Category = "IT / Phần mềm",
                CategoryCode = "IT",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "VNG Campus, Z06 Đường 13, KCX Tân Thuận, Quận 7",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 35000000,
                SalaryTo = 70000000,
                ExperienceLevel = "Trên 3 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học / Thạc sĩ / Tiến sĩ CNTT, AI, Data Science",
                Description = "Nghiên cứu và huấn luyện các mô hình ngôn ngữ lớn (LLMs), Generative AI và Computer Vision ứng dụng vào hệ sinh thái Zalo & VNGGames.\n- Fine-tune các mô hình mã nguồn mở (Llama, Mistral, Qwen) bằng LoRA, QLoRA, RLHF.\n- Triển khai Model Serving tốc độ cao sử dụng vLLM, TensorRT-LLM, Triton Server.",
                Requirements = "- Tốt nghiệp chuyên ngành CNTT, Toán tin hoặc Trí tuệ nhân tạo.\n- Sử dụng thành thạo Python, PyTorch, HuggingFace Transformers, LangChain/LlamaIndex.\n- Hiểu sâu về NLP, Transformer Architecture, Prompt Engineering và Retrieval-Augmented Generation (RAG).\n- Có bài báo công bố tại các hội nghị uy tín (NeurIPS, CVPR, ACL, EMNLP) là lợi thế lớn.",
                Benefits = "- Thu nhập thuộc top 5% thị trường (35 - 70 triệu/tháng + Thưởng cổ phần VNG).\n- Trải nghiệm môi trường làm việc Campus 5 sao: Bể bơi, Phòng Gym, Căng tin miễn phí 100%.\n- Ngân sách tham dự hội thảo công nghệ quốc tế hàng năm.",
                ProbationDuration = "2 tháng",
                Openings = 3,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(90),
                IsFeatured = true,
                FeaturedUntil = DateTime.UtcNow.AddDays(60)
            },
            new Job
            {
                CompanyId = GetCompanyId("SHOPEE"),
                EmployerId = GetEmployerId("SHOPEE"),
                Title = "Senior DevOps & Cloud Infrastructure Engineer",
                Department = "Shopee Infrastructure & Platform Operations",
                Category = "IT / Phần mềm",
                CategoryCode = "IT",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "Saigon Centre Tower 2, 67 Lê Lợi, Quận 1",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 30000000,
                SalaryTo = 55000000,
                ExperienceLevel = "3-5 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học chuyên ngành CNTT / Mạng máy tính",
                Description = "Vận hành và tự động hóa hạ tầng đám mây cho ứng dụng Shopee phục vụ đợt Mega Sale (11.11, 12.12).\n- Quản lý các cụm Kubernetes (EKS, GKE, On-premise K8s), Terraform Infrastructure as Code (IaC).\n- Thiết kế giải pháp Monitoring / Alerting (Prometheus, Grafana, Datadog, ELK Stack).\n- Bảo mật hệ thống DevSecOps và quy trình CI/CD tự động hóa.",
                Requirements = "- Trên 3 năm kinh nghiệm ở vị trí DevOps / SRE / Cloud Engineer.\n- Thành thạo Linux Administration, Docker, Kubernetes, Terraform, Ansible.\n- Kinh nghiệm quản lý đám mây AWS, GCP hoặc Alibaba Cloud.\n- Khả năng scripting mạnh mẽ với Python, Bash hoặc Go.",
                Benefits = "- Thu nhập 30 - 55 triệu/tháng + Thưởng chiến dịch Mega Sale.\n- Phụ cấp ăn trưa, bảo hiểm sức khỏe VIP cho nhân viên và người phụ thuộc.\n- Môi trường làm việc đa quốc gia năng động.",
                ProbationDuration = "2 tháng",
                Openings = 2,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60)
            },

            // 2. KINH DOANH / SALES
            new Job
            {
                CompanyId = GetCompanyId("FPT"),
                EmployerId = GetEmployerId("FPT"),
                Title = "Trưởng Phòng Kinh Doanh B2B Enterprise",
                Department = "Khối Khách hàng Doanh nghiệp & Chính phủ (FPT IS)",
                Category = "Kinh doanh / Sales",
                CategoryCode = "SALES",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                ProvinceCode = "HN",
                Office = "Tòa nhà FPT Tower, 10 Phạm Văn Bạch, Cầu Giấy",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 25000000,
                SalaryTo = 45000000,
                ExperienceLevel = "Trên 5 năm kinh nghiệm",
                ExperienceYearsMin = 5,
                Education = "Đại học Quản trị kinh doanh, CNTT, Kinh tế",
                Description = "Lập kế hoạch và điều hành đội ngũ kinh doanh các giải pháp chuyển đổi số (ERP, Cloud, AI Chatbot, Security) cho khối Doanh nghiệp lớn và Tập đoàn.\n- Quản lý quan hệ khách hàng cấp C-Level (CEO, CIO, CTO).\n- Đàm phán hợp đồng giá trị cao và đảm bảo chỉ tiêu doanh số năm.",
                Requirements = "- Tối thiểu 5 năm kinh nghiệm kinh doanh B2B ngành Công nghệ thông tin / Phần mềm / Viễn thông.\n- Có mạng lưới quan hệ sâu rộng với các Doanh nghiệp Top 500 VNR.\n- Kỹ năng đàm phán, thuyết trình dự án xuất sắc.\n- Tiếng Anh thành thạo.",
                Benefits = "- Lương cứng 25 - 45 triệu + Hoa hồng doanh số không giới hạn (Thu nhập 600M - 1 tỷ+/năm).\n- Xe ô tô công vụ đưa đón đi công tác.\n- Chế độ thưởng vượt mốc chỉ tiêu kinh doanh hấp dẫn.",
                ProbationDuration = "2 tháng",
                Openings = 2,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(45),
                IsFeatured = true,
                FeaturedUntil = DateTime.UtcNow.AddDays(30)
            },
            new Job
            {
                CompanyId = GetCompanyId("VINGROUP"),
                EmployerId = GetEmployerId("VINGROUP"),
                Title = "Chuyên Viên Tư Vấn Bất Động Sản Cao Cấp (Vinhomes)",
                Department = "Khối Phân phối & Kinh doanh Bất động sản",
                Category = "Kinh doanh / Sales",
                CategoryCode = "SALES",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                ProvinceCode = "HN",
                Office = "KĐT Vinhomes Riverside, Long Biên",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 15000000,
                SalaryTo = 30000000,
                ExperienceLevel = "1-3 năm kinh nghiệm",
                ExperienceYearsMin = 1,
                Education = "Đại học / Cao đẳng chuyên ngành Kinh tế, Marketing, Luật",
                Description = "Tư vấn và bán các đại dự án bất động sản nhà ở cao cấp Vinhomes Ocean Park, Vinhomes Smart City, Vinhomes Grand Park.\n- Tìm kiếm và khai thác nguồn khách hàng tiềm năng phân khúc cao cấp.\n- Hướng dẫn thủ tục đặt cọc, hợp đồng mua bán và hỗ trợ vay vốn ngân hàng.",
                Requirements = "- Đam mê kinh doanh, chịu được áp lực doanh số cao.\n- Kỹ năng giao tiếp, tác phong chuyên nghiệp, ngoại hình sáng.\n- Ưu tiên ứng viên có kinh nghiệm tư vấn BĐS, Tài chính - Ngân hàng, Ô tô hạng sang.",
                Benefits = "- Lương cứng 15 - 30 triệu/tháng + Hoa hồng hấp dẫn nhất thị trường BĐS (lên tới 3% - 5%/giao dịch).\n- Tham gia khóa huấn luyện đào tạo bài bản từ Học viện Vingroup.\n- Chiết khấu mua nhà Vinhomes & mua ô tô VinFast.",
                ProbationDuration = "2 tháng",
                Openings = 10,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60)
            },
            new Job
            {
                CompanyId = GetCompanyId("MASAN"),
                EmployerId = GetEmployerId("MASAN"),
                Title = "Key Account Manager (KAM) - Kênh Bán Lẻ WinMart",
                Department = "Khối Thương mại & Chuỗi Bán lẻ Masan Consumer",
                Category = "Kinh doanh / Sales",
                CategoryCode = "SALES",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "17 Lê Duẩn, Phường Bến Nghé, Quận 1",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 25000000,
                SalaryTo = 40000000,
                ExperienceLevel = "3-5 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học chuyên ngành Kinh tế, Thương mại, Marketing",
                Description = "Quản lý kinh doanh nhóm ngành hàng FMCG (Chin-su, Nam Ngư, Kokomi, MeatDeli) trên kênh Siêu thị Modern Trade (MT) và chuỗi WinMart/WinMart+.\n- Xây dựng chiến lược khuyến mại, trưng bày kệ hàng và tối ưu doanh số bán hàng thành công.\n- Đàm phán các điều khoản hợp đồng phân phối hàng năm với các đối tác bán lẻ.",
                Requirements = "- 3 năm kinh nghiệm làm KAM hoặc Senior Sales Supervisor trong ngành FMCG / Bán lẻ.\n- Hiểu sâu về vận hành kênh Modern Trade (MT) tại Việt Nam.\n- Tư duy phân tích dữ liệu bán hàng (Sell-in / Sell-out) nhạy bén.",
                Benefits = "- Thu nhập 25 - 40 triệu/tháng + Thưởng hiệu quả kinh doanh cuối năm.\n- Thẻ ưu đãi giảm giá khi mua sắm tại WinMart & sử dụng chuỗi Phúc Long.\n- Bảo hiểm chăm sóc sức khỏe cao cấp PVI.",
                ProbationDuration = "2 tháng",
                Openings = 2,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(45)
            },

            // 3. MARKETING / TRUYỀN THÔNG
            new Job
            {
                CompanyId = GetCompanyId("SHOPEE"),
                EmployerId = GetEmployerId("SHOPEE"),
                Title = "Digital Performance Marketing Manager",
                Department = "Shopee Marketing & User Acquisition",
                Category = "Marketing / Truyền thông",
                CategoryCode = "MARKETING",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "Saigon Centre Tower 2, 67 Lê Lợi, Quận 1",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 30000000,
                SalaryTo = 50000000,
                ExperienceLevel = "Trên 3 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học chuyên ngành Marketing, Truyền thông, Kinh tế",
                Description = "Quản lý ngân sách Digital Performance Marketing lớn (Facebook Ads, Google Ads, TikTok Ads, Affiliate Marketing) cho các chiến dịch Mega Sale của Shopee.\n- Tối ưu hóa chỉ số CAC (Cost Per Acquisition), ROAS (Return on Ad Spend) và GMV.\n- Phân tích hành vi người dùng, A/B testing ad creatives và luồng chuyển đổi conversion funnels.",
                Requirements = "- Tối thiểu 3-5 năm kinh nghiệm quản lý Performance Marketing tại các công ty E-Commerce, Fintech hoặc Agency hàng đầu.\n- Nắm vững các công cụ đo lường AppsFlyer, Google Analytics 4, Firebase, Tableau.\n- Khả năng tư duy số liệu xuất sắc, ra quyết định dựa trên data.",
                Benefits = "- Lương cứng 30 - 50 triệu/tháng + Thưởng Performance cuối chiến dịch.\n- Cơ hội thăng tiến lên Regional Marketing Manager.\n- Môi trường làm việc hiện đại, đa văn hóa.",
                ProbationDuration = "2 tháng",
                Openings = 1,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(45),
                IsFeatured = true,
                FeaturedUntil = DateTime.UtcNow.AddDays(30)
            },
            new Job
            {
                CompanyId = GetCompanyId("UNILEVER"),
                EmployerId = GetEmployerId("UNILEVER"),
                Title = "Brand Manager (Quản Lý Thương Hiệu FMCG)",
                Department = "Khối Marketing Ngành hàng Chăm sóc Cá nhân",
                Category = "Marketing / Truyền thông",
                CategoryCode = "MARKETING",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "156 Nguyễn Lương Bằng, Quận 7",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 35000000,
                SalaryTo = 60000000,
                ExperienceLevel = "Trên 4 năm kinh nghiệm",
                ExperienceYearsMin = 4,
                Education = "Đại học / Thạc sĩ Marketing, Quản trị kinh doanh",
                Description = "Chịu trách nhiệm toàn bộ chiến lược định vị thương hiệu, nghiên cứu thị trường (Consumer Insights) và phát triển sản phẩm mới (NPD) cho nhãn hàng Lifebuoy / Dove.\n- Lập kế hoạch Integrated Marketing Communications (IMC) toàn diện trên TVC, Digital, OOH và Trade Event.\n- Đã từng quản lý P&L (Profit & Loss) của nhãn hàng.",
                Requirements = "- Tối thiểu 4 năm kinh nghiệm làm Brand Building / Brand Marketing tại các tập đoàn FMCG đa quốc gia.\n- Tư duy chiến lược xuất sắc, thấu hiểu sâu sắc người tiêu dùng Việt Nam.\n- Khả năng quản trị dự án, phối hợp xuất sắc với Creative Agency, Media Agency.\n- Tiếng Anh trôi chảy (làm việc trực tiếp với Regional Lead).",
                Benefits = "- Thu nhập 35 - 60 triệu/tháng + Gói thưởng thành tích nhãn hàng hàng năm.\n- Môi trường làm việc thuộc Nơi làm việc tốt nhất Việt Nam.\n- Gói quà tặng sản phẩm Unilever định kỳ cho gia đình.",
                ProbationDuration = "2 tháng",
                Openings = 1,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60)
            },

            // 4. TÀI CHÍNH / NGÂN HÀNG / KẾ TOÁN
            new Job
            {
                CompanyId = GetCompanyId("TCB"),
                EmployerId = GetEmployerId("TCB"),
                Title = "Senior Financial Analyst (Chuyên Viên Phân Tích Tài Chính)",
                Department = "Khối Quản trị Tài chính & Kế hoạch (Finance & Strategy)",
                Category = "Tài chính / Ngân hàng",
                CategoryCode = "FINANCE",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                ProvinceCode = "HN",
                Office = "Số 6 Quang Trung, Hoàn Kiếm",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 22000000,
                SalaryTo = 38000000,
                ExperienceLevel = "3-5 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học chuyên ngành Tài chính, Ngân hàng, Kế toán, Kiểm toán",
                Description = "Thực hiện mô hình hóa tài chính (Financial Modeling), phân tích hiệu quả hoạt động kinh doanh (Business Performance) và dự báo doanh thu/chi phí ngân hàng.\n- Lập các báo cáo quản trị định kỳ trình Hội đồng Quản trị và Ban Tổng Giám đốc.\n- Tham gia đánh giá hiệu quả tài chính của các dự án chuyển đổi số và sản phẩm mới.",
                Requirements = "- 3-5 năm kinh nghiệm làm phân tích tài chính tại Ngân hàng, Công ty Chứng khoán, hoặc Big 4 Audit.\n- Sở hữu các chứng chỉ chuyên môn (CFA, ACCA, CMA) là lợi thế lớn.\n- Thành thạo Excel nâng cao, Financial Modeling, Power BI / SQL.",
                Benefits = "- Lương 22 - 38 triệu/tháng + Thưởng hiệu quả công việc kinh doanh (4-6 tháng lương/năm).\n- Đãi ngộ ưu đãi vay vốn ngân hàng mua nhà/xe.\n- Gói bảo hiểm sức khỏe VIP Techcombank Care.",
                ProbationDuration = "2 tháng",
                Openings = 2,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(45)
            },
            new Job
            {
                CompanyId = GetCompanyId("MASAN"),
                EmployerId = GetEmployerId("MASAN"),
                Title = "Kế Toán Trưởng (Chief Accountant)",
                Department = "Ban Tài chính Kế toán Tập đoàn",
                Category = "Tài chính / Ngân hàng",
                CategoryCode = "FINANCE",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "17 Lê Duẩn, Phường Bến Nghé, Quận 1",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 35000000,
                SalaryTo = 55000000,
                ExperienceLevel = "Trên 5 năm kinh nghiệm",
                ExperienceYearsMin = 5,
                Education = "Đại học Kế toán, Kiểm toán, Tài chính",
                Description = "Quản lý và điều hành toàn bộ công tác kế toán, báo cáo tài chính tuân thủ chuẩn mực VAS & IFRS của công ty thành viên thuộc Tập đoàn Masan.\n- Làm việc trực tiếp với Cơ quan Thuế, Đơn vị Kiểm toán độc lập (Big 4).\n- Tối ưu hóa chi phí vận hành, quản lý dòng tiền và các rủi ro tài chính.",
                Requirements = "- Tối thiểu 5 năm kinh nghiệm ở vị trí Kế toán trưởng hoặc Phó phòng Kế toán tại công ty sản xuất / bán lẻ quy mô lớn.\n- Có Chứng chỉ Kế toán trưởng còn hiệu lực.\n- Nắm vững Luật Thuế Việt Nam, VAS, IFRS và sử dụng thành thạo phần mềm SAP ERP.",
                Benefits = "- Thu nhập 35 - 55 triệu/tháng + Thưởng trách nhiệm & hiệu quả công việc.\n- Cơ hội thăng tiến lên Giám đốc Tài chính (CFO) công ty con.\n- Đầy đủ phúc lợi cao cấp theo chính sách tập đoàn.",
                ProbationDuration = "2 tháng",
                Openings = 1,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60)
            },

            // 5. NHÂN SỰ / TUYỂN DỤNG
            new Job
            {
                CompanyId = GetCompanyId("FPT"),
                EmployerId = GetEmployerId("FPT"),
                Title = "Senior IT Recruiter (Chuyên Viên Tuyển Dụng Công Nghệ)",
                Department = "Ban Thu hút Nhân tài (FPT Software Talent Acquisition)",
                Category = "Nhân sự / Tuyển dụng",
                CategoryCode = "HR",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                ProvinceCode = "HN",
                Office = "Tòa nhà FPT Tower, 10 Phạm Văn Bạch, Cầu Giấy",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 15000000,
                SalaryTo = 28000000,
                ExperienceLevel = "1-3 năm kinh nghiệm",
                ExperienceYearsMin = 2,
                Education = "Đại học Quản trị nhân lực, Ngoại ngữ, Kinh tế",
                Description = "Chịu trách nhiệm tuyển dụng các vị trí kỹ thuật công nghệ thông tin cao cấp (Senior/Lead Developers, Solution Architect, AI Engineers) cho thị trường quốc tế.\n- Tìm kiếm ứng viên qua LinkedIn Recruiter, GitHub, TopCV và mạng lưới cá nhân.\n- Đánh giá hồ sơ, thực hiện phỏng vấn sàng lọc và đàm phán thư mời nhận việc (Job Offer).",
                Requirements = "- Tối thiểu 2 năm kinh nghiệm IT Recruitment (In-house hoặc Headhunt Agency).\n- Thấu hiểu về các công nghệ phần mềm (Java, .NET, React, Python, Cloud, AI).\n- Kỹ năng giao tiếp, đàm phán và thuyết phục ứng viên xuất sắc.\n- Tiếng Anh giao tiếp tốt.",
                Benefits = "- Lương cứng 15 - 28 triệu/tháng + Thưởng thưởng tuyển dụng theo đầu người (Commissions hấp dẫn).\n- Chăm sóc sức khỏe FPT Care.\n- Môi trường làm việc trẻ trung, nhiều sự kiện kết nối.",
                ProbationDuration = "2 tháng",
                Openings = 3,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(45)
            },
            new Job
            {
                CompanyId = GetCompanyId("GRAB"),
                EmployerId = GetEmployerId("GRAB"),
                Title = "HR Business Partner (HRBP Senior)",
                Department = "Grab People Operations & Culture",
                Category = "Nhân sự / Tuyển dụng",
                CategoryCode = "HR",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "Mapletree Business Centre, 1060 Nguyễn Văn Linh, Quận 7",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 30000000,
                SalaryTo = 50000000,
                ExperienceLevel = "Trên 5 năm kinh nghiệm",
                ExperienceYearsMin = 5,
                Education = "Đại học Nhân sự, Quản trị kinh doanh, Tâm lý học",
                Description = "Đồng hành cùng Ban Lãnh đạo Khối Kinh doanh & Vận hành (Business Leaders) thiết kế bộ máy tổ chức, quản trị hiệu suất công việc (OKRs/KPIs) và phát triển văn hóa doanh nghiệp.\n- Xử lý các vấn đề quan hệ lao động (Employee Relations), tư vấn phát triển năng lực lãnh đạo.\n- Đề xuất chiến lược thu hút và giữ chân nhân tài hàng đầu.",
                Requirements = "- 5+ năm kinh nghiệm làm HRBP tại các công ty công nghệ, MNCs hoặc Fintech quy mô lớn.\n- Kỹ năng tư vấn chiến lược, phân tích dữ liệu nhân sự (HR Analytics) nhạy bén.\n- Kỹ năng xử lý tình huống linh hoạt, thấu hiểu tâm lý nhân viên.\n- Tiếng Anh chuẩn mực (làm việc với Regional HR Team).",
                Benefits = "- Thu nhập 30 - 50 triệu/tháng + Thưởng cổ phần Grab.\n- Credit sử dụng dịch vụ GrabCar / GrabFood hàng tháng.\n- Bảo hiểm sức khỏe quốc tế cao cấp.",
                ProbationDuration = "2 tháng",
                Openings = 1,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60),
                IsFeatured = true,
                FeaturedUntil = DateTime.UtcNow.AddDays(45)
            },

            // 6. THIẾT KẾ / UI-UX
            new Job
            {
                CompanyId = GetCompanyId("MOMO"),
                EmployerId = GetEmployerId("MOMO"),
                Title = "Product UI/UX Lead Designer",
                Department = "Khối Trải nghiệm Người dùng (UX Design Center)",
                Category = "Thiết kế / Sáng tạo",
                CategoryCode = "DESIGN",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "8 Hoàng Văn Thái, Quận 7",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 28000000,
                SalaryTo = 48000000,
                ExperienceLevel = "Trên 3 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học Thiết kế Đồ họa, Mỹ thuật công nghiệp, CNTT",
                Description = "Dẫn dắt thiết kế giao diện UI/UX cho các tính năng mới trên siêu ứng dụng MoMo.\n- Xây dựng Design System đồng nhất trên iOS, Android và Web Apps.\n- Phối hợp chặt chẽ với Product Managers (PM) và User Researchers conducting Usability Testing.",
                Requirements = "- 3-5 năm kinh nghiệm thiết kế UI/UX ứng dụng Mobile App quy mô lớn.\n- Thành thạo Figma, Design System, Prototyping (Principle/Framer) và Usability Testing.\n- Đính kèm Portfolio các dự án thiết kế sản phẩm thành công trong CV.",
                Benefits = "- Lương 28 - 48 triệu/tháng + Cổ phiếu thưởng ESOP.\n- Trang bị Macbook Pro M3 16 inch chuyên dụng đồ họa.\n- Môi trường sáng tạo hàng đầu giới Design.",
                ProbationDuration = "2 tháng",
                Openings = 2,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(45)
            },

            // 7. XÂY DỰNG / BẤT ĐỘNG SẢN
            new Job
            {
                CompanyId = GetCompanyId("VINGROUP"),
                EmployerId = GetEmployerId("VINGROUP"),
                Title = "Kỹ Sư Giám Sát Thi Công Công Trình (Vincons)",
                Department = "Ban Quản lý Dự án Xây dựng Vinhomes",
                Category = "Xây dựng / Bất động sản",
                CategoryCode = "CONSTRUCTION",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                ProvinceCode = "HN",
                Office = "Dự án Vinhomes Ocean Park, Gia Lâm / Long Biên",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 18000000,
                SalaryTo = 30000000,
                ExperienceLevel = "3-5 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học Xây dựng, Kiến trúc, Giao thông vận tải",
                Description = "Trực tiếp giám sát chất lượng, tiến độ và an toàn lao động thi công công trình nhà ở cao tầng / thấp tầng dự án Vinhomes.\n- Kiểm tra nghiệm thu vật liệu đầu vào, bản vẽ thi công và khối lượng hoàn công của nhà thầu phụ.\n- Xử lý các vướng mắc kỹ thuật phát sinh tại công trường.",
                Requirements = "- 3+ năm kinh nghiệm giám sát thi công các công trình dân dụng & công nghiệp quy mô lớn.\n- Có Chứng chỉ hành nghề Giám sát thi công xây dựng còn hiệu lực.\n- Sử dụng thành thạo AutoCAD, MS Project, Revit (BIM là lợi thế).",
                Benefits = "- Lương 18 - 30 triệu/tháng + Phụ cấp công trường hấp dẫn.\n- Thưởng dự án khi cất nóc & bàn giao công trình vượt tiến độ.\n- Đầy đủ chế độ phúc lợi tập đoàn Vingroup.",
                ProbationDuration = "2 tháng",
                Openings = 5,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60)
            },

            // 8. CHUỖI CUNG ỨNG / LOGISTICS
            new Job
            {
                CompanyId = GetCompanyId("UNILEVER"),
                EmployerId = GetEmployerId("UNILEVER"),
                Title = "Supply Chain Operations Manager",
                Department = "Khối Quản trị Chuỗi Cung ứng Toàn quốc",
                Category = "Chuỗi cung ứng / Logistics",
                CategoryCode = "LOGISTICS",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                ProvinceCode = "HCM",
                Office = "KCN Tây Bắc Củ Chi / 156 Nguyễn Lương Bằng, Quận 7",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 35000000,
                SalaryTo = 60000000,
                ExperienceLevel = "Trên 5 năm kinh nghiệm",
                ExperienceYearsMin = 5,
                Education = "Đại học Logistics, Chuỗi cung ứng, Kinh tế ngoại thương",
                Description = "Tối ưu hóa toàn bộ chuỗi cung ứng end-to-end từ Hoạch định sản xuất (Demand Planning), Quản lý kho vận (Warehouse) đến Phân phối giao nhận (Logistics Distribution).\n- Tối ưu chỉ số OTIF (On-Time In-Full) và chi phí vận chuyển toàn quốc.\n- Áp dụng công nghệ tự động hóa và AI trong dự báo nhu cầu hàng hóa.",
                Requirements = "- 5+ năm kinh nghiệm quản lý Supply Chain tại các công ty FMCG hoặc Bán lẻ lớn.\n- Am hiểu sâu về hệ thống SAP APO/IBP, WMS, TMS.\n- Kỹ năng lãnh đạo, giải quyết khủng hoảng chuỗi cung ứng.\n- Tiếng Anh xuất sắc.",
                Benefits = "- Thu nhập 35 - 60 triệu/tháng + Thưởng hiệu quả chuỗi cung ứng hàng năm.\n- Xe hơi công vụ đưa đón làm việc.\n- Gói bảo hiểm sức khỏe VIP toàn diện.",
                ProbationDuration = "2 tháng",
                Openings = 1,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60)
            },

            // 9. Y TẾ / DƯỢC PHẨM
            new Job
            {
                CompanyId = GetCompanyId("DHG"),
                EmployerId = GetEmployerId("DHG"),
                Title = "Trình Dược Viên Kênh Bệnh Viện & Nhà Thuốc",
                Department = "Khối Kinh doanh Dược phẩm Miền Nam",
                Category = "Y tế / Dược phẩm",
                CategoryCode = "HEALTHCARE",
                EmploymentType = "Full-time",
                City = "Cần Thơ",
                ProvinceCode = "CT",
                Office = "288 Nguyễn Văn Cừ, An Hòa, Ninh Kiều",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 15000000,
                SalaryTo = 28000000,
                ExperienceLevel = "1-3 năm kinh nghiệm",
                ExperienceYearsMin = 1,
                Education = "Đại học / Cao đẳng Dược phẩm, Y khoa, Biochemi",
                Description = "Giới thiệu và tư vấn các sản phẩm thuốc điều trị đạt tiêu chuẩn JAPAN-GMP của Dược Hậu Giang tới Bác sĩ, Dược sĩ bệnh viện và chủ nhà thuốc.\n- Xây dựng mối quan hệ bền chặt với các đối tác y tế trên địa bàn phụ trách.\n- Đảm bảo đạt chỉ tiêu doanh số bán hàng hàng tháng/quý.",
                Requirements = "- Tốt nghiệp chuyên ngành Dược hoặc Y khoa.\n- Ưu tiên ứng viên có 1 năm kinh nghiệm trình dược kênh Bệnh viện (ETC) hoặc Nhà thuốc (OTC).\n- Nhanh nhẹn, trung thực, giao tiếp và thuyết phục tốt.",
                Benefits = "- Lương cứng 15 - 28 triệu/tháng + Hoa hồng doanh số thưởng quý/năm vượt trội.\n- Phụ cấp xăng xe, điện thoại, công tác phí đầy đủ.\n- Môi trường làm việc ổn định, phúc lợi chu đáo.",
                ProbationDuration = "2 tháng",
                Openings = 4,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(45)
            },

            // 10. GIÁO DỤC / ĐÀO TẠO
            new Job
            {
                CompanyId = GetCompanyId("FE"),
                EmployerId = GetEmployerId("FE"),
                Title = "Giám Đốc Chương Trình Đào Tạo CNTT (Academic Program Director)",
                Department = "Ban Ban Giảng huấn Đại học FPT",
                Category = "Giáo dục / Đào tạo",
                CategoryCode = "EDUCATION",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                ProvinceCode = "HN",
                Office = "Khu Công nghệ cao Hòa Lạc, Thạch Thất",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 30000000,
                SalaryTo = 50000000,
                ExperienceLevel = "Trên 5 năm kinh nghiệm",
                ExperienceYearsMin = 5,
                Education = "Thạc sĩ / Tiến sĩ chuyên ngành Khoa học máy tính, CNTT",
                Description = "Xây dựng và kiểm định chương trình đào tạo Cử nhân CNTT (Kỹ thuật phần mềm, AI, An toàn thông tin) theo chuẩn quốc tế ABET.\n- Quản lý đội ngũ Giảng viên, triển khai các phương pháp giảng dạy hiện đại (Project-based learning).\n- Hợp tác với các tập đoàn công nghệ lớn đưa sinh viên thực tập doanh nghiệp (OJT).",
                Requirements = "- Bằng Thạc sĩ hoặc Tiến sĩ chuyên ngành CNTT / Khoa học máy tính.\n- Có kinh nghiệm giảng dạy và quản lý đào tạo tại các trường Đại học uy tín.\n- Tiếng Anh chuẩn mực (có khả năng giảng dạy bằng tiếng Anh).\n- Đam mê sự nghiệp giáo dục và đổi mới sáng tạo.",
                Benefits = "- Thu nhập 30 - 50 triệu/tháng + Thưởng hiệu quả đào tạo.\n- Xe bus cao cấp đưa đón cán bộ giảng viên từ nội thành Hà Nội lên Hòa Lạc hàng ngày.\n- Miễn 100% học phí cho con em tại hệ thống trường FPT.",
                ProbationDuration = "2 tháng",
                Openings = 1,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60)
            },

            // 11. KHÁCH SẠN / DU LỊCH & F&B
            new Job
            {
                CompanyId = GetCompanyId("SUNGROUP"),
                EmployerId = GetEmployerId("SUNGROUP"),
                Title = "Quản Lý Vận Hành Resort 5 Sao (Sun Hospitality)",
                Department = "Khối Vận hành Du lịch Nghỉ dưỡng Sun Group",
                Category = "Khách sạn / Du lịch",
                CategoryCode = "HOSPITALITY",
                EmploymentType = "Full-time",
                City = "Đà Nẵng",
                ProvinceCode = "DN",
                Office = "InterContinental Danang Sun Peninsula Resort / Sun World Ba Na Hills",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 30000000,
                SalaryTo = 55000000,
                ExperienceLevel = "Trên 5 năm kinh nghiệm",
                ExperienceYearsMin = 5,
                Education = "Đại học Quản trị Khách sạn, Du lịch, Kinh tế",
                Description = "Điều hành toàn bộ hoạt động vận hành hàng ngày của Resort 5 sao đẳng cấp quốc tế.\n- Đảm bảo chất lượng dịch vụ khách hàng tiêu chuẩn 5 sao vượt trội.\n- Quản lý ngân sách doanh thu/chi phí (P&L), đào tạo nâng cao tay nghề đội ngũ nhân viên.",
                Requirements = "- 5+ năm kinh nghiệm ở vị trí Resort Operation Manager hoặc Executive Assistant Manager tại các chuỗi khách sạn 5 sao quốc tế (Marriott, IHG, Accor).\n- Tiếng Anh giao tiếp xuất sắc (biết thêm tiếng Trung / Nhật là lợi thế lớn).\n- Kỹ năng quản trị trải nghiệm khách hàng cao cấp.",
                Benefits = "- Thu nhập 30 - 55 triệu/tháng + Gói ưu đãi nghỉ dưỡng 5 sao Sun Group.\n- Bố trí nhà ở công vụ chất lượng cao cho nhân sự ở xa.\n- Đầy đủ bảo hiểm sức khỏe VIP.",
                ProbationDuration = "2 tháng",
                Openings = 1,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60),
                IsFeatured = true,
                FeaturedUntil = DateTime.UtcNow.AddDays(45)
            },

            // 12. SẢN XUẤT / Ô TÔ / KỸ THUẬT
            new Job
            {
                CompanyId = GetCompanyId("VINGROUP"),
                EmployerId = GetEmployerId("VINGROUP"),
                Title = "Kỹ Sư Tự Động Hóa & R&D Ô Tô Điện (VinFast)",
                Department = "Tổ hợp Sản xuất & Viện Nghiên cứu VinFast",
                Category = "Sản xuất / Kỹ thuật",
                CategoryCode = "MANUFACTURING",
                EmploymentType = "Full-time",
                City = "Hải Phòng",
                ProvinceCode = "HP",
                Office = "KCN Đình Vũ, Đảo Cát Hải, Hải Phòng",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 25000000,
                SalaryTo = 45000000,
                ExperienceLevel = "3-5 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học Bách Khoa chuyên ngành Tự động hóa, Cơ điện tử, Ô tô",
                Description = "Nghiên cứu thiết kế và lập trình điều khiển hệ thống tự động hóa nhà máy sản xuất xe điện VinFast.\n- Lập trình PLC (Siemens, Rockwell), Robot công nghiệp (ABB, KUKA, Fanuc) trên dây chuyền dập và hàn thân vỏ xe.\n- Tối ưu hóa chu kỳ sản xuất (Cycle time) và đảm bảo chất lượng xe điện xuất khẩu thị trường Mỹ/Châu Âu.",
                Requirements = "- Tốt nghiệp Bách Khoa / Sư phạm Kỹ thuật chuyên ngành Tự động hóa / Cơ điện tử.\n- Trên 3 năm kinh nghiệm thiết kế & vận hành dây chuyền sản xuất tự động hóa ô tô / điện tử.\n- Sử dụng thành thạo phần mềm TIA Portal, Robot Studio, SolidWorks.",
                Benefits = "- Lương 25 - 45 triệu/tháng + Phụ cấp nhà ở / xe đưa đón từ Hà Nội & Hải Phòng.\n- Chiết khấu đặc quyền khi mua xe ô tô điện VinFast.\n- Bảo hiểm Vinmec Care cao cấp.",
                ProbationDuration = "2 tháng",
                Openings = 3,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(60),
                IsUrgent = true,
                UrgentUntil = DateTime.UtcNow.AddDays(30)
            },
            new Job
            {
                CompanyId = GetCompanyId("SAMSUNG"),
                EmployerId = GetEmployerId("SAMSUNG"),
                Title = "Senior Quality Assurance (QA/QC Manager)",
                Department = "Khối Quản lý Chất lượng Sản xuất Thiết bị Di động",
                Category = "Sản xuất / Kỹ thuật",
                CategoryCode = "MANUFACTURING",
                EmploymentType = "Full-time",
                City = "Bắc Ninh",
                ProvinceCode = "BN",
                Office = "KCN Yên Phong, Xã Long Châu, Yên Phong",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 30000000,
                SalaryTo = 50000000,
                ExperienceLevel = "Trên 5 năm kinh nghiệm",
                ExperienceYearsMin = 5,
                Education = "Đại học chuyên ngành Điện - Điện tử, Quản lý công nghiệp, Cơ khí",
                Description = "Quản lý và kiểm soát toàn bộ quy trình chất lượng sản xuất smartphone Flagship Samsung Galaxy.\n- Phân tích nguyên nhân gốc rễ (RCA) các lỗi kỹ thuật phát sinh trên chuyền lắp ráp và đề xuất giải pháp 8D / Six Sigma.\n- Đánh giá chất lượng linh kiện đầu vào từ các nhà cung ứng Tier 1.",
                Requirements = "- 5+ năm kinh nghiệm làm Quản lý QA/QC tại các tập đoàn sản xuất linh kiện điện tử đa quốc gia.\n- Nắm vững công cụ quản lý chất lượng 7 QC Tools, 8D Report, FMEA, SPC, Six Sigma Black/Green Belt.\n- Tiếng Anh trôi chảy (giao tiếp trực tiếp với Chuyên gia Hàn Quốc).",
                Benefits = "- Thu nhập 30 - 50 triệu/tháng + Thưởng năng suất sản xuất 2 lần/năm.\n- Xe đưa đón miễn phí hàng ngày từ Hà Nội đi Bắc Ninh.\n- Môi trường làm việc chuẩn Hàn Quốc.",
                ProbationDuration = "2 tháng",
                Openings = 2,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(75)
            }
        };

        foreach (var job in jobTemplates)
        {
            var exists = await context.Jobs.AnyAsync(j => j.Title == job.Title && j.CompanyId == job.CompanyId);
            if (!exists)
            {
                context.Jobs.Add(job);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedMasterDataAsync(ApplicationDbContext context)
    {
        if (await context.MasterDataCategories.AnyAsync()) return;

        var categories = new List<MasterDataCategory>
        {
            // Ngành nghề
            new() { Type = "Industry", Code = "IT", Name = "Công nghệ thông tin", SortOrder = 1 },
            new() { Type = "Industry", Code = "FINANCE", Name = "Tài chính - Ngân hàng", SortOrder = 2 },
            new() { Type = "Industry", Code = "MARKETING", Name = "Marketing - Truyền thông", SortOrder = 3 },
            new() { Type = "Industry", Code = "HR", Name = "Nhân sự", SortOrder = 4 },
            new() { Type = "Industry", Code = "SALES", Name = "Kinh doanh", SortOrder = 5 },
            new() { Type = "Industry", Code = "EDUCATION", Name = "Giáo dục - Đào tạo", SortOrder = 6 },
            new() { Type = "Industry", Code = "HEALTHCARE", Name = "Y tế - Sức khỏe", SortOrder = 7 },
            new() { Type = "Industry", Code = "CONSTRUCTION", Name = "Xây dựng - Kiến trúc", SortOrder = 8 },

            // Cấp bậc
            new() { Type = "Level", Code = "INTERN", Name = "Thực tập sinh", SortOrder = 1 },
            new() { Type = "Level", Code = "FRESHER", Name = "Fresher", SortOrder = 2 },
            new() { Type = "Level", Code = "JUNIOR", Name = "Junior", SortOrder = 3 },
            new() { Type = "Level", Code = "MIDDLE", Name = "Middle", SortOrder = 4 },
            new() { Type = "Level", Code = "SENIOR", Name = "Senior", SortOrder = 5 },
            new() { Type = "Level", Code = "LEAD", Name = "Team Lead", SortOrder = 6 },
            new() { Type = "Level", Code = "MANAGER", Name = "Manager", SortOrder = 7 },
            new() { Type = "Level", Code = "DIRECTOR", Name = "Director", SortOrder = 8 },

            // Loại hình công việc
            new() { Type = "JobType", Code = "FULLTIME", Name = "Toàn thời gian", SortOrder = 1 },
            new() { Type = "JobType", Code = "PARTTIME", Name = "Bán thời gian", SortOrder = 2 },
            new() { Type = "JobType", Code = "CONTRACT", Name = "Hợp đồng", SortOrder = 3 },
            new() { Type = "JobType", Code = "FREELANCE", Name = "Freelance", SortOrder = 4 },
            new() { Type = "JobType", Code = "INTERNSHIP", Name = "Thực tập", SortOrder = 5 },

            // Hình thức làm việc
            new() { Type = "WorkForm", Code = "ONSITE", Name = "Tại văn phòng", SortOrder = 1 },
            new() { Type = "WorkForm", Code = "REMOTE", Name = "Từ xa", SortOrder = 2 },
            new() { Type = "WorkForm", Code = "HYBRID", Name = "Kết hợp", SortOrder = 3 },

            // Mức lương
            new() { Type = "SalaryRange", Code = "UNDER5M", Name = "Dưới 5 triệu", SortOrder = 1 },
            new() { Type = "SalaryRange", Code = "5M_10M", Name = "5 - 10 triệu", SortOrder = 2 },
            new() { Type = "SalaryRange", Code = "10M_15M", Name = "10 - 15 triệu", SortOrder = 3 },
            new() { Type = "SalaryRange", Code = "15M_20M", Name = "15 - 20 triệu", SortOrder = 4 },
            new() { Type = "SalaryRange", Code = "20M_30M", Name = "20 - 30 triệu", SortOrder = 5 },
            new() { Type = "SalaryRange", Code = "30M_50M", Name = "30 - 50 triệu", SortOrder = 6 },
            new() { Type = "SalaryRange", Code = "ABOVE50M", Name = "Trên 50 triệu", SortOrder = 7 },
            new() { Type = "SalaryRange", Code = "NEGOTIABLE", Name = "Thỏa thuận", SortOrder = 8 },

            // Địa điểm
            new() { Type = "Location", Code = "HN", Name = "Hà Nội", SortOrder = 1 },
            new() { Type = "Location", Code = "HCM", Name = "TP. Hồ Chí Minh", SortOrder = 2 },
            new() { Type = "Location", Code = "DN", Name = "Đà Nẵng", SortOrder = 3 },
            new() { Type = "Location", Code = "HP", Name = "Hải Phòng", SortOrder = 4 },
            new() { Type = "Location", Code = "CT", Name = "Cần Thơ", SortOrder = 5 },
            new() { Type = "Location", Code = "OTHER", Name = "Khác", SortOrder = 99 }
        };

        context.MasterDataCategories.AddRange(categories);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDepartmentsAsync(ApplicationDbContext context)
    {
        if (await context.Departments.AnyAsync()) return;

        var departments = new List<Department>
        {
            new() { Code = "BOD", Name = "Ban Giám đốc", SortOrder = 1 },
            new() { Code = "HR", Name = "Phòng Nhân sự", SortOrder = 2 },
            new() { Code = "IT", Name = "Phòng Công nghệ", SortOrder = 3 },
            new() { Code = "SALES", Name = "Phòng Kinh doanh", SortOrder = 4 },
            new() { Code = "MARKETING", Name = "Phòng Marketing", SortOrder = 5 },
            new() { Code = "FINANCE", Name = "Phòng Tài chính - Kế toán", SortOrder = 6 },
            new() { Code = "ADMIN", Name = "Phòng Hành chính", SortOrder = 7 }
        };

        context.Departments.AddRange(departments);
        await context.SaveChangesAsync();
    }

    private static async Task SeedJobViewLogsAsync(ApplicationDbContext context)
    {
        if (await context.JobViewLogs.AnyAsync()) return;

        var jobs = await context.Jobs.Where(j => j.DeletedAt == null).ToListAsync();
        if (!jobs.Any()) return;

        var random = new Random(42);
        var logs = new List<JobViewLog>();

        foreach (var job in jobs)
        {
            var viewCount = random.Next(28, 65);
            for (int i = 0; i < viewCount; i++)
            {
                var daysAgo = random.Next(0, 28);
                logs.Add(new JobViewLog
                {
                    JobId = job.Id,
                    IpAddress = $"192.168.1.{random.Next(10, 200)}",
                    UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
                    ViewedAt = DateTime.Now.AddDays(-daysAgo).AddMinutes(random.Next(0, 1440))
                });
            }
        }

        context.JobViewLogs.AddRange(logs);
        await context.SaveChangesAsync();
    }

    private static async Task SeedArticlesAsync(ApplicationDbContext context)
    {
        if (await context.Articles.AnyAsync()) return;

        var articles = new List<Article>
        {
            new()
            {
                Title = "Bí quyết viết CV chuẩn ATS chinh phục mọi nhà tuyển dụng năm 2026",
                Slug = "bi-quyet-viet-cv-chuan-ats-chinh-phuc-nha-tuyen-dung-2026",
                Summary = "Tìm hiểu hệ thống theo dõi ứng viên (ATS) hoạt động như thế nào, cách chọn từ khoá và định dạng CV giúp bạn vượt qua 95% vòng quét tự động.",
                Category = "Bí quyết viết CV",
                Tags = "CV, ATS, Tìm việc, Kinh nghiệm ứng tuyển, Tuyển dụng",
                AuthorName = "Chuyên gia Tuyển dụng HR",
                ThumbnailUrl = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80",
                ReadingTimeMinutes = 6,
                ViewCount = 1420,
                IsPublished = true,
                PublishedAt = DateTime.UtcNow.AddDays(-15),
                SeoTitle = "Bí quyết viết CV chuẩn ATS 2026 - Tăng 300% cơ hội gọi phỏng vấn",
                SeoDescription = "Hướng dẫn chi tiết cách viết CV chuẩn ATS: bố cục, từ khoá, định dạng file giúp CV của bạn lọt mắt xanh nhà tuyển dụng và hệ thống lọc hồ sơ tự động.",
                SeoKeywords = "viết cv, cv chuẩn ats, mẫu cv đẹp, kinh nghiệm xin việc 2026",
                ContentHtml = @"
                    <h2>1. Hệ thống ATS (Applicant Tracking System) là gì?</h2>
                    <p>ATS là phần mềm quản lý hồ sơ ứng viên được hơn 90% doanh nghiệp lớn và công ty công nghệ sử dụng để tự động phân loại, trích xuất dữ liệu và chấm điểm CV trước khi chuyển tới tay HR.</p>
                    <h2>2. Các lỗi phổ biến khiến CV bị ATS đánh rớt ngay lập tức</h2>
                    <ul>
                        <li><strong>Dùng biểu bảng (Tables) hoặc đồ hoạ phức tạp:</strong> Các bot ATS thường không đọc được chữ nằm trong table hoặc ảnh.</li>
                        <li><strong>Thiếu từ khoá (Keywords) từ Job Description:</strong> Nếu JD yêu cầu 'React, TypeScript, Agile' mà CV chỉ ghi 'Frontend Developer chung chung', điểm khớp lệnh sẽ rất thấp.</li>
                        <li><strong>Tên tiêu đề mục không chuẩn:</strong> Nên dùng các tiêu đề chuẩn như 'Kinh nghiệm làm việc', 'Kỹ năng chuyên môn', 'Học vấn' thay vì từ ngữ cách điệu.</li>
                    </ul>
                    <h2>3. Chiến lược tối ưu CV 1 trang hiệu quả</h2>
                    <p>Hãy áp dụng công thức <strong>STAR (Situation - Task - Action - Result)</strong> hoặc mô hình <em>X-Y-Z của Google</em>: 'Đạt được thành tích X, đo lường bằng con số Y, thông qua hành động Z'.</p>
                    <p>Đừng quên tải CV định dạng PDF hoặc DOCX với dung lượng dưới 5MB để đảm bảo hệ thống đọc mượt mà nhất.</p>
                "
            },
            new()
            {
                Title = "Top 10 câu hỏi phỏng vấn Frontend & React Developer phổ biến nhất",
                Slug = "top-10-cau-hoi-phong-van-frontend-react-developer",
                Summary = "Tổng hợp các câu hỏi phỏng vấn kỹ thuật React, Javascript ES6+, tối ưu hiệu năng và cách trả lời tạo ấn tượng mạnh với Tech Lead.",
                Category = "Kinh nghiệm phỏng vấn",
                Tags = "React, Frontend, Phỏng vấn IT, JavaScript, Web Development",
                AuthorName = "Tech Advisory Board",
                ThumbnailUrl = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
                ReadingTimeMinutes = 8,
                ViewCount = 2850,
                IsPublished = true,
                PublishedAt = DateTime.UtcNow.AddDays(-10),
                SeoTitle = "10 câu hỏi phỏng vấn ReactJS hay gặp nhất và cách trả lời chuẩn",
                SeoDescription = "Trọn bộ câu hỏi phỏng vấn ReactJS từ cơ bản đến nâng cao: Virtual DOM, useEffect, Custom Hooks, Redux Toolkit, SSR kèm giải thích trực quan.",
                SeoKeywords = "phỏng vấn reactjs, câu hỏi phỏng vấn frontend, react interview questions",
                ContentHtml = @"
                    <h2>1. Virtual DOM hoạt động như thế nào và Diffing Algorithm là gì?</h2>
                    <p>React duy trì một cây DOM ảo trong bộ nhớ. Khi state thay đổi, React so sánh snapshot mới với snapshot cũ (quá trình Reconciliation) và chỉ cập nhật những node thực sự thay đổi trên Real DOM.</p>
                    <h2>2. Khi nào nên dùng useMemo và useCallback?</h2>
                    <p>Tránh lạm dụng! Chỉ nên dùng khi việc tính toán (computation) tốn kém hoặc khi truyền function/object làm prop cho một memoized child component (<code>React.memo</code>) để tránh re-render không cần thiết.</p>
                    <h2>3. Quản lý State: Khi nào dùng Context API vs Redux/Zustand?</h2>
                    <p>Context API tuyệt vời cho các state ít thay đổi nhưng dùng toàn cục (Theme, Ngôn ngữ, Auth User). Với các luồng dữ liệu nghiệp vụ phức tạp, tần suất cập nhật cao, Zustand hoặc Redux Toolkit mang lại hiệu năng cao hơn nhờ selective subscription.</p>
                    <h2>4. Bí quyết thể hiện tư duy kiến trúc trong buổi phỏng vấn</h2>
                    <p>Khi được hỏi, hãy giải thích cả <em>Ưu điểm</em>, <em>Nhược điểm</em> và <em>Tình huống thực tế</em> bạn đã xử lý thành công thay vì chỉ đọc thuộc định nghĩa lý thuyết.</p>
                "
            },
            new()
            {
                Title = "Quy định về thời gian và mức lương thử việc theo Bộ luật Lao động mới nhất",
                Slug = "quy-dinh-thoi-gian-va-luong-thu-viec-theo-luat-lao-dong",
                Summary = "Người lao động cần nắm rõ: Thử việc tối đa bao nhiêu tháng? Lương thử việc tối thiểu bằng bao nhiêu % lương chính thức và quyền huỷ bỏ hợp đồng thử việc.",
                Category = "Pháp luật lao động",
                Tags = "Luật lao động, Lương thử việc, Quyền lợi ứng viên, Hợp đồng lao động",
                AuthorName = "Ban Pháp chế & Nhân sự",
                ThumbnailUrl = "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
                ReadingTimeMinutes = 5,
                ViewCount = 3120,
                IsPublished = true,
                PublishedAt = DateTime.UtcNow.AddDays(-5),
                SeoTitle = "Quy định thời gian và mức lương thử việc 2026 - Người lao động cần biết",
                SeoDescription = "Bộ luật Lao động quy định chi tiết về thời gian thử việc từng vị trí, mức lương tối thiểu 85% và quyền đơn phương chấm dứt thử việc không cần báo trước.",
                SeoKeywords = "lương thử việc, thời gian thử việc, luật lao động thử việc, quyền lợi người lao động",
                ContentHtml = @"
                    <h2>1. Thời gian thử việc tối đa là bao lâu?</h2>
                    <p>Theo Điều 25 Bộ luật Lao động, thời gian thử việc do hai bên thoả thuận nhưng chỉ được thử việc 01 lần đối với một công việc và bảo đảm điều kiện sau:</p>
                    <ul>
                        <li><strong>Không quá 180 ngày:</strong> Đối với công việc của người quản lý doanh nghiệp.</li>
                        <li><strong>Không quá 60 ngày:</strong> Đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn, kỹ thuật từ cao đẳng trở lên.</li>
                        <li><strong>Không quá 30 ngày:</strong> Đối với công việc có chức danh nghề nghiệp cần trình độ trung cấp, công nhân kỹ thuật.</li>
                        <li><strong>Không quá 06 ngày làm việc:</strong> Đối với công việc khác.</li>
                    </ul>
                    <h2>2. Tiền lương trong thời gian thử việc</h2>
                    <p>Tiền lương của người lao động trong thời gian thử việc do hai bên thoả thuận nhưng <strong>ít nhất phải bằng 85%</strong> mức lương của công việc đó.</p>
                    <h2>3. Kết thúc thời gian thử việc</h2>
                    <p>Khi kết thúc thời gian thử việc, người sử dụng lao động phải thông báo kết quả. Nếu đạt yêu cầu, doanh nghiệp phải tiếp tục giao kết hợp đồng lao động chính thức.</p>
                "
            }
        };

        context.Articles.AddRange(articles);
        await context.SaveChangesAsync();
    }
}
