using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Cvs.Commands.InviteCandidateToJob;

public class InviteCandidateToJobCommandHandler : IRequestHandler<InviteCandidateToJobCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;
    private readonly INotificationSender _notificationSender;

    public InviteCandidateToJobCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IEmailService emailService,
        INotificationSender notificationSender)
    {
        _context = context;
        _currentUserService = currentUserService;
        _emailService = emailService;
        _notificationSender = notificationSender;
    }

    public async Task<bool> Handle(InviteCandidateToJobCommand request, CancellationToken cancellationToken)
    {
        var employerUserId = _currentUserService.UserId;
        if (employerUserId <= 0)
        {
            throw new UnauthorizedAccessException("Bạn cần đăng nhập để thực hiện hành động này.");
        }

        // 1. Kiểm tra Ứng viên tồn tại & Công khai
        var candidate = await _context.Candidates
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == request.CandidateId, cancellationToken);

        if (candidate == null)
        {
            throw new NotFoundException("CANDIDATE_NOT_FOUND", "Không tìm thấy hồ sơ ứng viên.");
        }

        if (candidate.VisibilityStatus != CandidateVisibilityStatus.PUBLIC)
        {
            throw new BadRequestException("CANDIDATE_PRIVATE", "Ứng viên này hiện đang bật chế độ riêng tư.");
        }

        // 2. Kiểm tra Tin tuyển dụng tồn tại
        var job = await _context.Jobs
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == request.JobId, cancellationToken);

        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Tin tuyển dụng không tồn tại.");
        }

        // 3. Thông tin người gửi (Nhà tuyển dụng)
        var employerUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == employerUserId, cancellationToken);
        var employerName = employerUser?.FullName ?? "Nhà tuyển dụng";
        var companyName = job.Company?.Name ?? "Doanh nghiệp";
        var candidateName = string.IsNullOrWhiteSpace(candidate.FullName) 
            ? (candidate.User?.FullName ?? "Ứng viên") 
            : candidate.FullName;
        var candidateEmail = candidate.User?.Email;

        var invitationText = !string.IsNullOrWhiteSpace(request.CustomMessage)
            ? request.CustomMessage.Trim()
            : $"Chào bạn {candidateName}, chúng tôi từ {companyName} rất ấn tượng với hồ sơ của bạn và trân trọng mời bạn tham khảo cơ hội nghề nghiệp cho vị trí \"{job.Title}\". Rất mong có cơ hội hợp tác cùng bạn!";

        // 4. Gửi SignalR Realtime In-App Notification
        if (candidate.User != null)
        {
            await _notificationSender.SendNotificationAsync(
                candidate.User.Id,
                $"🌟 Lời mời ứng tuyển: {job.Title}",
                $"{companyName} đã gửi lời mời bạn ứng tuyển vào vị trí \"{job.Title}\".",
                NotificationType.JOB_INVITATION,
                $"/jobs/{job.Id}",
                cancellationToken
            );
        }

        // 5. Gửi HTML Email chuyên nghiệp
        if (!string.IsNullOrWhiteSpace(candidateEmail))
        {
            var jobUrl = $"http://localhost:5175/jobs/{job.Id}";
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendJobInvitationEmailAsync(
                        candidateEmail,
                        candidateName,
                        job.Title,
                        companyName,
                        employerName,
                        invitationText,
                        jobUrl
                    );
                }
                catch { }
            });
        }

        // 6. Tự động mở Conversation kèm tin nhắn lời mời để hai bên có thể chat trực tiếp
        var candidateUserId = candidate.User?.Id ?? candidate.Id;
        var convo = await _context.Conversations
            .FirstOrDefaultAsync(c => c.DeletedAt == null && 
                                     c.CandidateUserId == candidateUserId && 
                                     c.EmployerUserId == employerUserId &&
                                     c.JobId == job.Id, cancellationToken);

        if (convo == null)
        {
            convo = new Conversation
            {
                JobId = job.Id,
                CandidateUserId = candidateUserId,
                EmployerUserId = employerUserId,
                Title = $"Mời ứng tuyển: {job.Title}",
                LastMessageAt = DateTime.Now,
                LastMessageContent = invitationText,
                LastSenderId = employerUserId,
                CandidateUnreadCount = 1,
                EmployerUnreadCount = 0
            };
            _context.Conversations.Add(convo);
            await _context.SaveChangesAsync(cancellationToken);

            var chatMsg = new ChatMessage
            {
                ConversationId = convo.Id,
                SenderId = employerUserId,
                Content = $"[Lời mời ứng tuyển vị trí {job.Title}]\n\n{invitationText}\n\n👉 Chi tiết công việc: /jobs/{job.Id}",
                IsRead = false,
                SentAt = DateTime.Now
            };
            _context.ChatMessages.Add(chatMsg);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
