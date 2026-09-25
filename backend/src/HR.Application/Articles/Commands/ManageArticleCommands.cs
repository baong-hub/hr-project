using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Articles.Dtos;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Articles.Commands;

public record CreateArticleCommand(ArticleUpsertDto Dto) : IRequest<int>;

public class CreateArticleHandler : IRequestHandler<CreateArticleCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateArticleHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<int> Handle(CreateArticleCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var slug = string.IsNullOrWhiteSpace(dto.Slug)
            ? GenerateSlug(dto.Title)
            : GenerateSlug(dto.Slug);

        // Ensure unique slug
        var baseSlug = slug;
        var counter = 1;
        while (await _context.Articles.AnyAsync(a => a.Slug == slug, cancellationToken))
        {
            slug = $"{baseSlug}-{counter++}";
        }

        var article = new Article
        {
            Title = dto.Title.Trim(),
            Slug = slug,
            Summary = dto.Summary.Trim(),
            ContentHtml = dto.ContentHtml,
            ThumbnailUrl = dto.ThumbnailUrl,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "Kinh nghiệm nghề nghiệp" : dto.Category.Trim(),
            Tags = dto.Tags?.Trim(),
            AuthorId = _currentUserService.UserId != 0 ? _currentUserService.UserId : null,
            AuthorName = string.IsNullOrWhiteSpace(dto.AuthorName) ? "Ban Biên Tập HR" : dto.AuthorName.Trim(),
            IsPublished = dto.IsPublished,
            PublishedAt = dto.IsPublished ? DateTime.UtcNow : null,
            ReadingTimeMinutes = dto.ReadingTimeMinutes <= 0 ? 5 : dto.ReadingTimeMinutes,
            SeoTitle = dto.SeoTitle?.Trim(),
            SeoDescription = dto.SeoDescription?.Trim(),
            SeoKeywords = dto.SeoKeywords?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Articles.Add(article);
        await _context.SaveChangesAsync(cancellationToken);
        return article.Id;
    }

    private static string GenerateSlug(string title)
    {
        if (string.IsNullOrWhiteSpace(title)) return Guid.NewGuid().ToString("n")[..8];
        var s = title.ToLower().Trim();
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[áàảãạăắằẳẵặâấầẩẫậ]", "a");
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[éèẻẽẹêếềểễệ]", "e");
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[íìỉĩị]", "i");
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[óòỏõọôốồổỗộơớờởỡợ]", "o");
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[úùủũụưứừửữự]", "u");
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[ýỳỷỹỵ]", "y");
        s = System.Text.RegularExpressions.Regex.Replace(s, @"đ", "d");
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[^a-z0-9\s-]", "");
        s = System.Text.RegularExpressions.Regex.Replace(s, @"\s+", "-").Trim('-');
        return string.IsNullOrEmpty(s) ? Guid.NewGuid().ToString("n")[..8] : s;
    }
}

public record UpdateArticleCommand(int Id, ArticleUpsertDto Dto) : IRequest<bool>;

public class UpdateArticleHandler : IRequestHandler<UpdateArticleCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateArticleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateArticleCommand request, CancellationToken cancellationToken)
    {
        var article = await _context.Articles.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);
        if (article == null) return false;

        var dto = request.Dto;
        article.Title = dto.Title.Trim();
        article.Summary = dto.Summary.Trim();
        article.ContentHtml = dto.ContentHtml;
        article.ThumbnailUrl = dto.ThumbnailUrl;
        article.Category = string.IsNullOrWhiteSpace(dto.Category) ? article.Category : dto.Category.Trim();
        article.Tags = dto.Tags?.Trim();
        article.AuthorName = string.IsNullOrWhiteSpace(dto.AuthorName) ? article.AuthorName : dto.AuthorName.Trim();
        article.IsPublished = dto.IsPublished;
        if (dto.IsPublished && article.PublishedAt == null)
        {
            article.PublishedAt = DateTime.UtcNow;
        }
        article.ReadingTimeMinutes = dto.ReadingTimeMinutes <= 0 ? 5 : dto.ReadingTimeMinutes;
        article.SeoTitle = dto.SeoTitle?.Trim();
        article.SeoDescription = dto.SeoDescription?.Trim();
        article.SeoKeywords = dto.SeoKeywords?.Trim();
        article.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record DeleteArticleCommand(int Id) : IRequest<bool>;

public class DeleteArticleHandler : IRequestHandler<DeleteArticleCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteArticleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteArticleCommand request, CancellationToken cancellationToken)
    {
        var article = await _context.Articles.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);
        if (article == null) return false;

        article.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
