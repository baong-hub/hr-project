using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Interviews.Queries;

public record InterviewCalendarSyncResult(
    int InterviewId,
    string Title,
    string IcsContent,
    string GoogleCalendarUrl,
    string FileName
);

public record GetInterviewCalendarSyncQuery(int InterviewId) : IRequest<InterviewCalendarSyncResult?>;

public class GetInterviewCalendarSyncHandler : IRequestHandler<GetInterviewCalendarSyncQuery, InterviewCalendarSyncResult?>
{
    private readonly IApplicationDbContext _context;

    public GetInterviewCalendarSyncHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InterviewCalendarSyncResult?> Handle(GetInterviewCalendarSyncQuery request, CancellationToken cancellationToken)
    {
        var interview = await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
            .Include(i => i.Application)
                .ThenInclude(a => a.Candidate)
            .Include(i => i.Interviewer)
                .ThenInclude(e => e.Company)
            .FirstOrDefaultAsync(i => i.Id == request.InterviewId && i.DeletedAt == null, cancellationToken);

        if (interview == null) return null;

        var jobTitle = interview.Application?.Job?.Title ?? "Ứng tuyển vị trí";
        var companyName = interview.Interviewer?.Company?.Name ?? "HR Recruitment";
        var candidateName = interview.Application?.Candidate?.FullName ?? "Ứng viên";
        var title = $"[Phỏng vấn] {jobTitle} - {companyName}";
        var location = string.IsNullOrWhiteSpace(interview.LocationOrLink) ? "Trực tuyến" : interview.LocationOrLink;
        var description = $"Buổi phỏng vấn vòng {interview.RoundNumber} ({interview.RoundName}) cho ứng viên {candidateName} tại {companyName}.\\n\\nGhi chú: {interview.Notes}\\nLink/Địa điểm: {location}";

        var startTimeUtc = interview.StartTime.ToUniversalTime();
        var endTimeUtc = interview.EndTime.ToUniversalTime();
        if (endTimeUtc <= startTimeUtc) endTimeUtc = startTimeUtc.AddHours(1);

        var startFormatted = startTimeUtc.ToString("yyyyMMdd\\THHmmss\\Z");
        var endFormatted = endTimeUtc.ToString("yyyyMMdd\\THHmmss\\Z");
        var nowFormatted = DateTime.UtcNow.ToString("yyyyMMdd\\THHmmss\\Z");

        // Generate RFC 5545 iCalendar format
        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//HR Portal//Interview Calendar//VI");
        sb.AppendLine("CALSCALE:GREGORIAN");
        sb.AppendLine("METHOD:REQUEST");
        sb.AppendLine("BEGIN:VEVENT");
        sb.AppendLine($"UID:interview-{interview.Id}@tuyendung.hamo.vn");
        sb.AppendLine($"DTSTAMP:{nowFormatted}");
        sb.AppendLine($"DTSTART:{startFormatted}");
        sb.AppendLine($"DTEND:{endFormatted}");
        sb.AppendLine($"SUMMARY:{title}");
        sb.AppendLine($"DESCRIPTION:{description}");
        sb.AppendLine($"LOCATION:{location}");
        sb.AppendLine("STATUS:CONFIRMED");
        sb.AppendLine("BEGIN:VALARM");
        sb.AppendLine("TRIGGER:-PT30M");
        sb.AppendLine("ACTION:DISPLAY");
        sb.AppendLine($"DESCRIPTION:Nhắc lịch phỏng vấn {jobTitle} sau 30 phút");
        sb.AppendLine("END:VALARM");
        sb.AppendLine("END:VEVENT");
        sb.AppendLine("END:VCALENDAR");

        // Generate 1-Click Google Calendar Render Template URL
        var gCalUrl = $"https://calendar.google.com/calendar/render?action=TEMPLATE" +
                      $"&text={Uri.EscapeDataString(title)}" +
                      $"&dates={startFormatted}/{endFormatted}" +
                      $"&details={Uri.EscapeDataString(description.Replace("\\n", "\n"))}" +
                      $"&location={Uri.EscapeDataString(location)}";

        return new InterviewCalendarSyncResult(
            InterviewId: interview.Id,
            Title: title,
            IcsContent: sb.ToString(),
            GoogleCalendarUrl: gCalUrl,
            FileName: $"Lich_phong_van_{interview.Id}.ics"
        );
    }
}
