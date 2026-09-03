using MediatR;
using System;
using HR.Application.Jobs.Dtos;

namespace HR.Application.Jobs.Commands.CreateJob;

public record CreateJobCommand(
    string Title,
    string Description,
    string Requirements,
    string? Benefits,
    decimal? SalaryFrom,
    decimal? SalaryTo,
    string City,
    DateTime ExpiredAt
) : IRequest<JobDto>;
