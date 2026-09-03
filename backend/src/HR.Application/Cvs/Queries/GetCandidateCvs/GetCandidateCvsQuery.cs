using System.Collections.Generic;
using HR.Application.Cvs.Dtos;
using MediatR;

namespace HR.Application.Cvs.Queries.GetCandidateCvs;

public record GetCandidateCvsQuery : IRequest<List<CandidateCvDto>>;
