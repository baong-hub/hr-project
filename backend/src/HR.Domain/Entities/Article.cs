using System;

namespace HR.Domain.Entities;

public class Article : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string Category { get; set; } = "Kinh nghiệm nghề nghiệp";
    public string? Tags { get; set; }
    public int? AuthorId { get; set; }
    public string AuthorName { get; set; } = "Ban Biên Tập HR";
    public bool IsPublished { get; set; } = true;
    public DateTime? PublishedAt { get; set; } = DateTime.UtcNow;
    public int ViewCount { get; set; } = 0;
    public int ReadingTimeMinutes { get; set; } = 5;
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SeoKeywords { get; set; }
}
