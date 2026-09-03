using MediatR;
using HR.Application.SavedJobs.Dtos;

namespace HR.Application.SavedJobs.Commands.ToggleSaveJob;

public record ToggleSaveJobCommand(int JobId) : IRequest<SaveToggleResultDto>;
