using System;
using System.IO;
using System.Threading.RateLimiting;
using Serilog;
using HR.API.Middleware;
using HR.Application;
using HR.Infrastructure;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Diagnostics.HealthChecks;

// Nạp file .env từ thư mục hiện tại hoặc thư mục cha (nếu tồn tại) vào Environment Variables
var searchDir = new DirectoryInfo(Directory.GetCurrentDirectory());
for (int i = 0; i < 3 && searchDir != null; i++)
{
    var envPath = Path.Combine(searchDir.FullName, ".env");
    if (File.Exists(envPath))
    {
        foreach (var line in File.ReadAllLines(envPath))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#') || !trimmed.Contains('='))
                continue;
            var parts = trimmed.Split('=', 2);
            var k = parts[0].Trim();
            var v = parts[1].Trim();
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(k)))
            {
                Environment.SetEnvironmentVariable(k, v);
            }
        }
        break;
    }
    searchDir = searchDir.Parent;
}

var builder = WebApplication.CreateBuilder(args);

// Add Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthorization();

// Add Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Add SignalR
builder.Services.AddSignalR();
builder.Services.AddScoped<HR.Application.Common.Interfaces.INotificationSender, HR.API.Services.NotificationSender>();

// Cấu hình CORS siết chặt theo domain được phép thay vì Allow-All
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://10.10.30.15", "https://10.10.30.15" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Cấu hình Rate Limiting chống Brute-force & DDoS
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("AuthLimiter", opt =>
    {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.AddSlidingWindowLimiter("GeneralLimiter", opt =>
    {
        opt.PermitLimit = 150;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;
    });
});

// Cấu hình Health Checks
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("API is running"));

// Forwarded Headers cho Nginx Reverse Proxy / SSL Termination
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
var uploadsPath = Path.Combine(wwwrootPath, "uploads");

if (!Directory.Exists(wwwrootPath)) Directory.CreateDirectory(wwwrootPath);
if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

builder.Environment.WebRootPath = wwwrootPath;
var physicalFileProvider = new PhysicalFileProvider(wwwrootPath);
builder.Environment.WebRootFileProvider = physicalFileProvider;

var contentTypeProvider = new FileExtensionContentTypeProvider();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = physicalFileProvider,
    ContentTypeProvider = contentTypeProvider,
    ServeUnknownFileTypes = true,
    DefaultContentType = "application/octet-stream"
});

app.UseCors("CorsPolicy");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Health Check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");

app.MapControllers();

// Map SignalR Hubs
app.MapHub<HR.API.Hubs.NotificationHub>("/hubs/notifications");
app.MapHub<HR.API.Hubs.UserPresenceHub>("/hubs/userpresence");
app.MapHub<HR.API.Hubs.ChatHub>("/hubs/chat");

try
{
    Log.Information("Starting HR Portal API...");
    
    // Seed database an toàn, không bao giờ tự ý xoá database khi migration gặp lỗi
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        try
        {
            Log.Information("Applying migrations and seeding database...");
            await context.Database.MigrateAsync();
            await DataSeeder.SeedAsync(context, builder.Configuration, builder.Environment);
            Log.Information("Database successfully migrated and seeded.");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "An error occurred while migrating or seeding the database. Automatic database deletion disabled.");
        }
    }

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }
