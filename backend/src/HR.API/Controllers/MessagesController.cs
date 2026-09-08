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

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/messages")]
[Authorize]
public class MessagesController(
    ApplicationDbContext context,
    ICurrentUserService currentUserService,
    IEmailService emailService) : ControllerBase
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
    /// Lấy danh sách cuộc trò chuyện của người dùng hiện tại (cả Ứng viên và Nhà tuyển dụng)
    /// </summary>
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var userId = currentUserService.UserId;

        var convos = await context.Conversations
            .AsNoTracking()
            .Where(c => c.DeletedAt == null && (c.CandidateUserId == userId || c.EmployerUserId == userId))
            .Include(c => c.Job)
                .ThenInclude(j => j!.Company)
            .Include(c => c.CandidateUser)
            .Include(c => c.EmployerUser)
            .OrderByDescending(c => c.LastMessageAt)
            .Select(c => new
            {
                c.Id,
                c.ApplicationId,
                c.JobId,
                JobTitle = c.Job != null ? c.Job.Title : (c.Title ?? "Trao đổi cơ hội nghề nghiệp"),
                CompanyId = c.Job != null ? c.Job.CompanyId : 0,
                CompanyName = c.Job != null && c.Job.Company != null ? c.Job.Company.Name : "Doanh nghiệp",
                c.CandidateUserId,
                CandidateName = c.CandidateUser != null ? c.CandidateUser.FullName : "Ứng viên",
                CandidateAvatar = c.CandidateUser != null ? c.CandidateUser.AvatarUrl : null,
                c.EmployerUserId,
                EmployerName = c.EmployerUser != null ? c.EmployerUser.FullName : "Nhà tuyển dụng",
                EmployerAvatar = c.EmployerUser != null ? c.EmployerUser.AvatarUrl : null,
                c.LastMessageAt,
                c.LastMessageContent,
                c.LastSenderId,
                UnreadCount = c.CandidateUserId == userId ? c.CandidateUnreadCount : c.EmployerUnreadCount
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(convos));
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
            .Include(c => c.EmployerUser)
            .FirstOrDefaultAsync();

        if (convo == null)
        {
            return NotFound(ApiResponse<object>.Fail("CONVERSATION_NOT_FOUND", "Cuộc hội thoại không tồn tại hoặc bạn không có quyền truy cập."));
        }

        var messages = await context.ChatMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == id && m.DeletedAt == null)
            .Include(m => m.Sender)
            .OrderBy(m => m.SentAt)
            .Select(m => new
            {
                m.Id,
                m.ConversationId,
                m.SenderId,
                SenderName = m.Sender != null ? m.Sender.FullName : "Thành viên",
                SenderAvatar = m.Sender != null ? m.Sender.AvatarUrl : null,
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

        var result = new
        {
            convo.Id,
            convo.ApplicationId,
            convo.JobId,
            JobTitle = convo.Job != null ? convo.Job.Title : (convo.Title ?? "Trao đổi cơ hội nghề nghiệp"),
            CompanyName = convo.Job != null && convo.Job.Company != null ? convo.Job.Company.Name : "Doanh nghiệp",
            convo.CandidateUserId,
            CandidateName = convo.CandidateUser != null ? convo.CandidateUser.FullName : "Ứng viên",
            CandidateAvatar = convo.CandidateUser != null ? convo.CandidateUser.AvatarUrl : null,
            convo.EmployerUserId,
            EmployerName = convo.EmployerUser != null ? convo.EmployerUser.FullName : "Nhà tuyển dụng",
            EmployerAvatar = convo.EmployerUser != null ? convo.EmployerUser.AvatarUrl : null,
            Messages = messages
        };

        return Ok(ApiResponse<object>.Ok(result));
    }

    /// <summary>
    /// Lấy hoặc tạo cuộc trò chuyện gắn với hồ sơ ứng tuyển
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

        // Tìm conversation hiện có
        var convo = await context.Conversations
            .FirstOrDefaultAsync(c => c.ApplicationId == applicationId && c.DeletedAt == null);

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
            convo = await context.Conversations
                .FirstOrDefaultAsync(c => c.ApplicationId == dto.ApplicationId.Value && c.DeletedAt == null);

            if (convo == null)
            {
                var app = await context.Applications
                    .Include(a => a.Job)
                    .Include(a => a.Candidate)
                    .FirstOrDefaultAsync(a => a.Id == dto.ApplicationId.Value);

                if (app != null)
                {
                    var employer = await context.Employers
                        .FirstOrDefaultAsync(e => e.CompanyId == app.Job.CompanyId && e.DeletedAt == null);

                    convo = new Conversation
                    {
                        ApplicationId = app.Id,
                        JobId = app.JobId,
                        CandidateUserId = app.Candidate.UserId,
                        EmployerUserId = employer?.UserId ?? userId,
                        Title = $"Ứng tuyển: {app.Job.Title}",
                        LastMessageAt = DateTime.Now,
                        LastMessageContent = dto.Content,
                        LastSenderId = userId
                    };
                    context.Conversations.Add(convo);
                    await context.SaveChangesAsync();
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

        // 4. Tìm hoặc tạo Conversation
        var convo = await context.Conversations
            .FirstOrDefaultAsync(c => c.ApplicationId == app.Id && c.DeletedAt == null);

        var employer = await context.Employers
            .FirstOrDefaultAsync(e => e.CompanyId == app.Job.CompanyId && e.DeletedAt == null);
        var employerUserId = employer?.UserId ?? userId;

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

        return Ok(ApiResponse<object>.Ok(new
        {
            conversationId = convo.Id,
            status = "SHORTLISTED",
            message = "Đã đánh giá hồ sơ phù hợp, kích hoạt tin nhắn và gửi email thành công!"
        }));
    }
}
