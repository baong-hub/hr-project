using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Cvs.Queries.SearchCandidates;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HR.UnitTests.Cvs.Queries.SearchCandidates;

public class SearchCandidatesHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly SearchCandidatesHandler _handler;

    public SearchCandidatesHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _handler = new SearchCandidatesHandler(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_ShouldOnlyReturnPublicCandidates()
    {
        // Arrange
        var candPublic = new Candidate
        {
            Id = 1,
            FullName = "Public Dev",
            VisibilityStatus = CandidateVisibilityStatus.PUBLIC,
            User = new User { Id = 1, FullName = "Public Dev", Email = "pub@test.com" }
        };
        var candPrivate = new Candidate
        {
            Id = 2,
            FullName = "Private Dev",
            VisibilityStatus = CandidateVisibilityStatus.PRIVATE,
            User = new User { Id = 2, FullName = "Private Dev", Email = "priv@test.com" }
        };

        _context.Candidates.AddRange(candPublic, candPrivate);
        await _context.SaveChangesAsync();

        // Act
        var result = await _handler.Handle(new SearchCandidatesQuery(), CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].FullName.Should().Be("Public Dev");
    }

    [Fact]
    public async Task Handle_WhenFilteringBySkillAndLocation_ShouldReturnMatchingCandidates()
    {
        // Arrange
        var cand1 = new Candidate
        {
            Id = 10,
            FullName = "React Pro",
            Skills = "React, TypeScript, Redux",
            VisibilityStatus = CandidateVisibilityStatus.PUBLIC,
            User = new User { Id = 10, FullName = "React Pro", Address = "Hà Nội" }
        };
        var cand2 = new Candidate
        {
            Id = 20,
            FullName = "Java Master",
            Skills = "Java, Spring Boot",
            VisibilityStatus = CandidateVisibilityStatus.PUBLIC,
            User = new User { Id = 20, FullName = "Java Master", Address = "Hồ Chí Minh" }
        };

        _context.Candidates.AddRange(cand1, cand2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _handler.Handle(
            new SearchCandidatesQuery(Skill: "React", Location: "Hà Nội"),
            CancellationToken.None
        );

        // Assert
        result.Should().HaveCount(1);
        result[0].FullName.Should().Be("React Pro");
        result[0].Location.Should().Be("Hà Nội");
    }
}
