using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace HR.API.Controllers;

[ApiController]
[AllowAnonymous]
public class SitemapController(ApplicationDbContext context, IConfiguration configuration) : ControllerBase
{
    [HttpGet("sitemap.xml")]
    [HttpGet("api/v1/sitemap.xml")]
    [Produces("application/xml")]
    public async Task<IActionResult> GetSitemap()
    {
        var baseUrl = configuration["Frontend:BaseUrl"] ?? configuration["App:FrontendUrl"] ?? "https://tuyendung.hamo.vn";
        if (baseUrl.EndsWith('/')) baseUrl = baseUrl.TrimEnd('/');

        var jobs = await context.Jobs
            .AsNoTracking()
            .Where(j => j.Status == JobStatus.PUBLISHED && j.DeletedAt == null && j.ExpiredAt > DateTime.UtcNow)
            .OrderByDescending(j => j.CreatedAt)
            .Take(1000)
            .Select(j => new { j.Id, j.UpdatedAt, j.CreatedAt })
            .ToListAsync();

        var companies = await context.Companies
            .AsNoTracking()
            .Where(c => c.IsVerified && c.DeletedAt == null)
            .OrderByDescending(c => c.CreatedAt)
            .Take(500)
            .Select(c => new { c.Id, c.UpdatedAt, c.CreatedAt })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

        // Static routes
        sb.AppendLine($"  <url><loc>{baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>");
        sb.AppendLine($"  <url><loc>{baseUrl}/jobs</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>");
        sb.AppendLine($"  <url><loc>{baseUrl}/companies</loc><changefreq>daily</changefreq><priority>0.8</priority></url>");
        sb.AppendLine($"  <url><loc>{baseUrl}/pricing</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>");
        sb.AppendLine($"  <url><loc>{baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>");
        sb.AppendLine($"  <url><loc>{baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>");
        sb.AppendLine($"  <url><loc>{baseUrl}/terms</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>");
        sb.AppendLine($"  <url><loc>{baseUrl}/privacy</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>");

        // Dynamic Job URLs
        foreach (var job in jobs)
        {
            var lastMod = (job.UpdatedAt != default ? job.UpdatedAt : job.CreatedAt).ToString("yyyy-MM-dd");
            sb.AppendLine($"  <url>");
            sb.AppendLine($"    <loc>{baseUrl}/jobs/{job.Id}</loc>");
            sb.AppendLine($"    <lastmod>{lastMod}</lastmod>");
            sb.AppendLine($"    <changefreq>daily</changefreq>");
            sb.AppendLine($"    <priority>0.8</priority>");
            sb.AppendLine($"  </url>");
        }

        // Dynamic Company URLs
        foreach (var comp in companies)
        {
            var lastMod = (comp.UpdatedAt != default ? comp.UpdatedAt : comp.CreatedAt).ToString("yyyy-MM-dd");
            sb.AppendLine($"  <url>");
            sb.AppendLine($"    <loc>{baseUrl}/companies/{comp.Id}</loc>");
            sb.AppendLine($"    <lastmod>{lastMod}</lastmod>");
            sb.AppendLine($"    <changefreq>weekly</changefreq>");
            sb.AppendLine($"    <priority>0.7</priority>");
            sb.AppendLine($"  </url>");
        }

        sb.AppendLine("</urlset>");

        return Content(sb.ToString(), "application/xml", Encoding.UTF8);
    }
}
