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

    public async Task<InterviewQuestionsResult> GenerateInterviewQuestionsAsync(int jobId, int candidateUserId, CancellationToken cancellationToken = default)
    {
        // 1. Fetch Job data
        var job = await _context.Jobs
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == jobId && j.DeletedAt == null, cancellationToken);

        // 2. Fetch Candidate data
        var candidate = await _context.Candidates
            .Include(c => c.User)
            .Include(c => c.CandidateSkills)
                .ThenInclude(cs => cs.Skill)
            .Include(c => c.Experiences)
            .Include(c => c.Educations)
            .FirstOrDefaultAsync(c => c.Id == candidateUserId && c.DeletedAt == null, cancellationToken);

        var jobTitle = job?.Title ?? "Vị trí tuyển dụng";
        var candidateName = candidate?.FullName ?? candidate?.User?.FullName ?? "Ứng viên";

        if (job == null)
        {
            return GenerateLocalInterviewQuestions(jobTitle, candidateName, null, null);
        }

        var candidateSkills = candidate?.CandidateSkills?
            .Select(s => s.Skill?.SkillName ?? "")
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList() ?? new List<string>();

        var candidateExpSummary = candidate?.ExperienceSummary ?? "Chưa có thông tin kinh nghiệm cụ thể";
        var candidateExpYears = candidate?.Experiences?.Count ?? 0;

        // 3. Try Gemini API
        var prompt = $@"
Bạn là Giám đốc Nhân sự cấp cao với 15+ năm kinh nghiệm tuyển dụng và phỏng vấn ứng viên IT/Kỹ thuật.
Hãy tạo BỘ CÂU HỎI PHỎNG VẤN CHUYÊN SÂU VÀ THÔNG MINH nhất để đánh giá ứng viên cho vị trí dưới đây.

THÔNG TIN VỊ TRÍ TUYỂN DỤNG:
- Tiêu đề: {job.Title}
- Công ty: {job.Company?.Name ?? "Doanh nghiệp"}
- Mô tả công việc: {job.Description}
- Yêu cầu: {job.Requirements}

THÔNG TIN ỨNG VIÊN:
- Họ tên: {candidateName}
- Kỹ năng: {(candidateSkills.Count > 0 ? string.Join(", ", candidateSkills) : "Chưa cập nhật")}
- Số kinh nghiệm/dự án: {candidateExpYears}
- Tóm tắt kinh nghiệm: {candidateExpSummary}

