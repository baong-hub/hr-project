using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

public class GeminiAiService : IAiService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiAiService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public GeminiAiService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<GeminiAiService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    private string? GetApiKey()
    {
        var key = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(key))
        {
            key = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        }
        return string.IsNullOrWhiteSpace(key) ? null : key.Trim();
    }

    private async Task<string?> CallGeminiApiAsync(string prompt, CancellationToken cancellationToken)
    {
        var apiKey = GetApiKey();
        if (string.IsNullOrWhiteSpace(apiKey)) return null;

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);

            var model = _configuration["Gemini:Model"] ?? "gemini-flash-latest";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[] { new { text = prompt } }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.4,
                    maxOutputTokens = 1500
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(url, content, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(responseJson);
                var candidates = doc.RootElement.GetProperty("candidates");
                if (candidates.GetArrayLength() > 0)
                {
                    var text = candidates[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();
                    return text;
                }
            }
            else
            {
                _logger.LogWarning("[GEMINI_API] Request returned {StatusCode}: {Body}", response.StatusCode, await response.Content.ReadAsStringAsync(cancellationToken));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[GEMINI_API] Error calling Gemini API. Will fall back to smart local engine.");
        }

        return null;
    }

    public async Task<JobFitAnalysisResult> AnalyzeJobFitAsync(int candidateUserId, int jobId, CancellationToken cancellationToken = default)
    {
        // 1. Fetch Candidate data
        var candidate = await _context.Candidates
            .Include(c => c.User)
            .Include(c => c.CandidateSkills)
                .ThenInclude(cs => cs.Skill)
            .Include(c => c.Experiences)
            .Include(c => c.Educations)
            .Include(c => c.CandidateCvs)
            .FirstOrDefaultAsync(c => c.Id == candidateUserId && c.DeletedAt == null, cancellationToken);

        // 2. Fetch Job data
        var job = await _context.Jobs
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == jobId && j.DeletedAt == null, cancellationToken);

        if (job == null)
        {
            return new JobFitAnalysisResult
            {
                MatchScore = 50,
                MatchLevel = "Chưa xác định",
                Summary = "Không tìm thấy thông tin chi tiết của công việc này."
            };
        }

        var candidateSkills = candidate?.CandidateSkills?
            .Select(s => s.Skill?.SkillName ?? "")
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList() ?? new List<string>();

        var candidateExpYears = candidate?.Experiences?.Count ?? 1;
        var cvHeadline = candidate?.Objective ?? candidate?.ExperienceSummary ?? "Kỹ sư phần mềm";
        var candidateName = candidate?.FullName ?? candidate?.User?.FullName ?? "Ứng viên";

        // 3. Try Gemini API first
        var prompt = $@"
Bạn là một chuyên gia Headhunter và Chuyên gia nhân sự AI hàng đầu. Hãy phân tích mức độ phù hợp giữa Ứng viên và Công việc sau đây:

THÔNG TIN ỨNG VIÊN:
- Họ tên: {candidateName}
- Tiêu đề nghề nghiệp: {cvHeadline}
- Kỹ năng hiện có: {(candidateSkills.Count > 0 ? string.Join(", ", candidateSkills) : "Chưa cập nhật kỹ năng chi tiết")}
- Số lượng dự án/kinh nghiệm đã tham gia: {candidateExpYears}

THÔNG TIN CÔNG VIỆC:
- Vị trí: {job.Title}
- Công ty: {job.Company?.Name ?? "Doanh nghiệp"}
- Mô tả công việc: {job.Description}
- Yêu cầu công việc: {job.Requirements}

