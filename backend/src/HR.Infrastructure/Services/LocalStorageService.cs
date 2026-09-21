using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace HR.Infrastructure.Services;

public class LocalStorageService(IWebHostEnvironment environment) : IStorageService
{
    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string folder = "uploads", CancellationToken cancellationToken = default)
    {
        var webRoot = environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var targetFolder = Path.Combine(webRoot, folder);
        if (!Directory.Exists(targetFolder))
        {
            Directory.CreateDirectory(targetFolder);
        }

        var ext = Path.GetExtension(fileName);
        var baseName = Path.GetFileNameWithoutExtension(fileName);
        var cleanBaseName = string.Join("_", baseName.Split(Path.GetInvalidFileNameChars()));
        var uniqueFileName = $"{cleanBaseName}_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(targetFolder, uniqueFileName);

        using (var destStream = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(destStream, cancellationToken);
        }

        return $"/{folder.Replace('\\', '/')}/{uniqueFileName}";
    }

    public Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(fileUrl)) return Task.FromResult(false);

            var cleanPath = fileUrl.TrimStart('/');
            var webRoot = environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var fullPath = Path.Combine(webRoot, cleanPath.Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    public string GetFileUrl(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return string.Empty;
        if (relativePath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            relativePath.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return relativePath;
        }

        return relativePath.StartsWith('/') ? relativePath : $"/{relativePath}";
    }
}
