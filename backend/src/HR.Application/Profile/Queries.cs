using MediatR;

namespace HR.Application.Profile;

public record GetMyProfileQuery : IRequest<UserProfileDto>;

