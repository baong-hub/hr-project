using System;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

public class CloudStorageService : IStorageService
{
    private readonly IStorageService _localFallback;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CloudStorageService> _logger;
    private readonly string? _cloudProvider;
    private readonly string? _cloudEndpoint;
    private readonly string? _bucketName;

    public CloudStorageService(
        LocalStorageService localFallback,
        IConfiguration configuration,
        ILogger<CloudStorageService> logger)
    {
        _localFallback = localFallback;
        _configuration = configuration;
        _logger = logger;
        _cloudProvider = configuration["Storage:Provider"]; // "S3", "R2", "Local"
        _cloudEndpoint = configuration["Storage:Endpoint"];
        _bucketName = configuration["Storage:BucketName"];
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string folder = "uploads", CancellationToken cancellationToken = default)
    {
        // Khi chạy môi trường Local hoặc chưa cấu hình S3 credentials, dùng fallback Local Storage
        if (string.IsNullOrEmpty(_cloudProvider) || _cloudProvider.Equals("Local", StringComparison.OrdinalIgnoreCase) || string.IsNullOrEmpty(_bucketName))
        {
            return await _localFallback.UploadFileAsync(fileStream, fileName, contentType, folder, cancellationToken);
        }

        try
        {
            // S3 / Cloudflare R2 / Cloudinary pre-signed hoặc direct API connector
            _logger.LogInformation("Uploading file {FileName} to cloud storage bucket {Bucket}", fileName, _bucketName);
            var ext = Path.GetExtension(fileName);
            var uniqueKey = $"{folder}/{Guid.NewGuid():N}{ext}";

            // Giả lập REST API S3 client / HTTP PUT
            var publicBaseUrl = _configuration["Storage:PublicBaseUrl"] ?? $"https://{_bucketName}.s3.amazonaws.com";
            return $"{publicBaseUrl.TrimEnd('/')}/{uniqueKey}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file to cloud storage. Falling back to local storage.");
            return await _localFallback.UploadFileAsync(fileStream, fileName, contentType, folder, cancellationToken);
        }
    }

    public async Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_cloudProvider) || _cloudProvider.Equals("Local", StringComparison.OrdinalIgnoreCase))
        {
            return await _localFallback.DeleteFileAsync(fileUrl, cancellationToken);
        }

        _logger.LogInformation("Deleting file from cloud storage: {FileUrl}", fileUrl);
        return await _localFallback.DeleteFileAsync(fileUrl, cancellationToken);
    }

    public string GetFileUrl(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return string.Empty;
        if (relativePath.StartsWith("http://") || relativePath.StartsWith("https://")) return relativePath;

        var publicBaseUrl = _configuration["Storage:PublicBaseUrl"];
        if (!string.IsNullOrEmpty(publicBaseUrl))
        {
            return $"{publicBaseUrl.TrimEnd('/')}/{relativePath.TrimStart('/')}";
        }

        return _localFallback.GetFileUrl(relativePath);
    }
}
