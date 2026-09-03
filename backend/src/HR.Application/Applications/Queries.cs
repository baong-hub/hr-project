using System.Collections.Generic;
using MediatR;

namespace HR.Application.Applications;

public record GetApplicationsQuery(int? JobId, string? Keyword) : IRequest<List<ApplicationDto>>;

public record GetApplicationByIdQuery(int Id) : IRequest<ApplicationDto?>;
