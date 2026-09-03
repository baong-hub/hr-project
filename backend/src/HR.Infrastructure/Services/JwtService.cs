using HR.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HR.Infrastructure.Services;

public class JwtService(IConfiguration configuration) : IJwtService
{
    public string GenerateToken(int userId, string username, int siteId,
        IEnumerable<int> allowedSiteIds, int minRoleLevel, IEnumerable<string> roles, IEnumerable<string> permissions, int? staffId = null, string? sessionId = null, string? accountType = null)
    {
        var jwtConfig = configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var dbChoice = "crm";
        try
        {
            var defaultConnectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
            var builderTemp = new MySqlConnector.MySqlConnectionStringBuilder(defaultConnectionString);
            if (!string.IsNullOrEmpty(builderTemp.Database))
            {
                dbChoice = builderTemp.Database;
            }
        }
        catch { }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, username),
            new("siteId", siteId.ToString()),
            new("allowedSites", string.Join(",", allowedSiteIds)),
            new("minRoleLevel", minRoleLevel.ToString()),
            new("db", dbChoice)
        };

        if (!string.IsNullOrEmpty(accountType))
        {
            claims.Add(new Claim("accountType", accountType));
        }

        if (!string.IsNullOrEmpty(sessionId))
        {
            claims.Add(new Claim("sid", sessionId));
            claims.Add(new Claim(JwtRegisteredClaimNames.Jti, sessionId));
        }

        if (staffId.HasValue)
        {
            claims.Add(new Claim("staffId", staffId.Value.ToString()));
        }

        // Multi-Role: gộp tất cả roles vào JWT Claims
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        // Gộp tất cả permissions vào JWT Claims
        claims.AddRange(permissions.Select(p => new Claim("permission", p)));

        var token = new JwtSecurityToken(
            issuer: jwtConfig["Issuer"],
            audience: jwtConfig["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(double.Parse(jwtConfig["ExpiryHours"] ?? "8")),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

