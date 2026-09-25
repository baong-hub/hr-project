using System.Collections.Generic;
using System.Threading.Tasks;
using HR.Application.Articles.Dtos;
using HR.Application.Articles.Queries;
using HR.Application.Articles.Commands;
using HR.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/articles")]
public class ArticlesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ArticlesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PagedResult<ArticleSummaryDto>>>> GetArticles(
        [FromQuery] string? category,
        [FromQuery] string? tag,
        [FromQuery] string? search,
        [FromQuery] string? sortBy = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 9)
    {
        var result = await _mediator.Send(new GetArticlesQuery(category, tag, search, sortBy, page, pageSize));
        return Ok(ApiResponse<PagedResult<ArticleSummaryDto>>.Ok(result));
    }

    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ArticleDetailDto>>> GetArticleBySlug(string slug)
    {
        var result = await _mediator.Send(new GetArticleBySlugQuery(slug));
        if (result == null)
        {
            return NotFound(ApiResponse<ArticleDetailDto>.Fail("NOT_FOUND", "Bài viết không tồn tại hoặc đã bị gỡ."));
        }
        return Ok(ApiResponse<ArticleDetailDto>.Ok(result));
    }

    [HttpGet("categories")]
    [AllowAnonymous]
    public ActionResult<ApiResponse<List<string>>> GetCategories()
    {
        var categories = new List<string>
        {
            "Kinh nghiệm phỏng vấn",
            "Bí quyết viết CV",
            "Pháp luật lao động",
            "Xu hướng nghề nghiệp",
            "Kỹ năng mềm",
            "Thị trường công nghệ"
        };
        return Ok(ApiResponse<List<string>>.Ok(categories));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR_Manager")]
    public async Task<ActionResult<ApiResponse<int>>> CreateArticle([FromBody] ArticleUpsertDto dto)
    {
        var id = await _mediator.Send(new CreateArticleCommand(dto));
        return Ok(ApiResponse<int>.Ok(id));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,HR_Manager")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateArticle(int id, [FromBody] ArticleUpsertDto dto)
    {
        var success = await _mediator.Send(new UpdateArticleCommand(id, dto));
        if (!success)
            return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Không tìm thấy bài viết để cập nhật."));

        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,HR_Manager")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteArticle(int id)
    {
        var success = await _mediator.Send(new DeleteArticleCommand(id));
        if (!success)
            return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Không tìm thấy bài viết để xóa."));

        return Ok(ApiResponse<bool>.Ok(true));
    }
}
