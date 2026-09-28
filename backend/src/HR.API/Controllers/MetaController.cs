using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Domain.Enums;
using HR.Domain.Reference;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HR.Api.Controllers;

public record ProvinceMetaDto(
    string Code,
    string Name,
    string Type,
    List<string> LegacyNames,
    List<string> Aliases,
    int JobCount
);

public record IndustryMetaDto(
    string Code,
    string Name,
    int JobCount
);

[ApiController]
[Route("api/v1/meta")]
[AllowAnonymous]
public class MetaController(IApplicationDbContext context) : ControllerBase
{
    [HttpGet("provinces")]
    [ResponseCache(Duration = 60)]
    public async Task<IActionResult> GetProvinces(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var counts = await context.Jobs
            .AsNoTracking()
            .Where(j => j.Status == JobStatus.PUBLISHED && j.ExpiredAt >= now && j.ProvinceCode != null)
            .GroupBy(j => j.ProvinceCode!)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Code, x => x.Count, cancellationToken);

        var result = AdministrativeReference.Provinces.Select(p => new ProvinceMetaDto(
            p.Code,
            p.Name,
            p.Type,
            p.LegacyNames,
            p.Aliases,
            counts.TryGetValue(p.Code, out var c) ? c : 0
        )).ToList();

        return Ok(ApiResponse<List<ProvinceMetaDto>>.Ok(result));
    }

    [HttpGet("industries")]
    [ResponseCache(Duration = 60)]
    public async Task<IActionResult> GetIndustries(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var counts = await context.Jobs
            .AsNoTracking()
            .Where(j => j.Status == JobStatus.PUBLISHED && j.ExpiredAt >= now && j.CategoryCode != null)
            .GroupBy(j => j.CategoryCode!)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Code, x => x.Count, cancellationToken);

        var result = AdministrativeReference.Categories.Select(cat => new IndustryMetaDto(
            cat.Code,
            cat.Name,
            counts.TryGetValue(cat.Code, out var c) ? c : 0
        )).ToList();

        return Ok(ApiResponse<List<IndustryMetaDto>>.Ok(result));
    }
}
