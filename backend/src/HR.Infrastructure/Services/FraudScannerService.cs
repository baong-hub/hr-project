using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using HR.Application.Common.Interfaces;

namespace HR.Infrastructure.Services;

public class FraudScannerService : IFraudScannerService
{
    private static readonly (string Pattern, string FlagName, int Weight)[] HighRiskRules =
    [
        ("nạp tiền|nap tien", "Yêu cầu nạp tiền", 40),
        ("đặt cọc|dat coc|phí giữ chỗ|phi giu cho|thế chấp|đóng phí hồ sơ", "Yêu cầu đặt cọc/đóng phí", 40),
        ("làm nhiệm vụ|lam nhiem vu", "Nhiệm vụ làm việc trực tuyến đáng ngờ", 35),
        ("telegram|t\\.me/|nhóm tele", "Dẫn dụ sang Telegram", 35),
        ("đọc lệnh|doc lenh|hoa hồng ngày|hoa hong ngay", "Dấu hiệu cờ bạc/tài chính đa cấp", 40),
        ("chốt đơn|chot don|giật đơn|đơn ảo shopee|đơn ảo lazada", "Mô hình giật đơn ảo lừa đảo", 40),
        ("gõ captcha|go captcha|xem video kiếm tiền|app kiếm tiền", "Bẫy làm nhiệm vụ trả thưởng", 30),
        ("chuyển khoản trước|chuyen khoan truoc", "Yêu cầu chuyển khoản trước", 40),
        ("việc nhẹ lương cao|viec nhe luong cao", "Quảng cáo việc nhẹ lương cao", 25)
    ];

    private static readonly (string Pattern, string FlagName, int Weight)[] ModerateRiskRules =
    [
        ("[0-9]{3,4}[kKđĐ]/ngày|500k|1tr/ngày|2tr/ngày", "Cam kết thu nhập theo ngày bất thường", 20),
        ("chỉ cần điện thoại|chi can dien thoai|ngồi tại nhà 2-3h", "Quảng cáo làm việc thiếu thực tế", 15),
        ("không cần kinh nghiệm.*lương.*[3-9][0-9]\\s*triệu", "Lương bất thường cho vị trí không yêu cầu kinh nghiệm", 25)
    ];

    public FraudScanResult ScanJob(
        string title,
        string description,
        string requirements,
        string? benefits,
        decimal? salaryFrom,
        decimal? salaryTo,
        string? experienceLevel)
    {
        var combinedText = $"{title} {description} {requirements} {benefits}".ToLowerInvariant();
        var detectedFlags = new List<string>();
        int totalScore = 0;

        foreach (var (pattern, flagName, weight) in HighRiskRules)
        {
            if (Regex.IsMatch(combinedText, pattern, RegexOptions.IgnoreCase))
            {
                if (!detectedFlags.Contains(flagName))
                {
                    detectedFlags.Add(flagName);
                    totalScore += weight;
                }
            }
        }

        foreach (var (pattern, flagName, weight) in ModerateRiskRules)
        {
            if (Regex.IsMatch(combinedText, pattern, RegexOptions.IgnoreCase))
            {
                if (!detectedFlags.Contains(flagName))
                {
                    detectedFlags.Add(flagName);
                    totalScore += weight;
                }
            }
        }

        // Kiểm tra bất thường về mức lương
        if (salaryTo.HasValue && salaryTo.Value >= 50000000)
        {
            var exp = (experienceLevel ?? string.Empty).ToUpperInvariant();
            if (exp.Contains("INTERN") || exp.Contains("FRESHER") || exp.Contains("ENTRY") || combinedText.Contains("không cần kinh nghiệm"))
            {
                var salaryFlag = $"Mức lương quá cao ({salaryTo.Value:N0} VND) cho cấp bậc chưa có kinh nghiệm";
                if (!detectedFlags.Contains(salaryFlag))
                {
                    detectedFlags.Add(salaryFlag);
                    totalScore += 25;
                }
            }
        }

        // Cap score at 100
        totalScore = Math.Min(totalScore, 100);

        string recommendation = "APPROVED";
        string summary;

        if (totalScore >= 70)
        {
            recommendation = "REJECT_IMMEDIATE";
            summary = $"Phát hiện {detectedFlags.Count} dấu hiệu rủi ro nghiêm trọng liên quan đến lừa đảo/đa cấp.";
        }
        else if (totalScore >= 35)
        {
            recommendation = "FLAG_FOR_REVIEW";
            summary = $"Phát hiện {detectedFlags.Count} cụm từ nhạy cảm cần quản trị viên kiểm duyệt.";
        }
        else
        {
            recommendation = "APPROVED";
            summary = "Tin tuyển dụng hợp lệ, không phát hiện vi phạm.";
        }

        return new FraudScanResult
        {
            RiskScore = totalScore,
            DetectedFlags = detectedFlags,
            Recommendation = recommendation,
            Summary = summary
        };
    }
}
