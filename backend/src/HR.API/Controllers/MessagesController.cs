using System;
using System.Linq;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using HR.API.Hubs;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/messages")]
[Authorize]
public class MessagesController(
    ApplicationDbContext context,
    ICurrentUserService currentUserService,
    IEmailService emailService,
    IHubContext<ChatHub> chatHub,
    IHubContext<NotificationHub> notificationHub) : ControllerBase
{
    public class SendMessageDto
    {
        public int? ConversationId { get; set; }
        public int? ApplicationId { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    public class ShortlistAndChatDto
    {
        public int ApplicationId { get; set; }
        public string? InitialMessage { get; set; }
    }

    /// <summary>
    /// Lấy danh sách cuộc trò chuyện của người dùng hiện tại (Hợp nhất 1 cuộc trò chuyện duy nhất cho mỗi cặp Ứng viên - Doanh nghiệp)
    /// </summary>
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var userId = currentUserService.UserId;

        // 1. Lấy tất cả hội thoại của user
        var rawConvos = await context.Conversations
            .Where(c => c.DeletedAt == null && (c.CandidateUserId == userId || c.EmployerUserId == userId))
            .Include(c => c.Job)
                .ThenInclude(j => j!.Company)
            .Include(c => c.CandidateUser)
            .Include(c => c.EmployerUser)
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync();

        // 2. Tự động gộp các cuộc hội thoại trùng lặp giữa cùng 1 cặp (CandidateUserId, EmployerUserId)
        var grouped = rawConvos.GroupBy(c => (c.CandidateUserId, c.EmployerUserId)).ToList();
        var hasChanges = false;
        var activeConvos = new List<Conversation>();

        foreach (var group in grouped)
        {
            var primary = group.OrderByDescending(g => g.LastMessageAt).First();
            var duplicates = group.Where(g => g.Id != primary.Id).ToList();

            if (duplicates.Any())
            {
                foreach (var dup in duplicates)
                {
                    // Di chuyển tin nhắn từ hội thoại trùng lặp sang hội thoại chính
                    var dupMessages = await context.ChatMessages
                        .Where(m => m.ConversationId == dup.Id && m.DeletedAt == null)
                        .ToListAsync();

                    foreach (var msg in dupMessages)
                    {
                        msg.ConversationId = primary.Id;
                    }

                    if (dup.CandidateUnreadCount > 0)
                        primary.CandidateUnreadCount += dup.CandidateUnreadCount;
                    if (dup.EmployerUnreadCount > 0)
                        primary.EmployerUnreadCount += dup.EmployerUnreadCount;

                    dup.DeletedAt = DateTime.Now;
                    hasChanges = true;
                }

                // Cập nhật tin nhắn gần nhất cho hội thoại chính
                var latestMsg = await context.ChatMessages
                    .Where(m => m.ConversationId == primary.Id && m.DeletedAt == null)
                    .OrderByDescending(m => m.SentAt)
                    .FirstOrDefaultAsync();

                if (latestMsg != null)
                {
                    primary.LastMessageAt = latestMsg.SentAt;
                    primary.LastMessageContent = latestMsg.Content;
                    primary.LastSenderId = latestMsg.SenderId;
                }
            }

            activeConvos.Add(primary);
        }

        if (hasChanges)
        {
            await context.SaveChangesAsync();
        }

        // 3. Lấy thông tin tất cả các vị trí ứng tuyển liên quan giữa Ứng viên và Doanh nghiệp
        var candidateUserIds = activeConvos.Select(c => c.CandidateUserId).Distinct().ToList();
        var candidates = await context.Candidates
            .Include(c => c.User)
            .Where(c => candidateUserIds.Contains(c.Id) && c.DeletedAt == null)
            .ToListAsync();
        var candidateMap = candidates.ToDictionary(c => c.Id, c => c);

        var candidateUsers = await context.Users
            .Where(u => candidateUserIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u);

        var employerUserIds = activeConvos.Select(c => c.EmployerUserId).Distinct().ToList();
        var employers = await context.Employers
            .Include(e => e.Company)
            .Where(e => employerUserIds.Contains(e.UserId) && e.DeletedAt == null)
            .ToListAsync();
        var employerMap = employers.ToDictionary(e => e.UserId, e => e);

        var candidateIds = candidates.Select(c => c.Id).ToList();
        var companyIds = employers.Select(e => e.CompanyId).Distinct().ToList();

        var allApplications = await context.Applications
            .Where(a => candidateUserIds.Contains(a.CandidateId) && a.DeletedAt == null)
            .Include(a => a.Job)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .OrderByDescending(a => a.AppliedAt)
            .Select(a => new
            {
                a.Id,
                a.CandidateId,
                CandidateName = a.Candidate.FullName,
                CandidateAvatar = a.Candidate.AvatarUrl,
                CompanyId = a.Job.CompanyId,
                a.JobId,
                JobTitle = a.Job.Title,
                Status = a.Status.ToString(),
                a.AppliedAt
            })
            .ToListAsync();

        var results = activeConvos
            .OrderByDescending(c => c.LastMessageAt)
            .Select(c =>
            {
                var candProfile = candidateMap.GetValueOrDefault(c.CandidateUserId) 
                    ?? c.CandidateUser?.Candidate 
                    ?? c.Application?.Candidate;
                var candUser = candidateUsers.GetValueOrDefault(c.CandidateUserId) 
                    ?? c.CandidateUser 
                    ?? candProfile?.User;

                var empInfo = employerMap.GetValueOrDefault(c.EmployerUserId);
                var companyId = empInfo?.CompanyId ?? (c.Job?.CompanyId ?? 0);
                var companyName = empInfo?.Company?.Name ?? (c.Job?.Company?.Name ?? "Doanh nghiệp");

                var apps = allApplications
                    .Where(a => a.CandidateId == c.CandidateUserId && (companyId == 0 || a.CompanyId == companyId))
                    .Select(a => new
                    {
                        applicationId = a.Id,
                        jobId = a.JobId,
                        jobTitle = a.JobTitle,
                        status = a.Status,
                        appliedAt = a.AppliedAt
                    })
                    .ToList();

                var mainJobTitle = apps.FirstOrDefault()?.jobTitle ?? (c.Job != null ? c.Job.Title : (c.Title ?? "Trao đổi cơ hội nghề nghiệp"));

                var candidateName = !string.IsNullOrWhiteSpace(candProfile?.FullName)
                    ? candProfile.FullName
                    : (!string.IsNullOrWhiteSpace(candUser?.FullName)
                        ? candUser.FullName
                        : (apps.FirstOrDefault() != null && !string.IsNullOrWhiteSpace(allApplications.FirstOrDefault(a => a.CandidateId == c.CandidateUserId)?.CandidateName)
                            ? allApplications.FirstOrDefault(a => a.CandidateId == c.CandidateUserId)?.CandidateName!
                            : "Ứng viên"));

                var candidateAvatar = candProfile?.AvatarUrl 
                    ?? candUser?.AvatarUrl 
                    ?? allApplications.FirstOrDefault(a => a.CandidateId == c.CandidateUserId)?.CandidateAvatar;

                var employerName = !string.IsNullOrWhiteSpace(companyName) && companyName != "Doanh nghiệp"
                    ? companyName
                    : (c.EmployerUser != null ? c.EmployerUser.FullName : "Nhà tuyển dụng");

                var employerAvatar = c.Job?.Company?.LogoUrl 
                    ?? c.EmployerUser?.Employer?.Company?.LogoUrl 
                    ?? c.EmployerUser?.AvatarUrl;

                return new
                {
                    c.Id,
                    c.ApplicationId,
                    c.JobId,
                    JobTitle = mainJobTitle,
                    CompanyId = companyId,
                    CompanyName = companyName,
                    c.CandidateUserId,
                    CandidateName = candidateName,
                    CandidateAvatar = candidateAvatar,
                    c.EmployerUserId,
                    EmployerName = employerName,
                    EmployerAvatar = employerAvatar,
                    c.LastMessageAt,
                    c.LastMessageContent,
                    c.LastSenderId,
                    UnreadCount = c.CandidateUserId == userId ? c.CandidateUnreadCount : c.EmployerUnreadCount,
                    AppliedJobs = apps
                };
            })
            .ToList();

        return Ok(ApiResponse<object>.Ok(results));
    }

    /// <summary>
    /// Lấy chi tiết cuộc trò chuyện và toàn bộ tin nhắn
    /// </summary>
    [HttpGet("conversations/{id:int}")]
    public async Task<IActionResult> GetConversationById(int id)
    {
        var userId = currentUserService.UserId;

        var convo = await context.Conversations
            .Where(c => c.Id == id && c.DeletedAt == null && (c.CandidateUserId == userId || c.EmployerUserId == userId))
            .Include(c => c.Job)
                .ThenInclude(j => j!.Company)
            .Include(c => c.CandidateUser)
                .ThenInclude(u => u!.Candidate)
            .Include(c => c.EmployerUser)
                .ThenInclude(u => u!.Employer)
                    .ThenInclude(e => e!.Company)
            .Include(c => c.Application)
                .ThenInclude(a => a!.Candidate)
                    .ThenInclude(cand => cand!.User)
            .FirstOrDefaultAsync();

        if (convo == null)
        {
            return NotFound(ApiResponse<object>.Fail("CONVERSATION_NOT_FOUND", "Cuộc hội thoại không tồn tại hoặc bạn không có quyền truy cập."));
        }

        var messages = await context.ChatMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == id && m.DeletedAt == null)
            .Include(m => m.Sender)
                .ThenInclude(s => s!.Candidate)
            .Include(m => m.Sender)
                .ThenInclude(s => s!.Employer)
                    .ThenInclude(e => e!.Company)
            .OrderBy(m => m.SentAt)
            .Select(m => new
            {
                m.Id,
                m.ConversationId,
                m.SenderId,
                SenderName = !string.IsNullOrWhiteSpace(m.Sender != null ? m.Sender.FullName : null)
                    ? m.Sender!.FullName
                    : (m.Sender != null && m.Sender.Candidate != null && !string.IsNullOrWhiteSpace(m.Sender.Candidate.FullName)
                        ? m.Sender.Candidate.FullName
                        : (m.Sender != null && m.Sender.Employer != null && m.Sender.Employer.Company != null
                            ? m.Sender.Employer.Company.Name
                            : "Thành viên")),
                SenderAvatar = m.Sender != null ? (m.Sender.AvatarUrl ?? (m.Sender.Candidate != null ? m.Sender.Candidate.AvatarUrl : null)) : null,
                m.Content,
                m.IsRead,
                m.SentAt,
                IsMine = m.SenderId == userId
            })
            .ToListAsync();

        // Đánh dấu đã đọc nếu có tin nhắn chưa đọc
        if (convo.CandidateUserId == userId && convo.CandidateUnreadCount > 0)
        {
            convo.CandidateUnreadCount = 0;
            await context.SaveChangesAsync();
        }
        else if (convo.EmployerUserId == userId && convo.EmployerUnreadCount > 0)
        {
            convo.EmployerUnreadCount = 0;
            await context.SaveChangesAsync();
        }

        // Lấy danh sách các vị trí ứng tuyển của Ứng viên này tại Công ty
        var candidate = await context.Candidates
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == convo.CandidateUserId && c.DeletedAt == null);

        var candidateUser = convo.CandidateUser 
            ?? candidate?.User 
            ?? await context.Users.FirstOrDefaultAsync(u => u.Id == convo.CandidateUserId);

        var employer = await context.Employers
            .Include(e => e.Company)
            .FirstOrDefaultAsync(e => e.UserId == convo.EmployerUserId && e.DeletedAt == null);

        var companyId = employer?.CompanyId ?? (convo.Job?.CompanyId ?? 0);
        var companyName = employer?.Company?.Name ?? (convo.Job?.Company?.Name ?? "Doanh nghiệp");

        var appliedJobs = companyId > 0
            ? (object)await context.Applications
                .Where(a => a.CandidateId == convo.CandidateUserId && a.Job.CompanyId == companyId && a.DeletedAt == null)
                .Include(a => a.Job)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new
                {
                    applicationId = a.Id,
                    jobId = a.JobId,
                    jobTitle = a.Job.Title,
                    status = a.Status.ToString(),
                    appliedAt = a.AppliedAt
                })
                .ToListAsync()
            : new List<object>();

        var candidateName = !string.IsNullOrWhiteSpace(candidate?.FullName)
            ? candidate.FullName
            : (!string.IsNullOrWhiteSpace(candidateUser?.FullName)
                ? candidateUser.FullName
                : (!string.IsNullOrWhiteSpace(convo.Application?.Candidate?.FullName)
                    ? convo.Application.Candidate.FullName
                    : "Ứng viên"));

        var candidateAvatar = candidate?.AvatarUrl 
            ?? candidateUser?.AvatarUrl 
            ?? convo.Application?.Candidate?.AvatarUrl;

        var employerName = !string.IsNullOrWhiteSpace(companyName) && companyName != "Doanh nghiệp"
            ? companyName
            : (convo.EmployerUser?.FullName ?? "Nhà tuyển dụng");

        var employerAvatar = convo.Job?.Company?.LogoUrl 
            ?? employer?.Company?.LogoUrl 
            ?? convo.EmployerUser?.AvatarUrl;

        var result = new
        {
            convo.Id,
            convo.ApplicationId,
            convo.JobId,
            JobTitle = convo.Job != null ? convo.Job.Title : (convo.Title ?? "Trao đổi cơ hội nghề nghiệp"),
            CompanyId = companyId,
            CompanyName = companyName,
            convo.CandidateUserId,
            CandidateName = candidateName,
            CandidateAvatar = candidateAvatar,
            convo.EmployerUserId,
            EmployerName = employerName,
            EmployerAvatar = employerAvatar,
            AppliedJobs = appliedJobs,
            Messages = messages
        };

        return Ok(ApiResponse<object>.Ok(result));
    }

    /// <summary>
    /// Lấy hoặc tạo cuộc trò chuyện gắn với hồ sơ ứng tuyển (Hợp nhất theo Ứng viên và Doanh nghiệp)
    /// </summary>
    [HttpGet("by-application/{applicationId:int}")]
    public async Task<IActionResult> GetOrCreateByApplication(int applicationId)
    {
        var userId = currentUserService.UserId;

        var app = await context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.DeletedAt == null);

        if (app == null)
        {
            return NotFound(ApiResponse<object>.Fail("APPLICATION_NOT_FOUND", "Hồ sơ ứng tuyển không tồn tại."));
        }

        var candidateUserId = app.Candidate.UserId;
        var employer = await context.Employers
            .FirstOrDefaultAsync(e => e.CompanyId == app.Job.CompanyId && e.DeletedAt == null);
        var employerUserId = employer?.UserId ?? userId;

        // Tìm conversation hiện có giữa Ứng viên và Nhà tuyển dụng
        var convo = await context.Conversations
            .Where(c => c.DeletedAt == null && 
                        c.CandidateUserId == candidateUserId && 
                        c.EmployerUserId == employerUserId)
            .OrderByDescending(c => c.LastMessageAt)
            .FirstOrDefaultAsync();

        if (convo == null)
        {
            convo = new Conversation
            {
                ApplicationId = applicationId,
                JobId = app.JobId,
                CandidateUserId = candidateUserId,
                EmployerUserId = employerUserId,
                Title = $"Ứng tuyển: {app.Job.Title}",
                LastMessageAt = DateTime.Now,
                LastMessageContent = "Bắt đầu cuộc trò chuyện...",
                LastSenderId = userId,
                CandidateUnreadCount = 0,
                EmployerUnreadCount = 0
            };

            context.Conversations.Add(convo);
            await context.SaveChangesAsync();
        }
        else
        {
            // Cập nhật JobId và ApplicationId sang vị trí mới nhất đang xem
            convo.ApplicationId = applicationId;
            convo.JobId = app.JobId;
            await context.SaveChangesAsync();
        }

        return Ok(ApiResponse<object>.Ok(new { conversationId = convo.Id }));
    }

    /// <summary>
    /// Gửi tin nhắn mới
    /// </summary>
    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        var userId = currentUserService.UserId;

        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(ApiResponse<object>.Fail("INVALID_CONTENT", "Nội dung tin nhắn không được để trống."));
        }

        Conversation? convo = null;

        if (dto.ConversationId.HasValue && dto.ConversationId.Value > 0)
        {
            convo = await context.Conversations
                .FirstOrDefaultAsync(c => c.Id == dto.ConversationId.Value && c.DeletedAt == null);
        }
        else if (dto.ApplicationId.HasValue && dto.ApplicationId.Value > 0)
        {
            var app = await context.Applications
                .Include(a => a.Job)
                .Include(a => a.Candidate)
                .FirstOrDefaultAsync(a => a.Id == dto.ApplicationId.Value);

            if (app != null)
            {
                var employer = await context.Employers
                    .FirstOrDefaultAsync(e => e.CompanyId == app.Job.CompanyId && e.DeletedAt == null);
                var employerUserId = employer?.UserId ?? userId;

                convo = await context.Conversations
                    .Where(c => c.DeletedAt == null && 
                                c.CandidateUserId == app.Candidate.UserId && 
                                c.EmployerUserId == employerUserId)
                    .OrderByDescending(c => c.LastMessageAt)
                    .FirstOrDefaultAsync();

                if (convo == null)
                {
                    convo = new Conversation
                    {
                        ApplicationId = app.Id,
                        JobId = app.JobId,
                        CandidateUserId = app.Candidate.UserId,
                        EmployerUserId = employerUserId,
                        Title = $"Ứng tuyển: {app.Job.Title}",
                        LastMessageAt = DateTime.Now,
                        LastMessageContent = dto.Content,
                        LastSenderId = userId
                    };
                    context.Conversations.Add(convo);
                    await context.SaveChangesAsync();
                }
                else
                {
                    convo.ApplicationId = app.Id;
                    convo.JobId = app.JobId;
                }
            }
        }

        if (convo == null)
        {
            return NotFound(ApiResponse<object>.Fail("CONVERSATION_NOT_FOUND", "Không tìm thấy cuộc hội thoại."));
        }

        // Tạo tin nhắn mới
        var message = new ChatMessage
        {
            ConversationId = convo.Id,
            SenderId = userId,
            Content = dto.Content.Trim(),
            IsRead = false,
            SentAt = DateTime.Now
        };
        context.ChatMessages.Add(message);

        // Cập nhật hội thoại
        convo.LastMessageAt = DateTime.Now;
        convo.LastMessageContent = dto.Content.Trim();
        convo.LastSenderId = userId;

        int recipientUserId;
        if (userId == convo.CandidateUserId)
        {
            convo.EmployerUnreadCount += 1;
            recipientUserId = convo.EmployerUserId;
        }
        else
        {
            convo.CandidateUnreadCount += 1;
            recipientUserId = convo.CandidateUserId;
        }

        // Tạo thông báo cho người nhận
        var sender = await context.Users.FindAsync(userId);
        var senderName = sender?.FullName ?? "Người dùng";
        context.Notifications.Add(new Notification
        {
            UserId = recipientUserId,
            Title = $"Tin nhắn mới từ {senderName}",
            Content = dto.Content.Length > 100 ? dto.Content.Substring(0, 100) + "..." : dto.Content,
            NotificationType = NotificationType.CHAT_MESSAGE,
            IsRead = false,
            RedirectUrl = "/messages"
        });

        await context.SaveChangesAsync();

        // Push real-time event qua SignalR
        try
        {
            await chatHub.Clients.Group($"Conversation_{convo.Id}").SendAsync("ReceiveMessage", new
            {
                message.Id,
                message.ConversationId,
                message.SenderId,
                SenderName = senderName,
                message.Content,
                message.SentAt
            });

            await notificationHub.Clients.Group($"User_{recipientUserId}").SendAsync("ReceiveNotification", new
            {
                title = $"Tin nhắn mới từ {senderName}",
                content = dto.Content.Length > 100 ? dto.Content.Substring(0, 100) + "..." : dto.Content,
                redirectUrl = "/messages"
            });
        }
        catch { }

        return Ok(ApiResponse<object>.Ok(new
        {
            message.Id,
            message.ConversationId,
            message.SenderId,
            SenderName = senderName,
            message.Content,
            message.SentAt,
            IsMine = true
        }));
    }

    /// <summary>
    /// Đánh dấu đã đọc cuộc hội thoại
    /// </summary>
    [HttpPost("conversations/{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = currentUserService.UserId;

        var convo = await context.Conversations
            .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null && (c.CandidateUserId == userId || c.EmployerUserId == userId));

        if (convo == null)
        {
            return NotFound(ApiResponse<bool>.Fail("CONVERSATION_NOT_FOUND", "Cuộc hội thoại không tồn tại."));
        }

        if (convo.CandidateUserId == userId)
            convo.CandidateUnreadCount = 0;
        else
            convo.EmployerUnreadCount = 0;

        await context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true));
    }

    /// <summary>
    /// Đánh giá hồ sơ Phù hợp (Shortlist) và Kích hoạt Chat đồng thời gửi Email cho Ứng viên
    /// </summary>
    [HttpPost("shortlist-and-chat")]
    public async Task<IActionResult> ShortlistAndChat([FromBody] ShortlistAndChatDto dto)
    {
        var userId = currentUserService.UserId;

        var app = await context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(a => a.Id == dto.ApplicationId && a.DeletedAt == null);

        if (app == null)
        {
            return NotFound(ApiResponse<object>.Fail("APPLICATION_NOT_FOUND", "Hồ sơ ứng tuyển không tồn tại."));
        }

        // 1. Cập nhật trạng thái sang SHORTLISTED (Phù hợp)
        app.Status = ApplicationStatus.SHORTLISTED;
        app.UpdatedAt = DateTime.Now;
        app.UpdatedBy = userId;

        var candidateUser = app.Candidate.User;
        var candidateEmail = candidateUser?.Email;
        var candidateName = candidateUser?.FullName ?? app.Candidate.FullName ?? "Ứng viên";
        var jobTitle = app.Job.Title;
        var companyName = app.Job.Company?.Name ?? "Doanh nghiệp";

        // 2. Gửi Email thông báo cho ứng viên (chạy nền không block)
        if (!string.IsNullOrWhiteSpace(candidateEmail))
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await emailService.SendShortlistNotificationAsync(candidateEmail, candidateName, jobTitle, companyName);
                }
                catch { }
            });
        }

        // 3. Tạo thông báo trong app cho ứng viên
        if (candidateUser != null)
        {
            context.Notifications.Add(new Notification
            {
                UserId = candidateUser.Id,
                Title = $"Hồ sơ phù hợp: {jobTitle}",
                Content = $"Công ty {companyName} đã đánh giá hồ sơ của bạn phù hợp và mở kênh nhắn tin trao đổi.",
                NotificationType = NotificationType.APPLICATION_STATUS,
                IsRead = false,
                RedirectUrl = "/messages"
            });
        }

        // 4. Tìm hoặc tạo Conversation duy nhất giữa Ứng viên và Doanh nghiệp
        var employer = await context.Employers
            .FirstOrDefaultAsync(e => e.CompanyId == app.Job.CompanyId && e.DeletedAt == null);
        var employerUserId = employer?.UserId ?? userId;

        var convo = await context.Conversations
            .Where(c => c.DeletedAt == null && 
                        c.CandidateUserId == app.Candidate.UserId && 
                        c.EmployerUserId == employerUserId)
            .OrderByDescending(c => c.LastMessageAt)
            .FirstOrDefaultAsync();

        if (convo == null)
        {
            convo = new Conversation
            {
                ApplicationId = app.Id,
                JobId = app.JobId,
                CandidateUserId = app.Candidate.UserId,
                EmployerUserId = employerUserId,
                Title = $"Ứng tuyển: {jobTitle}",
                LastMessageAt = DateTime.Now,
                LastSenderId = userId,
                CandidateUnreadCount = 0,
                EmployerUnreadCount = 0
            };
            context.Conversations.Add(convo);
            await context.SaveChangesAsync();
        }
        else
        {
            convo.ApplicationId = app.Id;
            convo.JobId = app.JobId;
        }

        // 5. Gửi tin nhắn mở đầu từ Nhà tuyển dụng
        var initialText = !string.IsNullOrWhiteSpace(dto.InitialMessage)
            ? dto.InitialMessage.Trim()
            : $"Chào bạn {candidateName}, chúng tôi từ {companyName} đã xem xét hồ sơ ứng tuyển của bạn cho vị trí \"{jobTitle}\" và đánh giá rất phù hợp. Chúng tôi mở kênh trao đổi trực tiếp này để trao đổi thêm với bạn về cơ hội nghề nghiệp này!";

        var chatMessage = new ChatMessage
        {
            ConversationId = convo.Id,
            SenderId = userId,
            Content = initialText,
            IsRead = false,
            SentAt = DateTime.Now
        };
        context.ChatMessages.Add(chatMessage);

        convo.LastMessageAt = DateTime.Now;
        convo.LastMessageContent = initialText;
        convo.LastSenderId = userId;
        convo.CandidateUnreadCount += 1;

        await context.SaveChangesAsync();

        // Push real-time event qua SignalR
        try
        {
            if (candidateUser != null)
            {
                await notificationHub.Clients.Group($"User_{candidateUser.Id}").SendAsync("ReceiveNotification", new
                {
                    title = $"Hồ sơ phù hợp: {jobTitle}",
                    content = $"Công ty {companyName} đã đánh giá hồ sơ của bạn phù hợp và mở kênh nhắn tin trao đổi.",
                    redirectUrl = "/messages"
                });
            }

            await chatHub.Clients.Group($"Conversation_{convo.Id}").SendAsync("ReceiveMessage", new
            {
                chatMessage.Id,
                chatMessage.ConversationId,
                chatMessage.SenderId,
                SenderName = companyName,
                chatMessage.Content,
                chatMessage.SentAt
            });
        }
        catch { }

        return Ok(ApiResponse<object>.Ok(new
        {
            conversationId = convo.Id,
            status = "SHORTLISTED",
            message = "Đã đánh giá hồ sơ phù hợp, kích hoạt tin nhắn và gửi email thành công!"
        }));
    }

    public class DirectChatRequestDto
    {
        public int CandidateUserId { get; set; }
        public int? JobId { get; set; }
    }

    /// <summary>
    /// Lấy hoặc tạo phòng hội thoại chat trực tiếp giữa Nhà tuyển dụng và Ứng viên (Săn ứng viên chủ động)
    /// </summary>
    [HttpPost("get-or-create-direct")]
    public async Task<IActionResult> GetOrCreateDirectConversation([FromBody] DirectChatRequestDto dto)
    {
        var employerUserId = currentUserService.UserId;

        var candidate = await context.Candidates
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == dto.CandidateUserId && c.DeletedAt == null);

        var candidateUser = candidate?.User ?? await context.Users.FirstOrDefaultAsync(u => u.Id == dto.CandidateUserId);
        if (candidateUser == null)
        {
            return NotFound(ApiResponse<object>.Fail("CANDIDATE_NOT_FOUND", "Không tìm thấy thông tin ứng viên."));
        }

        // Tìm conversation hiện có giữa 2 người này
        var convo = await context.Conversations
            .Where(c => c.DeletedAt == null && 
                        c.CandidateUserId == candidateUser.Id && 
                        c.EmployerUserId == employerUserId)
            .OrderByDescending(c => c.LastMessageAt)
            .FirstOrDefaultAsync();

        if (convo == null)
        {
            var employer = await context.Employers
                .Include(e => e.Company)
                .FirstOrDefaultAsync(e => e.UserId == employerUserId && e.DeletedAt == null);
            var companyName = employer?.Company?.Name ?? "Nhà tuyển dụng";
            var candidateName = candidateUser.FullName ?? "Ứng viên";

            convo = new Conversation
            {
                JobId = dto.JobId,
                CandidateUserId = candidateUser.Id,
                EmployerUserId = employerUserId,
                Title = $"Trao đổi tuyển dụng: {candidateName}",
                LastMessageAt = DateTime.Now,
                LastMessageContent = "Bắt đầu cuộc trò chuyện...",
                LastSenderId = employerUserId,
                CandidateUnreadCount = 0,
                EmployerUnreadCount = 0
            };

            context.Conversations.Add(convo);
            await context.SaveChangesAsync();

            // Thêm tin nhắn khởi đầu
            var welcomeMsg = new ChatMessage
            {
                ConversationId = convo.Id,
                SenderId = employerUserId,
                Content = $"Chào bạn {candidateName}, chúng tôi từ {companyName} rất quan tâm đến hồ sơ năng lực của bạn và muốn trao đổi trực tiếp về cơ hội nghề nghiệp.",
                IsRead = false,
                SentAt = DateTime.Now
            };
            context.ChatMessages.Add(welcomeMsg);
            convo.LastMessageContent = welcomeMsg.Content;
            convo.CandidateUnreadCount = 1;

            await context.SaveChangesAsync();
        }

        return Ok(ApiResponse<object>.Ok(new { conversationId = convo.Id }));
    }
}

