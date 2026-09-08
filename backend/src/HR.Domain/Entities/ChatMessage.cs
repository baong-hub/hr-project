using System;

namespace HR.Domain.Entities;

public class ChatMessage : BaseEntity
{
    public int ConversationId { get; set; }
    public int SenderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; } = DateTime.Now;

    // Navigations
    public Conversation Conversation { get; set; } = null!;
    public User? Sender { get; set; }
}
