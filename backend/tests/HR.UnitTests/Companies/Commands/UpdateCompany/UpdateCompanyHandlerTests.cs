using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Companies.Commands.UpdateCompany;
using HR.Domain.Entities;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Companies.Commands.UpdateCompany;

public class UpdateCompanyHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly UpdateCompanyHandler _handler;

    public UpdateCompanyHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _handler = new UpdateCompanyHandler(_context, _currentUserService);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenUserNotBelongsToCompany_ShouldThrowForbidden()
    {
        // Arrange
        var currentUserId = 10;
        _currentUserService.UserId.Returns(currentUserId);

        // Đăng ký User hiện tại có Role là Nhà tuyển dụng (không phải ADMIN)
        var user = new User
        {
            Id = currentUserId,
            Username = "employer1",
            Email = "emp1@example.com",
            Role = new Role { Id = 1, Name = "Nhà tuyển dụng" }
        };

        // Doanh nghiệp cần sửa có ID là 1
        var company = new Company
        {
            Id = 1,
            Name = "Company A",
            Address = "Address A",
            Industry = "IT",
            SizeRange = "10-50"
        };

        // Nhưng Employer thuộc Company 2
        var employer = new Employer
        {
            Id = 1,
            UserId = currentUserId,
            CompanyId = 2 // Khác Company ID 1
        };

        _context.Users.Add(user);
        _context.Companies.Add(company);
        _context.Employers.Add(employer);
        await _context.SaveChangesAsync();

        var command = new UpdateCompanyCommand(
            Id: 1,
            Name: "Company A Updated",
            LogoUrl: "https://example.com/logo.png",
            BannerUrl: "https://example.com/banner.png",
            Description: "Updated description text here...",
            Website: "https://companya.com",
            SizeRange: "50-100",
            Industry: "IT Services",
            AddressList: "Address A Updated"
        );

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("Bạn không có quyền cập nhật thông tin doanh nghiệp này.");
    }

    [Fact]
    public async Task Handle_WhenValidInput_ShouldUpdateAndReturnCompany()
    {
        // Arrange
        var currentUserId = 20;
        _currentUserService.UserId.Returns(currentUserId);

        var user = new User
        {
            Id = currentUserId,
            Username = "employer2",
            Email = "emp2@example.com",
            Role = new Role { Id = 2, Name = "Nhà tuyển dụng" }
        };

        var company = new Company
        {
            Id = 2,
            Name = "Company B",
            Address = "Address B",
            Industry = "Finance",
            SizeRange = "50-100"
        };

        var employer = new Employer
        {
            Id = 2,
            UserId = currentUserId,
            CompanyId = 2 // Thuộc đúng công ty 2
        };

        _context.Users.Add(user);
        _context.Companies.Add(company);
        _context.Employers.Add(employer);
        await _context.SaveChangesAsync();

        var command = new UpdateCompanyCommand(
            Id: 2,
            Name: "Company B New Name",
            LogoUrl: "https://example.com/logo-b.png",
            BannerUrl: "https://example.com/banner-b.png",
            Description: "New company description details.",
            Website: "https://companyb.com",
            SizeRange: "100-500",
            Industry: "Banking",
            AddressList: "Address B Main Office\nAddress B Second Office"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(2);
        result.Name.Should().Be("Company B New Name");
        result.SizeRange.Should().Be("100-500");
        result.Address.Should().Be("Address B Main Office\nAddress B Second Office");

        var updatedCompanyInDb = await _context.Companies.FirstOrDefaultAsync(c => c.Id == 2);
        updatedCompanyInDb.Should().NotBeNull();
        updatedCompanyInDb!.Name.Should().Be("Company B New Name");
        updatedCompanyInDb.Website.Should().Be("https://companyb.com");
    }
}
