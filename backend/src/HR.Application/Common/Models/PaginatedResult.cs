namespace HR.Application.Common.Models;

public record PaginatedResult<T>(IEnumerable<T> Items, int TotalCount, int TotalPages, int Page, int PageSize);

