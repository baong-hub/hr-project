using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace HR.Application.Common.Security;

public static class PitelHelper
{
    public static string GenerateToken(string apiKey, string apiSecret, string extension, int expireDays = 1)
    {
        // 1. Header
        var header = new { alg = "HS256", typ = "JWT", org = "pitel-helpers-nodejs;version=1" };
        var headerJson = JsonSerializer.Serialize(header);
        var headerBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));

        // 2. Payload
        var now = (long)(DateTime.UtcNow - DateTime.UnixEpoch).TotalSeconds;
        var exp = now + (expireDays * 24 * 3600);
        var payload = new
        {
            k = apiKey,
            e = exp,
            u = extension,
            iat = now
        };
        var payloadJson = JsonSerializer.Serialize(payload);
        var payloadBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));

        // 3. Signature
        var rawToken = $"{headerBase64}.{payloadBase64}";
        var keyBytes = Encoding.UTF8.GetBytes(apiSecret);
        var messageBytes = Encoding.UTF8.GetBytes(rawToken);

        using var hmac = new HMACSHA256(keyBytes);
        var signatureBytes = hmac.ComputeHash(messageBytes);
        var signatureBase64 = Base64UrlEncode(signatureBytes);

        return $"{rawToken}.{signatureBase64}";
    }

    private static string Base64UrlEncode(byte[] input)
    {
        return Convert.ToBase64String(input)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}