YÊU CẦU ĐẦU RA:
Trả về DUY NHẤT một chuỗi JSON hợp lệ (KHÔNG kèm markdown ```json hay bất kỳ chữ nào khác ngoài JSON) với cấu trúc:
{{
  ""categories"": [
    {{
      ""categoryName"": ""Chuyên môn & Kỹ thuật"",
      ""icon"": ""💻"",
      ""questions"": [
        {{
          ""question"": ""<câu hỏi chuyên sâu liên quan đến kỹ năng, công nghệ trong JD>"",
          ""purpose"": ""<mục đích đánh giá năng lực gì>"",
          ""difficulty"": ""<Easy/Medium/Hard>"",
          ""expectedAnswer"": ""<gợi ý câu trả lời tốt mà interviewer có thể tham khảo>""
        }}
      ]
    }},
    {{
      ""categoryName"": ""Tình huống & Hành vi (Behavioral)"",
      ""icon"": ""🧠"",
      ""questions"": [...]
    }},
    {{
      ""categoryName"": ""Giải quyết vấn đề (Problem Solving)"",
      ""icon"": ""🎯"",
      ""questions"": [...]
    }},
    {{
      ""categoryName"": ""Phù hợp văn hóa & Làm việc nhóm"",
      ""icon"": ""🤝"",
      ""questions"": [...]
    }},
    {{
      ""categoryName"": ""Động lực nghề nghiệp & Kỳ vọng"",
      ""icon"": ""🚀"",
      ""questions"": [...]
    }}
  ]
}}

QUAN TRỌNG:
- Mỗi category phải có đúng 3 câu hỏi.
- Câu hỏi phải liên quan trực tiếp đến JD và kỹ năng ứng viên.
- Đa dạng mức difficulty (Easy, Medium, Hard).
- Câu hỏi kỹ thuật phải cụ thể với công nghệ/ngôn ngữ trong JD.
- Mỗi câu phải có expectedAnswer chất lượng, chi tiết ít nhất 2 câu.
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

                var parsed = JsonSerializer.Deserialize<InterviewQuestionsResult>(cleanJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (parsed != null && parsed.Categories?.Count > 0)
                {
                    parsed.JobTitle = job.Title;
                    parsed.CandidateName = candidateName;
                    return parsed;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[GEMINI_PARSE] Could not parse Gemini interview questions response. Falling back to local engine.");
            }
        }

        // 4. Local Fallback Engine
        return GenerateLocalInterviewQuestions(job.Title, candidateName, job, candidateSkills);
    }

    private InterviewQuestionsResult GenerateLocalInterviewQuestions(
        string jobTitle,
        string candidateName,
        Job? job,
        List<string>? candidateSkills)
    {
        var jobText = job != null ? $"{job.Title} {job.Requirements} {job.Description}".ToLower() : "";
        var techKeywords = new List<string>();

        // Extract tech keywords from job
        var commonTechs = new[] { "C#", ".NET", "React", "TypeScript", "JavaScript", "SQL", "Docker", "Kubernetes", "AWS", "Azure", "Python", "Java", "Spring", "Node.js", "Angular", "Vue", "Git", "CI/CD", "REST API", "Microservices" };
        foreach (var tech in commonTechs)
        {
            if (jobText.Contains(tech.ToLower()))
                techKeywords.Add(tech);
        }
        if (techKeywords.Count == 0) techKeywords.AddRange(new[] { "Công nghệ chính", "Framework" });

        var techStack = string.Join(", ", techKeywords.Take(4));

        return new InterviewQuestionsResult
        {
            JobTitle = jobTitle,
            CandidateName = candidateName,
            Categories = new List<InterviewQuestionCategory>
            {
                new()
                {
                    CategoryName = "Chuyên môn & Kỹ thuật",
                    Icon = "💻",
                    Questions = new List<InterviewQuestion>
                    {
                        new() { Question = $"Hãy mô tả kinh nghiệm sử dụng {techStack} trong dự án thực tế gần nhất của bạn. Bạn đảm nhận vai trò gì?", Purpose = "Đánh giá chiều sâu kinh nghiệm thực chiến", Difficulty = "Medium", ExpectedAnswer = $"Ứng viên nên mô tả rõ ràng dự án, vai trò cụ thể, quy mô team, và các thách thức kỹ thuật đã giải quyết liên quan đến {techStack}." },
                        new() { Question = $"Khi gặp một bug production critical liên quan đến {(techKeywords.Count > 0 ? techKeywords[0] : "hệ thống")}, quy trình debug và hotfix của bạn như thế nào?", Purpose = "Kiểm tra kỹ năng xử lý sự cố và tư duy hệ thống", Difficulty = "Hard", ExpectedAnswer = "Ứng viên cần trình bày quy trình rõ ràng: reproduce issue → phân tích log/trace → isolate root cause → implement fix → test → deploy. Điểm cộng nếu đề cập monitoring, alert, post-mortem." },
                        new() { Question = $"Bạn hiểu gì về kiến trúc phần mềm (ví dụ: Clean Architecture, CQRS, Microservices)? Hãy chia sẻ cách áp dụng trong dự án thực.", Purpose = "Đánh giá tư duy kiến trúc và design patterns", Difficulty = "Hard", ExpectedAnswer = "Ứng viên cần giải thích đúng concepts, ưu/nhược điểm, và chia sẻ ví dụ cụ thể về cách áp dụng trong dự án thực tế. Nên đề cập separation of concerns, testability, scalability." }
                    }
                },
                new()
                {
                    CategoryName = "Tình huống & Hành vi (Behavioral)",
                    Icon = "🧠",
                    Questions = new List<InterviewQuestion>
                    {
                        new() { Question = "Hãy kể về một lần bạn phải xử lý mâu thuẫn ý kiến kỹ thuật trong team. Bạn giải quyết thế nào?", Purpose = "Đánh giá kỹ năng giải quyết xung đột và teamwork", Difficulty = "Medium", ExpectedAnswer = "Sử dụng mô hình STAR: nêu rõ tình huống, vai trò, hành động (lắng nghe, đưa ra dữ liệu/benchmark để thuyết phục), và kết quả tích cực. Điểm cộng nếu nhấn mạnh compromise và mutual respect." },
                        new() { Question = "Bạn đã bao giờ phải làm việc với deadline cực kỳ gấp mà scope lại lớn? Bạn xử lý ra sao?", Purpose = "Kiểm tra khả năng quản lý áp lực và ưu tiên công việc", Difficulty = "Medium", ExpectedAnswer = "Ứng viên cần thể hiện kỹ năng prioritization (MoSCoW), communicate proactively với stakeholders, và biết cách negotiate scope hoặc timeline một cách chuyên nghiệp." },
                        new() { Question = "Kể về lần bạn chủ động đề xuất cải tiến quy trình hoặc công nghệ mới cho team/dự án?", Purpose = "Đánh giá proactiveness và ownership mindset", Difficulty = "Easy", ExpectedAnswer = "Ứng viên chia sẻ sáng kiến cụ thể (VD: introduce CI/CD, code review process, monitoring tool), cách thuyết phục team/manager, và impact đo lường được sau khi áp dụng." }
                    }
                },
                new()
                {
                    CategoryName = "Giải quyết vấn đề (Problem Solving)",
                    Icon = "🎯",
                    Questions = new List<InterviewQuestion>
                    {
                        new() { Question = "Thiết kế một hệ thống notification real-time cho ứng dụng web có 10,000 concurrent users. Bạn sẽ tiếp cận như thế nào?", Purpose = "Đánh giá system design thinking và scalability awareness", Difficulty = "Hard", ExpectedAnswer = "Nên đề cập WebSocket/SignalR, message queue (RabbitMQ/Kafka), caching layer (Redis), database design cho notifications, fan-out strategy, và cân nhắc về availability/latency trade-off." },
                        new() { Question = "API endpoint bạn viết response time trung bình 3 giây. Bạn sẽ tối ưu như thế nào?", Purpose = "Kiểm tra tư duy performance optimization", Difficulty = "Medium", ExpectedAnswer = "Phân tích bottleneck (profiling, APM), kiểm tra N+1 query, index database, caching strategy, async processing, pagination, CDN cho static resources. Nên approach có hệ thống từ đo lường → phân tích → optimize → verify." },
                        new() { Question = "Bạn nhận một legacy codebase không có documentation và test. Bước đầu tiên bạn sẽ làm gì?", Purpose = "Đánh giá khả năng tiếp cận và refactor legacy code", Difficulty = "Medium", ExpectedAnswer = "Đọc hiểu domain → map dependencies → viết characterization tests → refactor từng phần nhỏ (Strangler Fig pattern) → document dần. Không refactor toàn bộ cùng lúc. Nên nhấn mạnh risk management." }
                    }
                },
                new()
                {
                    CategoryName = "Phù hợp văn hóa & Làm việc nhóm",
                    Icon = "🤝",
                    Questions = new List<InterviewQuestion>
                    {
                        new() { Question = "Bạn thích phong cách quản lý nào? Micromanagement hay autonomy? Vì sao?", Purpose = "Đánh giá culture fit và preferred working style", Difficulty = "Easy", ExpectedAnswer = "Không có câu trả lời đúng/sai. Đánh giá sự phù hợp với văn hóa team hiện tại. Ứng viên senior nên prefer autonomy with accountability, còn junior có thể cần structured guidance." },
                        new() { Question = "Nếu senior developer trong team code quality không tốt nhưng ship nhanh, bạn sẽ phản ứng thế nào?", Purpose = "Kiểm tra nguyên tắc chất lượng và diplomatic communication", Difficulty = "Hard", ExpectedAnswer = "Ứng viên cần balance giữa respect seniority và maintain quality. Nên đề xuất constructive: pair programming, thiết lập coding standards, code review checklist, chứ không phải confront trực tiếp." },
                        new() { Question = "Bạn có kinh nghiệm mentoring junior hay sharing knowledge trong team không?", Purpose = "Đánh giá leadership potential và willingness to grow others", Difficulty = "Easy", ExpectedAnswer = "Chia sẻ cụ thể: tech talks, pair programming sessions, documentation, onboarding buddy. Điểm cộng nếu có ví dụ junior grow thành mid-level nhờ sự hướng dẫn." }
                    }
                },
                new()
                {
                    CategoryName = "Động lực nghề nghiệp & Kỳ vọng",
                    Icon = "🚀",
                    Questions = new List<InterviewQuestion>
                    {
                        new() { Question = $"Vì sao bạn quan tâm đến vị trí {jobTitle} tại công ty chúng tôi? Điều gì thu hút bạn nhất?", Purpose = "Đánh giá motivation và sự chuẩn bị của ứng viên", Difficulty = "Easy", ExpectedAnswer = "Ứng viên cần thể hiện đã research về công ty, hiểu sản phẩm/culture, và map được career goal cá nhân với vị trí ứng tuyển. Red flag nếu chỉ quan tâm salary." },
                        new() { Question = "Bạn nhìn thấy mình ở đâu trong 2-3 năm tới về mặt kỹ thuật và career?", Purpose = "Đánh giá định hướng phát triển và retention potential", Difficulty = "Easy", ExpectedAnswer = "Career path rõ ràng: specialist track (deep tech) hoặc management track (tech lead). Nên thể hiện growth mindset, continuous learning, và alignment với company direction." },
                        new() { Question = "Ngoài lương, yếu tố nào quan trọng nhất với bạn khi chọn nơi làm việc?", Purpose = "Hiểu giá trị cốt lõi và expectation thực sự của ứng viên", Difficulty = "Medium", ExpectedAnswer = "Growth opportunity, team culture, interesting projects, work-life balance, learning budget... Giúp nhà tuyển dụng hiểu match với EVP (Employer Value Proposition) hiện tại." }
                    }
                }
            }
        };
    }

    public async Task<List<AssessmentQuestionItem>> GenerateAssessmentQuestionsAsync(
        int jobId,
        string testType,
        int totalQuestions,
        CancellationToken cancellationToken = default)
    {
        totalQuestions = Math.Clamp(totalQuestions, 5, 30);
        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);
        var jobTitle = job?.Title ?? "Kỹ sư phần mềm";
        var requirements = job?.Requirements ?? string.Empty;
        var description = job?.Description ?? string.Empty;

        var apiKey = GetApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return GenerateLocalAssessmentQuestions(jobTitle, testType, totalQuestions, requirements);
        }

        try
        {
            var prompt = $@"
Bạn là một chuyên gia tuyển dụng nhân sự cấp cao và giám khảo khảo thí kỹ thuật.
Hãy tạo một bộ đề thi trắc nghiệm khách quan gồm chính xác {totalQuestions} câu hỏi cho vị trí: ""{jobTitle}""
Loại bài thi: ""{testType}"" (Các loại có thể là: TECHNICAL - Chuyên môn kỹ thuật, LOGIC - Tư duy logic & giải quyết vấn đề, ENGLISH - Tiếng Anh chuyên ngành, CODING - Kiến trúc & Mã nguồn).

Thông tin yêu cầu công việc (JD):
- Mô tả: {description}
- Yêu cầu: {requirements}

Quy định cấu trúc:
1. Mỗi câu hỏi phải có đúng 4 đáp án lựa chọn (A, B, C, D).
2. Chỉ có DUY NHẤT 1 đáp án đúng, chỉ rõ CorrectOptionIndex từ 0 đến 3 (0 tương ứng lựa chọn thứ nhất, 1 là thứ hai, v.v.).
3. Có lời giải thích ngắn gọn, súc tích (Explanation).
4. Phân bổ độ khó hài hòa: ~30% Easy, 50% Medium, 20% Hard.

BẠN BẮT BUỘC CHỈ ĐƯỢC TRẢ VỀ JSON THUẦN TÚY KHÔNG KÈM MARKDOWN HOẶC GIẢI THÍCH, theo cấu trúc sau:
[
  {{
    ""id"": 1,
    ""question"": ""<Nội dung câu hỏi rõ ràng, thực tế>"",
    ""options"": [
      ""<Phương án A>"",
      ""<Phương án B>"",
      ""<Phương án C>"",
      ""<Phương án D>""
    ],
    ""correctOptionIndex"": 0,
    ""explanation"": ""<Giải thích vì sao đáp án này đúng>"",
    ""category"": ""{testType}"",
    ""difficulty"": ""Medium""
  }}
]
";

            var geminiResponse = await CallGeminiApiAsync(prompt, cancellationToken);
            if (!string.IsNullOrWhiteSpace(geminiResponse))
            {
                var cleanJson = geminiResponse.Trim();
                if (cleanJson.StartsWith("```json")) cleanJson = cleanJson.Substring(7);
                if (cleanJson.StartsWith("```")) cleanJson = cleanJson.Substring(3);
                if (cleanJson.EndsWith("```")) cleanJson = cleanJson.Substring(0, cleanJson.Length - 3);
                cleanJson = cleanJson.Trim();

                var questions = JsonSerializer.Deserialize<List<AssessmentQuestionItem>>(cleanJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (questions != null && questions.Count > 0)
                {
                    for (int i = 0; i < questions.Count; i++)
                    {
                        questions[i].Id = i + 1;
                    }
                    return questions;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[GEMINI] Assessment generation failed. Using local questions generator.");
        }

        return GenerateLocalAssessmentQuestions(jobTitle, testType, totalQuestions, requirements);
    }

    private List<AssessmentQuestionItem> GenerateLocalAssessmentQuestions(
        string jobTitle,
        string testType,
        int count,
        string requirements)
    {
        var list = new List<AssessmentQuestionItem>();
        var typeLower = testType.ToUpperInvariant();

        if (typeLower.Contains("ENGLISH"))
        {
            list.AddRange(new[]
            {
                new AssessmentQuestionItem
                {
                    Id = 1,
                    Question = "Choose the correct sentence to communicate a project delay to international stakeholders:",
                    Options = new()
                    {
                        "Due to unforeseen technical challenges, we anticipate a two-day delay in our release schedule.",
                        "Because of bad bugs, the project is stop two days now.",
                        "We delay the project because we don't have enough time to test it.",
                        "The schedule is postponing since two days ago."
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "Option A provides clear, professional business communication with appropriate diplomatic phrasing.",
                    Category = "Professional Communication",
                    Difficulty = "Medium"
                },
                new AssessmentQuestionItem
                {
                    Id = 2,
                    Question = "In software architecture discussions, what does the idiom 'trade-off' mean?",
                    Options = new()
                    {
                        "A compromise where one benefit is balanced against another competing requirement.",
                        "Trading company stocks between employees.",
                        "Replacing all old code with a newly purchased framework.",
                        "A fatal bug that crashes the production database."
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "A trade-off is a situational decision that involves diminishing or losing one quality or aspect of something in return for gains in other aspects.",
                    Category = "Technical Vocabulary",
                    Difficulty = "Easy"
                },
                new AssessmentQuestionItem
                {
                    Id = 3,
                    Question = "Which word best completes: 'The team must _____ backward compatibility when publishing API v2.'?",
                    Options = new() { "ensure", "insure", "assure", "reassure" },
                    CorrectOptionIndex = 0,
                    Explanation = "'Ensure' means to make certain that something will occur or be so.",
                    Category = "Grammar & Vocabulary",
                    Difficulty = "Medium"
                },
                new AssessmentQuestionItem
                {
                    Id = 4,
                    Question = "What is the best way to politely disagree in a technical code review comment?",
                    Options = new()
                    {
                        "This code is terrible. Rewrite it immediately.",
                        "Have you considered using a hash map here? It might improve lookup complexity from O(N) to O(1).",
                        "I don't like this syntax, change it to what I wrote.",
                        "Why did you write this? It makes no sense."
                    },
                    CorrectOptionIndex = 1,
                    Explanation = "Polite, constructive feedback asks guiding questions and provides clear technical justification.",
                    Category = "Collaboration",
                    Difficulty = "Easy"
                }
            });
        }
        else if (typeLower.Contains("LOGIC"))
        {
            list.AddRange(new[]
            {
                new AssessmentQuestionItem
                {
                    Id = 1,
                    Question = "Có 5 công việc A, B, C, D, E cần thực hiện. A phải xong trước B; C phải xong trước D; B phải xong trước C; E không phụ thuộc. Thứ tự nào sau đây là KHÔNG thể?",
                    Options = new()
                    {
                        "E -> A -> B -> C -> D",
                        "A -> E -> B -> C -> D",
                        "A -> B -> D -> C -> E",
                        "A -> B -> C -> D -> E"
                    },
                    CorrectOptionIndex = 2,
                    Explanation = "Ràng buộc yêu cầu C phải xong trước D (C -> D). Phương án C có D trước C nên vi phạm.",
                    Category = "Tư duy logic & Thứ tự công việc",
                    Difficulty = "Medium"
                },
                new AssessmentQuestionItem
                {
                    Id = 2,
                    Question = "Một hệ thống xử lý trung bình 1,000 yêu cầu/giây. 10% yêu cầu cần truy vấn database mất 100ms, 90% còn lại dùng cache mất 5ms. Thời gian xử lý trung bình (Weighted Average Latency) là bao nhiêu?",
                    Options = new()
                    {
                        "14.5 ms",
                        "52.5 ms",
                        "10 ms",
                        "20 ms"
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "Latency trung bình = (0.10 * 100ms) + (0.90 * 5ms) = 10ms + 4.5ms = 14.5 ms.",
                    Category = "Tính toán số liệu & Ước tính hệ thống",
                    Difficulty = "Medium"
                },
                new AssessmentQuestionItem
                {
                    Id = 3,
                    Question = "Nếu 'Mọi lập trình viên giỏi đều có tư duy logic' và 'Một số người có tư duy logic thích chơi cờ vua'. Kết luận nào sau đây chắc chắn đúng?",
                    Options = new()
                    {
                        "Mọi lập trình viên giỏi đều thích chơi cờ vua.",
                        "Có ít nhất một lập trình viên giỏi thích chơi cờ vua.",
                        "Những người không có tư duy logic không phải là lập trình viên giỏi.",
                        "Người thích chơi cờ vua chắc chắn là lập trình viên giỏi."
                    },
                    CorrectOptionIndex = 2,
                    Explanation = "Mệnh đề đảo phản đề (Contrapositive) của 'A -> B' là 'Không B -> Không A'.",
                    Category = "Logic hình thức",
                    Difficulty = "Hard"
                },
                new AssessmentQuestionItem
                {
                    Id = 4,
                    Question = "Một thuật toán nhị phân (Binary Search) trên mảng đã sắp xếp có 1,024 phần tử. Số lần so sánh tối đa trong trường hợp xấu nhất là bao nhiêu?",
                    Options = new() { "10", "11", "512", "1,024" },
                    CorrectOptionIndex = 0,
                    Explanation = "Độ phức tạp Binary Search là O(log2 N). Với N = 1024, log2(1024) = 10 lần so sánh tối đa.",
                    Category = "Thuật toán & Giải thuật",
                    Difficulty = "Easy"
                }
            });
        }
        else if (typeLower.Contains("CODING"))
        {
            list.AddRange(new[]
            {
                new AssessmentQuestionItem
                {
                    Id = 1,
                    Question = "Trong lập trình hướng đối tượng, nguyên lý Single Responsibility Principle (chữ S trong SOLID) yêu cầu điều gì?",
                    Options = new()
                    {
                        "Một class chỉ nên có duy nhất một lý do để thay đổi.",
                        "Một hàm chỉ được nhận tối đa một tham số truyền vào.",
                        "Hệ thống chỉ nên có một người phụ trách viết code.",
                        "Mọi đối tượng phải kế thừa từ một interface duy nhất."
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "SRP phát biểu rằng một module hay class chỉ nên chịu trách nhiệm về một tác nhân hoặc một lý do thay đổi duy nhất.",
                    Category = "Clean Code & Design Principles",
                    Difficulty = "Easy"
                },
                new AssessmentQuestionItem
                {
                    Id = 2,
                    Question = "Khi xảy ra lỗi N+1 Query trong ORM (Entity Framework / Hibernate), giải pháp tối ưu phổ biến nhất là gì?",
                    Options = new()
                    {
                        "Sử dụng Eager Loading (Include / JOIN) để lấy dữ liệu quan hệ trong một query duy nhất.",
                        "Tăng kích thước RAM của máy chủ Database.",
                        "Chuyển toàn bộ dữ liệu sang file Excel cục bộ.",
                        "Tắt tính năng Lazy Loading và gọi vòng lặp thủ công."
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "Eager Loading sử dụng câu lệnh SQL JOIN để nạp trước quan hệ cha - con, tránh việc lặp N lần truy vấn con.",
                    Category = "Database & ORM Optimization",
                    Difficulty = "Medium"
                },
                new AssessmentQuestionItem
                {
                    Id = 3,
                    Question = "Cấu trúc dữ liệu nào có thời gian tra cứu trung bình là O(1)?",
                    Options = new() { "Hash Table (Dictionary / Map)", "Linked List", "Binary Search Tree", "Array (tìm kiếm tuần tự)" },
                    CorrectOptionIndex = 0,
                    Explanation = "Bảng băm (Hash Table) sử dụng hàm băm để truy xuất phần tử theo khóa với độ phức tạp trung bình O(1).",
                    Category = "Data Structures",
                    Difficulty = "Easy"
                },
                new AssessmentQuestionItem
                {
                    Id = 4,
                    Question = "Mô hình kiến trúc CQRS (Command Query Responsibility Segregation) phân tách hai luồng nào?",
                    Options = new()
                    {
                        "Phân tách thao tác ghi dữ liệu (Command) và thao tác đọc dữ liệu (Query).",
                        "Phân tách tầng Client và tầng Server.",
                        "Phân tách Database quan hệ (SQL) và NoSQL.",
                        "Phân tách lập trình viên Frontend và Backend."
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "CQRS tách biệt mô hình đọc (Query) và mô hình cập nhật (Command) để tối ưu hóa hiệu năng, bảo mật và khả năng mở rộng.",
                    Category = "Software Architecture",
                    Difficulty = "Hard"
                }
            });
        }
        else
        {
            // Default: TECHNICAL
            list.AddRange(new[]
            {
                new AssessmentQuestionItem
                {
                    Id = 1,
                    Question = $"Trong dự án thực tế với vị trí {jobTitle}, kỹ thuật nào sau đây giúp cải thiện tốc độ phản hồi của API đáng kể nhất?",
                    Options = new()
                    {
                        "Áp dụng In-memory Caching (Redis/MemoryCache) cho dữ liệu đọc thường xuyên ít biến động.",
                        "Viết tất cả logic vào một Stored Procedure dài hàng nghìn dòng.",
                        "Bỏ kiểm tra validation đầu vào để giảm thời gian xử lý.",
                        "Tăng timeout kết nối HTTP lên 60 giây."
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "Caching giảm tải truy vấn trực tiếp vào database, phản hồi từ RAM chỉ mất vài mili-giây.",
                    Category = "API Performance",
                    Difficulty = "Medium"
                },
                new AssessmentQuestionItem
                {
                    Id = 2,
                    Question = "Khi giao tiếp thời gian thực giữa máy chủ và trình duyệt web (Real-time data), giao thức nào sau đây được ưu tiên sử dụng?",
                    Options = new()
                    {
                        "WebSocket (hoặc thư viện abstraction như SignalR / Socket.io)",
                        "Gửi liên tục yêu cầu HTTP GET mỗi 100ms (Short Polling vô hạn)",
                        "Gửi email định kỳ mỗi giây",
                        "FTP transfer file log"
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "WebSocket duy trì kết nối song công (full-duplex) liên tục, giảm thiểu overhead so với HTTP polling.",
                    Category = "Real-time Communication",
                    Difficulty = "Easy"
                },
                new AssessmentQuestionItem
                {
                    Id = 3,
                    Question = "Để bảo vệ hệ thống trước tấn công SQL Injection, phương pháp nào sau đây là bắt buộc phải áp dụng?",
                    Options = new()
                    {
                        "Sử dụng Parameterized Queries hoặc ORM hỗ trợ tham số hóa tự động.",
                        "Nối trực tiếp chuỗi chuỗi người dùng nhập vào câu lệnh SQL.",
                        "Mã hóa mật khẩu bằng thuật toán MD5 không có salt.",
                        "Ẩn thanh địa chỉ URL của trình duyệt."
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "Parameterized Queries tách biệt mã lệnh SQL và dữ liệu tham số, ngăn chặn hoàn toàn việc thực thi mã injection.",
                    Category = "Security & Best Practices",
                    Difficulty = "Medium"
                },
                new AssessmentQuestionItem
                {
                    Id = 4,
                    Question = "Trong hệ thống microservices hoặc phân tán, tính chất Idempotency của một API nghĩa là gì?",
                    Options = new()
                    {
                        "Thực hiện gọi API nhiều lần với cùng dữ liệu đầu vào sẽ tạo ra cùng kết quả như gọi một lần duy nhất mà không gây tác dụng phụ ngoài ý muốn.",
                        "API phản hồi trong thời gian dưới 10 mili-giây.",
                        "API không bao giờ trả về mã lỗi HTTP 500.",
                        "API chỉ chấp nhận duy nhất một kết nối đồng thời tại một thời điểm."
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "Idempotency đảm bảo an toàn khi client retry request do mạng chập chờn, tránh duplicate giao dịch hoặc bản ghi.",
                    Category = "System Design",
                    Difficulty = "Hard"
                },
                new AssessmentQuestionItem
                {
                    Id = 5,
                    Question = "Khi làm việc với Git trong team, lệnh nào giúp kết hợp các commit mới nhất từ nhánh chính (main) vào nhánh tính năng mà giữ cho lịch sử commit tuyến tính sạch sẽ?",
                    Options = new()
                    {
                        "git rebase main",
                        "git reset --hard HEAD~10",
                        "git push --force origin main",
                        "git clean -fdx"
                    },
                    CorrectOptionIndex = 0,
                    Explanation = "git rebase áp dụng lại các commit nhánh tính năng lên đỉnh của nhánh đích, tạo lịch sử commit tuyến tính.",
                    Category = "DevOps & Git Flow",
                    Difficulty = "Medium"
                }
            });
        }

        // Bổ sung thêm câu hỏi nếu chưa đủ số lượng yêu cầu
        var currentCount = list.Count;
        while (list.Count < count)
        {
            var idx = list.Count + 1;
            list.Add(new AssessmentQuestionItem
            {
                Id = idx,
                Question = $"Câu hỏi chuyên sâu {idx}: Hãy lựa chọn phương án tối ưu trong thiết kế hệ thống phần mềm đáp ứng tính mở rộng cao (Scalability):",
                Options = new()
                {
                    "Thiết kế Stateless Services để dễ dàng Horizontal Scaling sau Load Balancer.",
                    "Lưu toàn bộ Session của hàng triệu người dùng vào bộ nhớ RAM của một server đơn lẻ duy nhất.",
                    "Sử dụng một cơ sở dữ liệu duy nhất không phân vùng hoặc index cho toàn bộ bảng hàng trăm triệu dòng.",
                    "Không triển khai hệ thống log và giám sát (Monitoring/Alerting)."
                },
                CorrectOptionIndex = 0,
                Explanation = "Kiến trúc Stateless cho phép bổ sung thêm các node server phía sau Load Balancer mà không lo mất phiên làm việc của người dùng.",
                Category = "System Architecture",
                Difficulty = "Medium"
            });
        }

        return list.Take(count).ToList();
    }
}
