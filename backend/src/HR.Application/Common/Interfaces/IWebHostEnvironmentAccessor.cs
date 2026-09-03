namespace HR.Application.Common.Interfaces;

/// <summary>
/// Abstraction để Application Layer có thể truy cập WebRootPath
/// mà không cần reference trực tiếp vào Microsoft.AspNetCore.Hosting
/// </summary>
public interface IWebHostEnvironmentAccessor
{
    string WebRootPath { get; }
}

