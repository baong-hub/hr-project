using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HR.Infrastructure.Persistence;
using HR.Application.Common.Interfaces;

namespace HR.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
        {
            var config = serviceProvider.GetRequiredService<IConfiguration>();
            var defaultConnectionString = config.GetConnectionString("DefaultConnection") ?? "";

            var dbName = "hr_portal";

            // Extract default DB name from connection string as fallback
            try
            {
                var builderTemp = new MySqlConnector.MySqlConnectionStringBuilder(defaultConnectionString);
                if (!string.IsNullOrEmpty(builderTemp.Database))
                {
                    dbName = builderTemp.Database;
                }
            }
            catch { }

            var finalConnectionString = defaultConnectionString;
            try
            {
                var builder = new MySqlConnector.MySqlConnectionStringBuilder(defaultConnectionString);
                builder.Database = dbName;
                finalConnectionString = builder.ConnectionString;
            }
            catch { }

            Console.WriteLine($"[DB_CONNECTION] Using database: '{dbName}'");

            options.UseMySql(finalConnectionString, new MySqlServerVersion(new Version(8, 0, 31)),
                mysqlOptions => mysqlOptions.EnableRetryOnFailure());
        });

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        
        services.AddSingleton<IDateTimeProvider, HR.Infrastructure.Services.DateTimeProvider>();
        
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, HR.Infrastructure.Services.CurrentUserService>();
        services.AddScoped<IOrganizationService, HR.Infrastructure.Services.OrganizationService>();
        services.AddScoped<IActivityLogService, HR.Infrastructure.Services.ActivityLogService>();
        services.AddScoped<ISettingService, HR.Infrastructure.Services.SettingService>();
        services.AddMemoryCache();

        // Identity & JWT
        services.AddTransient<IJwtService, HR.Infrastructure.Services.JwtService>();
        services.AddTransient<IPasswordHasher, HR.Infrastructure.Services.PasswordHasher>();

        var jwtSection = configuration.GetSection("Jwt");
        var secretKey = jwtSection["Key"];
        var key = Encoding.ASCII.GetBytes(secretKey!);

        services.AddAuthentication(x =>
        {
            x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(x =>
        {
            x.RequireHttpsMetadata = false;
            x.SaveToken = true;
            x.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidIssuer = jwtSection["Issuer"],
                ValidAudience = jwtSection["Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
            x.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    var sidClaim = context.Principal?.FindFirst("sid")?.Value
                                ?? context.Principal?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;
                    if (!string.IsNullOrEmpty(sidClaim))
                    {
                        var sessionValidationService = context.HttpContext.RequestServices.GetRequiredService<ISessionValidationService>();
                        var isRevoked = await sessionValidationService.IsSessionRevokedAsync(sidClaim, context.HttpContext.RequestAborted);
                        if (isRevoked)
                        {
                            context.Fail("Session has been revoked.");
                        }
                    }
                }
            };
        });

        // Infrastructure APIs
        services.AddTransient<IWebHostEnvironmentAccessor, HR.Infrastructure.Services.WebHostEnvironmentAccessor>();
        services.AddSingleton<IEncryptionService, HR.Infrastructure.Security.EncryptionService>();
        services.AddSingleton<IUserPresenceService, HR.Infrastructure.Services.UserPresenceService>();
        services.AddSingleton<ISessionValidationService, HR.Infrastructure.Services.SessionValidationService>();

        return services;
    }
}