YÊU CẦU ĐẦU RA:
Trả về DUY NHẤT một chuỗi JSON hợp lệ với cấu trúc sau (không kèm markdown ```json hay bất kỳ chữ nào khác ngoài JSON):
{{
  ""matchScore"": <số nguyên từ 40 đến 98 đại diện cho % phù hợp>,
  ""matchLevel"": ""<Rất phù hợp / Phù hợp / Tiềm năng / Cần bổ sung kỹ năng>"",
  ""summary"": ""<nhận xét tổng quan súc tích 2 câu về mức độ tương thích>"",
  ""strengths"": [""<điểm mạnh 1>"", ""<điểm mạnh 2>"", ""<điểm mạnh 3>""],
  ""missingSkills"": [""<kỹ năng/yêu cầu còn thiếu 1>"", ""<kỹ năng/yêu cầu còn thiếu 2>""],
  ""recommendations"": [""<lời khuyên 1 để ứng tuyển thành công>"", ""<lời khuyên 2 khi phỏng vấn>""]
}}
";

        var geminiResponse = await CallGeminiApiAsync(prompt, cancellationToken);
        if (!string.IsNullOrWhiteSpace(geminiResponse))
        {
            try
            {
                var cleanJson = geminiResponse.Trim();
                if (cleanJson.StartsWith("```json")) cleanJson = cleanJson.Substring(7);
                if (cleanJson.StartsWith("```")) cleanJson = cleanJson.Substring(3);
                if (cleanJson.EndsWith("```")) cleanJson = cleanJson.Substring(0, cleanJson.Length - 3);
                cleanJson = cleanJson.Trim();

                var parsed = JsonSerializer.Deserialize<JobFitAnalysisResult>(cleanJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (parsed != null && parsed.MatchScore > 0)
                {
                    return parsed;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[GEMINI_PARSE] Could not parse Gemini response as JSON. Falling back to local engine.");
            }
        }

        // 4. Smart Local Analysis Engine (Deterministic Fallback)
        return GenerateSmartLocalAnalysis(candidateSkills, cvHeadline, candidateExpYears, job);
    }

    private JobFitAnalysisResult GenerateSmartLocalAnalysis(
        List<string> candidateSkills,
        string headline,
        int expCount,
        Job job)
    {
        var jobText = $"{job.Title} {job.Requirements} {job.Description}".ToLower();

        var commonTechs = new List<string>
        {
            "c#", ".net", "react", "reactjs", "typescript", "javascript", "sql", "mysql", "sql server",
            "docker", "kubernetes", "aws", "azure", "git", "ci/cd", "rest api", "html", "css",
            "python", "java", "spring", "golang", "nodejs", "angular", "vue"
        };

        var matchedSkills = new List<string>();
        var missingSkills = new List<string>();

        foreach (var tech in commonTechs)
        {
            bool jobRequires = jobText.Contains(tech);
            bool candidateHas = candidateSkills.Any(s => s.ToLower().Contains(tech)) || headline.ToLower().Contains(tech);

            if (jobRequires && candidateHas)
            {
                matchedSkills.Add(tech.ToUpper());
            }
            else if (jobRequires && !candidateHas)
            {
                missingSkills.Add(tech.ToUpper());
            }
        }

        // Base match calculation
        int baseScore = 65;
        if (matchedSkills.Count >= 3) baseScore = 88;
        else if (matchedSkills.Count >= 2) baseScore = 78;
        else if (matchedSkills.Count >= 1) baseScore = 70;
        else baseScore = 62;

        if (expCount >= 3) baseScore = Math.Min(96, baseScore + 6);

        string matchLevel;
        if (baseScore >= 85) matchLevel = "Rất phù hợp";
        else if (baseScore >= 75) matchLevel = "Phù hợp";
        else if (baseScore >= 65) matchLevel = "Tiềm năng";
        else matchLevel = "Cần bổ sung kỹ năng";

        var strengths = new List<string>();
        if (matchedSkills.Count > 0)
        {
            strengths.Add($"Thành thạo các công nghệ trọng tâm: {string.Join(", ", matchedSkills.Take(3))}");
        }
        else
        {
            strengths.Add("Nền tảng kỹ thuật và tư duy lập trình vững vàng");
        }
        strengths.Add($"Kinh nghiệm thực chiến qua {expCount} giai đoạn/dự án trong ngành");
        strengths.Add("Định hướng nghề nghiệp phù hợp với văn hóa phát triển của doanh nghiệp");

        var missing = new List<string>();
        if (missingSkills.Count > 0)
        {
            missing.Add($"Cần củng cố thêm về: {string.Join(", ", missingSkills.Take(2))}");
        }
        else
        {
            missing.Add("Bổ sung chứng chỉ hoặc sản phẩm thực tế để tạo ưu thế cạnh tranh");
        }
        missing.Add("Cần làm nổi bật hơn các chỉ số đo lường hiệu quả (KPI/Impact) trong dự án");

        var recommendations = new List<string>
        {
            $"Tập trung nêu bật các dự án đã sử dụng { (matchedSkills.Count > 0 ? matchedSkills[0] : "công nghệ chính") } khi trả lời phỏng vấn.",
            "Tự tin nộp hồ sơ ứng tuyển, tỉ lệ được mời tham gia phỏng vấn vòng 1 được đánh giá rất cao!"
        };

        return new JobFitAnalysisResult
        {
            MatchScore = baseScore,
            MatchLevel = matchLevel,
            Summary = $"Hồ sơ của bạn đạt mức độ {matchLevel} ({baseScore}%) với vị trí {job.Title}. Kỹ năng chuyên môn của bạn đáp ứng tốt các tiêu chí tuyển dụng chủ chốt của doanh nghiệp.",
            Strengths = strengths,
            MissingSkills = missing,
            Recommendations = recommendations
        };
    }

    public async Task<GenerateJdResult> GenerateJobDescriptionAsync(string title, string? keywords, CancellationToken cancellationToken = default)
    {
        var prompt = $@"
Bạn là Giám đốc Tuyển dụng Nhân sự cấp cao. Hãy soạn thảo một bản Mô tả công việc (Job Description) hoàn chỉnh, chuyên nghiệp và thu hút cho vị trí sau:
- Vị trí: {title}
- Từ khóa/Yêu cầu bổ sung: {keywords ?? "Chuyên môn vững, làm việc nhóm tốt, mức lương cạnh tranh"}

YÊU CẦU ĐẦU RA:
Trả về DUY NHẤT một chuỗi JSON hợp lệ với cấu trúc sau (không kèm markdown ```json hay bất kỳ chữ nào khác ngoài JSON):
{{
  ""description"": ""<Mô tả công việc chi tiết từ 4-6 gạch đầu dòng>"",
  ""requirements"": ""<Yêu cầu ứng viên từ 4-6 gạch đầu dòng về kỹ năng, số năm kinh nghiệm, học vấn>"",
  ""benefits"": ""<Chế độ đãi ngộ, phúc lợi và môi trường làm việc từ 4-5 gạch đầu dòng>""
}}
";

        var geminiResponse = await CallGeminiApiAsync(prompt, cancellationToken);
        if (!string.IsNullOrWhiteSpace(geminiResponse))
        {
            try
            {
                var cleanJson = geminiResponse.Trim();
                if (cleanJson.StartsWith("```json")) cleanJson = cleanJson.Substring(7);
                if (cleanJson.StartsWith("```")) cleanJson = cleanJson.Substring(3);
                if (cleanJson.EndsWith("```")) cleanJson = cleanJson.Substring(0, cleanJson.Length - 3);
                cleanJson = cleanJson.Trim();

                var parsed = JsonSerializer.Deserialize<GenerateJdResult>(cleanJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (parsed != null && !string.IsNullOrWhiteSpace(parsed.Description))
                {
                    return parsed;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[GEMINI_PARSE] Could not parse Gemini JD response as JSON. Falling back to template.");
            }
        }

        // Local template fallback
        return new GenerateJdResult
        {
            Description = $@"• Tham gia thiết kế, phát triển và tối ưu hóa các phân hệ ứng dụng theo vị trí {title}.
• Phối hợp chặt chẽ với Product Owner, Tech Lead và đội ngũ Designer để hiện thực hóa tính năng sản phẩm.
• Tham gia phân tích nghiệp vụ, viết tài liệu kỹ thuật và xây dựng các giải pháp kiến trúc phần mềm tin cậy.
• Đảm bảo chất lượng mã nguồn thông qua Code Review, Unit Testing và áp dụng các Best Practices.",

            Requirements = $@"• Tối thiểu từ 1-3 năm kinh nghiệm thực chiến tương đương với vị trí {title}.
• Thành thạo các công cụ, ngôn ngữ lập trình và công nghệ liên quan ({keywords ?? "kỹ năng chuyên ngành"}).
• Nắm vững kiến trúc phần mềm, tư duy logic giải quyết vấn đề và tối ưu hiệu năng hệ thống.
• Tinh thần trách nhiệm cao, khả năng làm việc độc lập và phối hợp nhóm hiệu quả.",

            Benefits = @"• Mức thu nhập cạnh tranh, thỏa thuận theo năng lực + Thưởng hiệu suất dự án hấp dẫn.
• Thưởng tháng lương thứ 13, thưởng các dịp Lễ, Tết và đánh giá tăng lương định kỳ 1-2 lần/năm.
• Đầy đủ chế độ BHXH, BHYT, BHTN theo quy định nhà nước + Gói bảo hiểm sức khỏe cao cấp.
• Môi trường làm việc trẻ trung, năng động, khuyến khích sáng tạo và lộ trình thăng tiến rõ ràng."
        };
    }

    public async Task<string> ChatWithAssistantAsync(int userId, string message, int? currentJobId = null, CancellationToken cancellationToken = default)
    {
        Job? job = null;
        if (currentJobId.HasValue && currentJobId.Value > 0)
        {
            job = await _context.Jobs
                .Include(j => j.Company)
                .FirstOrDefaultAsync(j => j.Id == currentJobId.Value && j.DeletedAt == null, cancellationToken);
        }

        var candidate = await _context.Candidates
            .Include(c => c.User)
            .Include(c => c.CandidateSkills).ThenInclude(cs => cs.Skill)
            .FirstOrDefaultAsync(c => c.Id == userId, cancellationToken);

        var prompt = $@"
Bạn là Trợ lý Tuyển dụng & Hướng nghiệp AI thông minh của nền tảng HR Portal.
Người dùng đang hỏi bạn câu sau: ""{message}""

BỐI CẢNH HIỆN TẠI:
{(job != null ? $"- Người dùng đang xem công việc: {job.Title} tại {job.Company?.Name ?? "Công ty"} (Mô tả: {job.Description})" : "- Người dùng đang duyệt trên hệ thống tuyển dụng HR Portal")}
{(candidate != null ? $"- Ứng viên: {candidate.FullName}, Kỹ năng: {string.Join(", ", candidate.CandidateSkills.Select(s => s.Skill?.SkillName))}" : "")}

HÃY TRẢ LỜI:
- Trả lời thân thiện, súc tích, truyền cảm hứng và đi thẳng vào trọng tâm bằng tiếng Việt.
- Đưa ra lời khuyên thực tế, dễ áp dụng giúp ứng viên hoặc nhà tuyển dụng đạt kết quả tốt nhất.
";

        var geminiResponse = await CallGeminiApiAsync(prompt, cancellationToken);
        if (!string.IsNullOrWhiteSpace(geminiResponse))
        {
            return geminiResponse.Trim();
        }

        // Local Smart Chat Engine Fallback
        var lowerMsg = message.ToLower();

        if (lowerMsg.Contains("cv") || lowerMsg.Contains("hồ sơ") || lowerMsg.Contains("hồ sơ xin việc"))
        {
            return "📌 **5 bí quyết giúp CV của bạn thu hút Nhà tuyển dụng ngay lập tức:**\n" +
                   "1. **Định lượng thành tích**: Thay vì chỉ ghi 'phát triển tính năng', hãy ghi 'Tối ưu API giúp giảm thời gian phản hồi 35%'.\n" +
                   "2. **Tập trung từ khóa chuyên môn**: Đưa các kỹ năng công nghệ chính (như C#, React, Docker...) lên phần đầu CV.\n" +
                   "3. **Tóm tắt nghề nghiệp (Summary) ấn tượng**: 2-3 câu nêu rõ số năm kinh nghiệm, thế mạnh cốt lõi và giá trị bạn mang lại.\n" +
                   "4. **Trình bày rõ ràng, súc tích**: Ưu tiên định dạng 1-2 trang, font chữ chuẩn, không sai chính tả.\n" +
                   "5. **Tùy biến CV theo từng Job**: Dùng tính năng *'✨ Phân tích độ phù hợp AI'* trên HR Portal để bổ sung các từ khóa mà công việc đang yêu cầu!";
        }

        if (lowerMsg.Contains("phù hợp") || lowerMsg.Contains("apply") || lowerMsg.Contains("ứng tuyển"))
        {
            if (job != null)
            {
                return $"Đối với vị trí **{job.Title}** tại **{job.Company?.Name}**, bạn có thể bấm nút **\"✨ Phân tích độ phù hợp\"** ngay trên trang chi tiết để AI đối chiếu trực tiếp CV của bạn với yêu cầu công việc. Về cơ bản, vị trí này đánh giá cao tinh thần chủ động và kinh nghiệm thực chiến liên quan!";
            }
            return "Để biết công việc có phù hợp với bạn không, bạn hãy cập nhật đầy đủ kỹ năng và kinh nghiệm trên trang CV cá nhân, sau đó mở chi tiết công việc và dùng tính năng **\"✨ Phân tích độ phù hợp với AI\"** nhé!";
        }

        if (lowerMsg.Contains("lương") || lowerMsg.Contains("thu nhập"))
        {
            return "Mức lương cho các vị trí công nghệ hiện nay dao động linh hoạt theo kinh nghiệm thực tế (Junior: 10-18 triệu, Middle: 18-30 triệu, Senior: từ 30-50+ triệu). Bạn nên tự tin deal mức lương dựa trên các dự án thực tế đã hoàn thành và giá trị bạn mang lại cho doanh nghiệp!";
        }

        if (lowerMsg.Contains("phỏng vấn") || lowerMsg.Contains("câu hỏi"))
        {
            return "3 bí quyết phỏng vấn ghi điểm cao:\n1. **Chuẩn bị phần giới thiệu bản thân trong 2 phút**: Nêu bật dự án thành công nhất.\n2. **Áp dụng mô hình STAR**: Situation (Tình huống) - Task (Nhiệm vụ) - Action (Hành động) - Result (Kết quả có số liệu).\n3. **Đặt câu hỏi ngược lại cho nhà tuyển dụng**: Ví dụ về lộ trình phát triển hoặc văn hóa đội ngũ.";
        }

        return "Chào bạn! Tôi là Trợ lý Tuyển dụng AI của HR Portal. Tôi có thể hỗ trợ bạn phân tích mức độ phù hợp với công việc, tư vấn viết CV tối ưu từ khóa, chuẩn bị câu hỏi phỏng vấn hoặc giải đáp thắc mắc tuyển dụng. Bạn muốn tôi hỗ trợ điều gì?";
    }
}
