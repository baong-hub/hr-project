using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Articles.Dtos;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Articles.Queries;

public record GetArticlesQuery(
    string? Category = null,
    string? Tag = null,
    string? Search = null,
    string? SortBy = "newest", // newest, popular
    int Page = 1,
    int PageSize = 9
) : IRequest<PagedResult<ArticleSummaryDto>>;

public class GetArticlesHandler : IRequestHandler<GetArticlesQuery, PagedResult<ArticleSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetArticlesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ArticleSummaryDto>> Handle(GetArticlesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Articles
            .AsNoTracking()
            .Where(a => a.IsPublished && a.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(request.Category) && request.Category.ToLower() != "all" && request.Category.ToLower() != "tất cả")
        {
            var cat = request.Category.Trim().ToLower();
            query = query.Where(a => a.Category.ToLower() == cat);
        }

        if (!string.IsNullOrWhiteSpace(request.Tag))
        {
            var tag = request.Tag.Trim().ToLower();
            query = query.Where(a => a.Tags != null && a.Tags.ToLower().Contains(tag));
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(a =>
                a.Title.ToLower().Contains(search) ||
                a.Summary.ToLower().Contains(search) ||
                (a.Tags != null && a.Tags.ToLower().Contains(search)));
        }

        query = request.SortBy?.ToLower() switch
        {
            "popular" => query.OrderByDescending(a => a.ViewCount).ThenByDescending(a => a.PublishedAt),
            _ => query.OrderByDescending(a => a.PublishedAt ?? a.CreatedAt)
        };

        var total = await query.CountAsync(cancellationToken);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 9 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ArticleSummaryDto(
                a.Id,
                a.Title,
                a.Slug,
                a.Summary,
                a.ThumbnailUrl,
                a.Category,
                string.IsNullOrEmpty(a.Tags) 
                    ? new List<string>() 
                    : a.Tags.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
                a.AuthorName,
                a.PublishedAt ?? a.CreatedAt,
                a.ViewCount,
                a.ReadingTimeMinutes
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<ArticleSummaryDto>
        {
            Items = items,
            Meta = new PagingMeta
            {
                Page = page,
                PageSize = pageSize,
                Total = total
            }
        };
    }
}
