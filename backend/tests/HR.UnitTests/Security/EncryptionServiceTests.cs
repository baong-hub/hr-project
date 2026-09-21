using System;
using System.Collections.Generic;
using FluentAssertions;
using HR.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace HR.UnitTests.Security;

public class EncryptionServiceTests
{
    private readonly EncryptionService _encryptionService;

    public EncryptionServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:EncryptionKey"] = "test_super_secret_encryption_key_32_bytes_long"
            })
            .Build();

        _encryptionService = new EncryptionService(config);
    }

    [Fact]
    public void Encrypt_And_Decrypt_ShouldReturnOriginalString()
    {
        // Arrange
        var originalText = "SuperSecretGmailAppPassword16Char";

        // Act
        var encrypted = _encryptionService.Encrypt(originalText);
        var decrypted = _encryptionService.Decrypt(encrypted);

        // Assert
        encrypted.Should().NotBeNullOrWhiteSpace();
        encrypted.Should().NotBe(originalText);
        decrypted.Should().Be(originalText);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Encrypt_WithNullOrEmpty_ShouldReturnSameValue(string? input)
    {
        var result = _encryptionService.Encrypt(input!);
        result.Should().Be(input);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Decrypt_WithNullOrEmpty_ShouldReturnSameValue(string? input)
    {
        var result = _encryptionService.Decrypt(input!);
        result.Should().Be(input);
    }

    [Fact]
    public void Decrypt_WithInvalidCipherText_ShouldReturnInputSafely()
    {
        // Arrange
        var invalidCipher = "not_a_valid_base64_ciphertext!@#$";

        // Act
        var result = _encryptionService.Decrypt(invalidCipher);

        // Assert - should not throw, gracefully returns input
        result.Should().Be(invalidCipher);
    }
}
