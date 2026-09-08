using HR.Application.Common.Models;
using HR.Domain.Entities;
using HR.Infrastructure.Persistence;
using HR.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/departments")]
[Authorize]
public class DepartmentsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    [RequirePermission("organization:view")]
    public async Task<IActionResult> GetAll()
    {
        var items = await context.Departments
            .Where(d => d.DeletedAt == null)
            .Include(d => d.Manager)
            .Include(d => d.Children.Where(c => c.DeletedAt == null))
            .OrderBy(d => d.SortOrder)
            .ToListAsync();

        var dtos = items.Select(d => MapToDto(d)).ToList();
        return Ok(ApiResponse<object>.Ok(dtos));
    }

    [HttpGet("tree")]
    [RequirePermission("organization:view")]
    public async Task<IActionResult> GetTree()
    {
        var all = await context.Departments
            .Where(d => d.DeletedAt == null)
            .Include(d => d.Manager)
            .OrderBy(d => d.SortOrder)
            .ToListAsync();

        var roots = all.Where(d => d.ParentId == null).ToList();
        var tree = roots.Select(r => BuildTree(r, all)).ToList();
        return Ok(ApiResponse<object>.Ok(tree));
    }

    [HttpGet("{id}")]
    [RequirePermission("organization:view")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await context.Departments
            .Include(d => d.Manager)
            .Include(d => d.Children.Where(c => c.DeletedAt == null))
            .FirstOrDefaultAsync(d => d.Id == id && d.DeletedAt == null);

        if (item == null)
            return NotFound(ApiResponse<object>.Fail("NOT_FOUND", "Không tìm thấy phòng ban"));

        return Ok(ApiResponse<object>.Ok(MapToDto(item)));
    }

    [HttpPost]
    [RequirePermission("organization:create")]
    public async Task<IActionResult> Create([FromBody] DepartmentDto dto)
    {
        var entity = new Department
        {
            Code = dto.Code,
            Name = dto.Name,
            Description = dto.Description,
            ParentId = dto.ParentId,
            ManagerUserId = dto.ManagerUserId,
            SortOrder = dto.SortOrder,
            IsActive = true
        };
        context.Departments.Add(entity);
        await context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(MapToDto(entity)));
    }

    [HttpPut("{id}")]
    [RequirePermission("organization:update")]
    public async Task<IActionResult> Update(int id, [FromBody] DepartmentDto dto)
    {
        var entity = await context.Departments.FindAsync(id);
        if (entity == null || entity.DeletedAt != null)
            return NotFound(ApiResponse<object>.Fail("NOT_FOUND", "Không tìm thấy phòng ban"));

        entity.Code = dto.Code;
        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.ParentId = dto.ParentId;
        entity.ManagerUserId = dto.ManagerUserId;
        entity.SortOrder = dto.SortOrder;
        entity.IsActive = dto.IsActive;
        await context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(MapToDto(entity)));
    }

    [HttpDelete("{id}")]
    [RequirePermission("organization:delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await context.Departments
            .Include(d => d.Children)
            .FirstOrDefaultAsync(d => d.Id == id && d.DeletedAt == null);

        if (entity == null)
            return NotFound(ApiResponse<object>.Fail("NOT_FOUND", "Không tìm thấy phòng ban"));

        if (entity.Children.Any(c => c.DeletedAt == null))
            return BadRequest(ApiResponse<object>.Fail("HAS_CHILDREN", "Không thể xóa phòng ban có phòng ban con. Vui lòng xóa phòng ban con trước."));

        entity.DeletedAt = DateTime.Now;
        await context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(true));
    }

    private static object MapToDto(Department d) => new
    {
        d.Id,
        d.Code,
        d.Name,
        d.Description,
        d.ParentId,
        d.ManagerUserId,
        ManagerName = d.Manager?.FullName,
        d.SortOrder,
        d.IsActive,
        d.CreatedAt,
        d.UpdatedAt,
        Children = d.Children?.Where(c => c.DeletedAt == null).Select(c => MapToDto(c)).ToList()
    };

    private static object BuildTree(Department node, List<Department> all) => new
    {
        node.Id,
        node.Code,
        node.Name,
        node.Description,
        node.ParentId,
        node.ManagerUserId,
        ManagerName = node.Manager?.FullName,
        node.SortOrder,
        node.IsActive,
        Children = all.Where(d => d.ParentId == node.Id)
            .OrderBy(d => d.SortOrder)
            .Select(c => BuildTree(c, all))
            .ToList()
    };
}

public class DepartmentDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentId { get; set; }
    public int? ManagerUserId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
