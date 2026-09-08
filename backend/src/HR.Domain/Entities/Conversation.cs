using System;
using System.Collections.Generic;

namespace HR.Domain.Entities;

public class Conversation : BaseEntity
{
    public int? ApplicationId { get; set; }
    public int? JobId { get; set; }
    public int CandidateUserId { get; set; }
    public int EmployerUserId { get; set; }
    public string? Title { get; set; }
    public DateTime LastMessageAt { get; set; } = DateTime.Now;
    public string LastMessageContent { get; set; } = string.Empty;
    public int? LastSenderId { get; set; }
    public int CandidateUnreadCount { get; set; } = 0;
    public int EmployerUnreadCount { get; set; } = 0;

    // Navigations
    public Application? Application { get; set; }
    public Job? Job { get; set; }
    public User? CandidateUser { get; set; }
    public User? EmployerUser { get; set; }
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
