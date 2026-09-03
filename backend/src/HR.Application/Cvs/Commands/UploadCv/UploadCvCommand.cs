using System.IO;
using HR.Application.Cvs.Dtos;
using MediatR;

namespace HR.Application.Cvs.Commands.UploadCv;

public record UploadCvCommand(
    string CvTitle,
    Stream FileContent,
    string FileName,
    string ContentType,
    long FileSizeBytes
) : IRequest<CandidateCvDto>;
