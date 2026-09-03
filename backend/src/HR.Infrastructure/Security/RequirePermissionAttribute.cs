using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using HR.Application.Common.Interfaces;

namespace HR.Infrastructure.Security;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequirePermissionAttribute : AuthorizeAttribute, IAuthorizationFilter
{
    public string[] Permissions { get; }

    public RequirePermissionAttribute(params string[] permissions)
    {
        Permissions = permissions;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (user.Identity == null || !user.Identity.IsAuthenticated)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Sử dụng ICurrentUserService để kiểm tra quyền cho thống nhất logic
        var currentUserService = context.HttpContext.RequestServices.GetRequiredService<ICurrentUserService>();
        
        bool hasPermission = false;
        foreach (var permission in Permissions)
        {
            if (currentUserService.HasPermission(permission))
            {
                hasPermission = true;
                break;
            }
        }

        if (!hasPermission)
        {
            context.Result = new ForbidResult();
        }
    }
}

