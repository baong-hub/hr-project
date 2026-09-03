using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore.Design;

namespace HR.Infrastructure.Persistence;

/// <summary>
/// Factory dùng cho EF Core CLI migrations (dotnet ef migrations add ...)
/// Không dùng trong runtime – chỉ dùng tại design time.
/// </summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        // Get environment
        string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

        // Build config
        var config = new Microsoft.Extensions.Configuration.ConfigurationBuilder()
            .SetBasePath(System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "../HR.API"))
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var connectionString = config.GetConnectionString("DefaultConnection");

        optionsBuilder.UseMySql(
            connectionString,
            new MySqlServerVersion(new Version(10, 4, 0)));

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}

