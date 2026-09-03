using HR.Application.Jobs.Dtos;
using MediatR;

namespace HR.Application.Jobs;

public record GetJobByIdQuery(int Id) : IRequest<JobDto?>;
