using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Interfaces;
using HR.Application.UserSettings.Commands.UpdateSystemConfigs;
using HR.Application.UserSettings.Queries.GetSystemConfigsGrouped;
using HR.Domain.Entities;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.UserSettings;

public class SystemSettingsTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IEncryptionService _encryptionService;

    public SystemSettingsTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _encryptionService = Substitute.For<IEncryptionService>();
        _encryptionService.Encrypt(Arg.Any<string>()).Returns(x => "ENC_" + x.Arg<string>());
        _encryptionService.Decrypt(Arg.Any<string>()).Returns(x => x.Arg<string>().Replace("ENC_", ""));
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task UpdateSystemConfigs_WhenUpdatingSmtpPassword_ShouldEncryptAndReturnMaskedValue()
    {
        // Arrange
        _context.SettingConfigs.Add(new SettingConfig
        {
            Id = 1,
            ConfigKey = "smtp.password",
            ConfigValue = "",
            Group = "SMTP"
        });
        await _context.SaveChangesAsync();

        var handler = new UpdateSystemConfigsCommandHandler(_context, _encryptionService);
        var command = new UpdateSystemConfigsCommand(new List<UpdateSystemConfigItemDto>
        {
            new("smtp.password", "RealGmailAppPassword123")
        });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!["smtp.password"].Should().Be("******"); // Masked in response

        var saved = await _context.SettingConfigs.FirstAsync(s => s.ConfigKey == "smtp.password");
        saved.ConfigValue.Should().Be("ENC_RealGmailAppPassword123"); // Encrypted in DB
    }

    [Fact]
    public async Task GetSystemConfigsGrouped_ShouldMaskSmtpPassword()
    {
        // Arrange
        _context.SettingConfigs.Add(new SettingConfig
        {
            Id = 1,
            ConfigKey = "smtp.password",
            ConfigValue = "ENC_SecretValue",
            Group = "SMTP"
        });
        await _context.SaveChangesAsync();

        var handler = new GetSystemConfigsGroupedQueryHandler(_context);

        // Act
        var groups = await handler.Handle(new GetSystemConfigsGroupedQuery(), CancellationToken.None);

        // Assert
        var smtpGroup = groups.FirstOrDefault(g => g.GroupName == "SMTP");
        smtpGroup.Should().NotBeNull();
        var passItem = smtpGroup!.Items.FirstOrDefault(i => i.ConfigKey == "smtp.password");
        passItem.Should().NotBeNull();
        passItem!.ConfigValue.Should().Be("******"); // Masked
    }
}
