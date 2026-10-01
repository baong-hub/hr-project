using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Domain.Entities;
using HR.Infrastructure.Persistence;
using HR.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/master-data")]
[Authorize]
public class MasterDataController(ApplicationDbContext context, ICacheService cacheService) : ControllerBase
{
    private const string CACHE_PREFIX = "masterdata";

    [HttpGet]
    [RequirePermission("master-data:view")]
    public async Task<IActionResult> GetAll([FromQuery] string? type)
    {
        var cacheKey = $"{CACHE_PREFIX}:all:{type ?? "all"}";
        var cachedItems = await cacheService.GetAsync<List<MasterDataCategory>>(cacheKey);
        if (cachedItems != null)
        {
            return Ok(ApiResponse<object>.Ok(cachedItems));
        }

        var query = context.MasterDataCategories.Where(m => m.DeletedAt == null).AsQueryable();
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(m => m.Type == type);

        var items = await query.OrderBy(m => m.Type).ThenBy(m => m.SortOrder).ToListAsync();
        await cacheService.SetAsync(cacheKey, items, System.TimeSpan.FromHours(1));

        return Ok(ApiResponse<object>.Ok(items));
    }

    [HttpGet("types")]
    [RequirePermission("master-data:view")]
    public async Task<IActionResult> GetTypes()
    {
        var cacheKey = $"{CACHE_PREFIX}:types";
        var cachedTypes = await cacheService.GetAsync<List<string>>(cacheKey);
        if (cachedTypes != null)
        {
            return Ok(ApiResponse<object>.Ok(cachedTypes));
        }

        var types = await context.MasterDataCategories
            .Where(m => m.DeletedAt == null)
            .Select(m => m.Type)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();

        await cacheService.SetAsync(cacheKey, types, System.TimeSpan.FromHours(1));
        return Ok(ApiResponse<object>.Ok(types));
    }

    [HttpGet("{id}")]
    [RequirePermission("master-data:view")]
    public async Task<IActionResult> GetById(int id)
    {
        var cacheKey = $"{CACHE_PREFIX}:{id}";
        var cachedItem = await cacheService.GetAsync<MasterDataCategory>(cacheKey);
        if (cachedItem != null)
        {
            return Ok(ApiResponse<object>.Ok(cachedItem));
        }

        var item = await context.MasterDataCategories.FindAsync(id);
        if (item == null || item.DeletedAt != null)
            return NotFound(ApiResponse<object>.Fail("NOT_FOUND", "Không tìm thấy danh mục"));

        await cacheService.SetAsync(cacheKey, item, System.TimeSpan.FromHours(1));
        return Ok(ApiResponse<object>.Ok(item));
    }

    [HttpPost]
    [RequirePermission("master-data:create")]
    public async Task<IActionResult> Create([FromBody] MasterDataCategoryDto dto)
    {
        var entity = new MasterDataCategory
        {
            Type = dto.Type,
            Code = dto.Code,
            Name = dto.Name,
            Description = dto.Description,
            SortOrder = dto.SortOrder,
            IsActive = true
        };
        context.MasterDataCategories.Add(entity);
        await context.SaveChangesAsync();

        await cacheService.RemoveByPrefixAsync(CACHE_PREFIX);
        return Ok(ApiResponse<object>.Ok(entity));
    }

    [HttpPut("{id}")]
    [RequirePermission("master-data:update")]
    public async Task<IActionResult> Update(int id, [FromBody] MasterDataCategoryDto dto)
    {
        var entity = await context.MasterDataCategories.FindAsync(id);
        if (entity == null || entity.DeletedAt != null)
            return NotFound(ApiResponse<object>.Fail("NOT_FOUND", "Không tìm thấy danh mục"));

        entity.Type = dto.Type;
        entity.Code = dto.Code;
        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.SortOrder = dto.SortOrder;
        entity.IsActive = dto.IsActive;
        await context.SaveChangesAsync();

        await cacheService.RemoveByPrefixAsync(CACHE_PREFIX);
        return Ok(ApiResponse<object>.Ok(entity));
    }

    [HttpDelete("{id}")]
    [RequirePermission("master-data:delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await context.MasterDataCategories.FindAsync(id);
        if (entity == null || entity.DeletedAt != null)
            return NotFound(ApiResponse<object>.Fail("NOT_FOUND", "Không tìm thấy danh mục"));

        entity.DeletedAt = System.DateTime.Now;
        await context.SaveChangesAsync();

        await cacheService.RemoveByPrefixAsync(CACHE_PREFIX);
        return Ok(ApiResponse<object>.Ok(true));
    }
}

public class MasterDataCategoryDto
{
    public string Type { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
