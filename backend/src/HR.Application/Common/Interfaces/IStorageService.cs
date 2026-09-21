using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string folder = "uploads", CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default);
    string GetFileUrl(string relativePath);
}
