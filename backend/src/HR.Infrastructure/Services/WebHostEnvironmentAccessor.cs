using System.IO;
using HR.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace HR.Infrastructure.Services;

public class WebHostEnvironmentAccessor(IWebHostEnvironment env) : IWebHostEnvironmentAccessor
{
    public string WebRootPath => env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
}

