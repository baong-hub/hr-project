using HR.Application.Cvs.Dtos;
using MediatR;

namespace HR.Application.Cvs.Queries.GetCandidateProfile;

public record GetMyCandidateProfileQuery : IRequest<CandidateProfileDto?>;
