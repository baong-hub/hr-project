using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Cvs.Commands.UploadCv;
using HR.Domain.Entities;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Cvs.Commands.UploadCv;

public class UploadCvHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly UploadCvHandler _handler;

    public UploadCvHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _handler = new UploadCvHandler(_context, _currentUserService);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenCvCountExceeds5_ShouldThrowBadRequestException()
    {
        // Arrange
        var currentUserId = 1;
        _currentUserService.UserId.Returns(currentUserId);

        var candidate = new Candidate
        {
            Id = 100,
            UserId = currentUserId,
            FullName = "Candidate Test"
        };
        _context.Candidates.Add(candidate);

        // Add 5 existing CVs
        for (int i = 1; i <= 5; i++)
        {
            _context.CandidateCvs.Add(new CandidateCv
            {
                Id = i,
                CandidateId = candidate.Id,
                CvTitle = $"CV {i}",
                FileUrl = $"/uploads/cvs/cv-{i}.pdf",
                IsDefault = i == 1
            });
        }
        await _context.SaveChangesAsync();

        var dummyStream = new MemoryStream(Encoding.UTF8.GetBytes("pdf content"));
        var command = new UploadCvCommand(
            CvTitle: "CV 6 New",
            FileContent: dummyStream,
            FileName: "mycv.pdf",
            ContentType: "application/pdf",
            FileSizeBytes: dummyStream.Length
        );

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BadRequestException>()
            .WithMessage("Bạn đã đạt giới hạn tối đa 5 bản CV.");
    }

    [Fact]
    public async Task Handle_WhenFileNotPdf_ShouldThrowBadRequestException()
    {
        // Arrange
        var currentUserId = 1;
        _currentUserService.UserId.Returns(currentUserId);

        var dummyStream = new MemoryStream(Encoding.UTF8.GetBytes("image content"));
        var command = new UploadCvCommand(
            CvTitle: "CV Invalid Format",
            FileContent: dummyStream,
            FileName: "image.png",
            ContentType: "image/png",
            FileSizeBytes: dummyStream.Length
        );

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BadRequestException>()
            .WithMessage("Định dạng file không hợp lệ (Chỉ nhận PDF).");
    }

    [Fact]
    public async Task Handle_WhenFileSizeGreaterThan5MB_ShouldThrowBadRequestException()
    {
        // Arrange
        var currentUserId = 1;
        _currentUserService.UserId.Returns(currentUserId);

        var dummyStream = new MemoryStream(new byte[6 * 1024 * 1024]); // 6MB
        var command = new UploadCvCommand(
            CvTitle: "CV Too Large",
            FileContent: dummyStream,
            FileName: "largecv.pdf",
            ContentType: "application/pdf",
            FileSizeBytes: dummyStream.Length
        );

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BadRequestException>()
            .WithMessage("Dung lượng file CV vượt quá 5MB.");
    }

    [Fact]
    public async Task Handle_WhenValidPdfFile_ShouldSaveToStorage()
    {
        // Arrange
        var currentUserId = 2;
        _currentUserService.UserId.Returns(currentUserId);

        var candidate = new Candidate
        {
            Id = 200,
            UserId = currentUserId,
            FullName = "Candidate 2"
        };
        _context.Candidates.Add(candidate);
        // Has 1 existing default CV
        _context.CandidateCvs.Add(new CandidateCv
        {
            Id = 10,
            CandidateId = candidate.Id,
            CvTitle = "Old CV",
            FileUrl = "/uploads/cvs/old.pdf",
            IsDefault = true
        });
        await _context.SaveChangesAsync();

        var dummyStream = new MemoryStream(Encoding.UTF8.GetBytes("pdf content"));
        var command = new UploadCvCommand(
            CvTitle: "New Uploaded CV",
            FileContent: dummyStream,
            FileName: "cv2.pdf",
            ContentType: "application/pdf",
            FileSizeBytes: dummyStream.Length
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.CvTitle.Should().Be("New Uploaded CV");
        result.IsDefault.Should().BeFalse(); // Not first CV, should not set as default
        result.FileUrl.Should().Contain("/uploads/cvs/");

        var cvInDb = await _context.CandidateCvs.FirstOrDefaultAsync(c => c.Id == result.Id);
        cvInDb.Should().NotBeNull();
        cvInDb!.CvTitle.Should().Be("New Uploaded CV");
        cvInDb.IsDefault.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenFirstCvUploaded_ShouldSetAsMain()
    {
        // Arrange
        var currentUserId = 3;
        _currentUserService.UserId.Returns(currentUserId);

        var dummyStream = new MemoryStream(Encoding.UTF8.GetBytes("first pdf content"));
        var command = new UploadCvCommand(
            CvTitle: "First CV",
            FileContent: dummyStream,
            FileName: "first.pdf",
            ContentType: "application/pdf",
            FileSizeBytes: dummyStream.Length
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.CvTitle.Should().Be("First CV");
        result.IsDefault.Should().BeTrue(); // First CV, should automatically set as main/default

        var cvInDb = await _context.CandidateCvs.FirstOrDefaultAsync(c => c.Id == result.Id);
        cvInDb.Should().NotBeNull();
        cvInDb!.IsDefault.Should().BeTrue();
    }
}
