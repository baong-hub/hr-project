using Serilog;
using HR.API.Middleware;
using HR.Application;
using HR.Infrastructure;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;

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

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.SetIsOriginAllowed(origin => true)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
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

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

try
{
    Log.Information("Starting HR Portal API...");
    
    // Seed database
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        try
        {
            Log.Information("Applying migrations and seeding database...");
            try
            {
                await context.Database.MigrateAsync();
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Migration failed due to schema conflict. Re-creating database to ensure clean schema...");
                await context.Database.EnsureDeletedAsync();
                await context.Database.MigrateAsync();
            }

            await DataSeeder.SeedAsync(context);
            Log.Information("Database successfully migrated and seeded.");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "An error occurred while migrating or seeding the database.");
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
