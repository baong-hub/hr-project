using System;
using MediatR;

namespace HR.Application.Jobs;

public record UpdateJobCommand(
    int Id,
    string Title,
    string Description,
    string Requirements,
    string? Benefits,
    decimal? SalaryFrom,
    decimal? SalaryTo,
    string City,
    DateTime ExpiredAt
) : IRequest<bool>;

public record DeleteJobCommand(int Id) : IRequest<bool>;
