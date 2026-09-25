using System;
using System.Collections.Generic;

namespace HR.Application.Articles.Dtos;

public record ArticleSummaryDto(
    int Id,
    string Title,
    string Slug,
    string Summary,
    string? ThumbnailUrl,
    string Category,
    List<string> Tags,
    string AuthorName,
    DateTime? PublishedAt,
    int ViewCount,
    int ReadingTimeMinutes
);

public record ArticleDetailDto(
    int Id,
    string Title,
    string Slug,
    string Summary,
    string ContentHtml,
    string? ThumbnailUrl,
    string Category,
    List<string> Tags,
    string AuthorName,
    DateTime? PublishedAt,
    int ViewCount,
    int ReadingTimeMinutes,
    string? SeoTitle,
    string? SeoDescription,
    string? SeoKeywords,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ArticleUpsertDto(
    string Title,
    string Slug,
    string Summary,
    string ContentHtml,
    string? ThumbnailUrl,
    string Category,
    string? Tags,
    string AuthorName,
    bool IsPublished,
    int ReadingTimeMinutes,
    string? SeoTitle,
    string? SeoDescription,
    string? SeoKeywords
);
