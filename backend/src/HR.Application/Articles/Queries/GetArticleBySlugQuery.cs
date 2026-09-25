using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Articles.Dtos;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Articles.Queries;

public record GetArticleBySlugQuery(string Slug) : IRequest<ArticleDetailDto?>;

public class GetArticleBySlugHandler : IRequestHandler<GetArticleBySlugQuery, ArticleDetailDto?>
{
    private readonly IApplicationDbContext _context;

    public GetArticleBySlugHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ArticleDetailDto?> Handle(GetArticleBySlugQuery request, CancellationToken cancellationToken)
    {
        var slug = request.Slug.Trim().ToLower();
        var article = await _context.Articles
            .FirstOrDefaultAsync(a => a.Slug.ToLower() == slug && a.IsPublished && a.DeletedAt == null, cancellationToken);

        if (article == null)
            return null;

        // Auto-increment view count
        article.ViewCount += 1;
        await _context.SaveChangesAsync(cancellationToken);

        var tagsList = string.IsNullOrEmpty(article.Tags)
            ? new List<string>()
            : article.Tags.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

        return new ArticleDetailDto(
            article.Id,
            article.Title,
            article.Slug,
            article.Summary,
            article.ContentHtml,
            article.ThumbnailUrl,
            article.Category,
            tagsList,
            article.AuthorName,
            article.PublishedAt ?? article.CreatedAt,
            article.ViewCount,
            article.ReadingTimeMinutes,
            article.SeoTitle,
            article.SeoDescription,
            article.SeoKeywords,
            article.CreatedAt,
            article.UpdatedAt
        );
    }
}
