using System.Collections.Generic;

namespace HR.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public ApiError? Error { get; set; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Fail(string code, string message, List<ApiErrorDetail>? details = null) 
        => new() { Success = false, Error = new ApiError { Code = code, Message = message, Details = details } };
}

public class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<ApiErrorDetail>? Details { get; set; }
}

public class ApiErrorDetail
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public PagingMeta Meta { get; set; } = new();
}

public class PagingMeta
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long Total { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
}

