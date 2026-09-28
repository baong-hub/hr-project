using HR.Domain.Reference;
using Xunit;

namespace HR.UnitTests.Jobs;

public class AdministrativeReferenceTests
{
    [Theory]
    [InlineData("Bình Dương", "ho-chi-minh")]
    [InlineData("TP.HCM", "ho-chi-minh")]
    [InlineData("Sài Gòn", "ho-chi-minh")]
    [InlineData("Hải Dương", "hai-phong")]
    [InlineData("Nam Định", "ninh-binh")]
    [InlineData("Ha Noi", "ha-noi")]
    [InlineData("Hà Nội", "ha-noi")]
    [InlineData("Đà Nẵng", "da-nang")]
    [InlineData("Quảng Nam", "da-nang")]
    [InlineData("Bà Rịa - Vũng Tàu", "ho-chi-minh")]
    [InlineData("Kiên Giang", "an-giang")]
    public void MatchProvince_KnownNamesAndLegacyMergedNames_ShouldReturnCorrectCode(string input, string expectedCode)
    {
        var result = AdministrativeReference.MatchProvince(input);
        Assert.Equal(expectedCode, result);
    }

    [Theory]
    [InlineData("Tokyo")]
    [InlineData("California")]
    [InlineData("UnknownCity12345")]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void MatchProvince_UnmatchedOrInvalid_ShouldReturnNull(string? input)
    {
        var result = AdministrativeReference.MatchProvince(input);
        Assert.Null(result);
    }

    [Fact]
    public void Provinces_ShouldContainExactly34ProvincesAndCities()
    {
        var provinces = AdministrativeReference.Provinces;
        Assert.Equal(34, provinces.Count);

        var cities = provinces.Where(p => p.Type == "city").ToList();
        Assert.Equal(6, cities.Count);

        var provincesOnly = provinces.Where(p => p.Type == "province").ToList();
        Assert.Equal(28, provincesOnly.Count);
    }

    [Fact]
    public void Categories_ShouldContain36Categories()
    {
        var categories = AdministrativeReference.Categories;
        Assert.Equal(36, categories.Count);
    }

    [Theory]
    [InlineData("IT / Phần mềm", "cong-nghe-thong-tin")]
    [InlineData("Kế toán - Kiểm toán", "ke-toan-kiem-toan")]
    [InlineData("Sales / Bán hàng", "kinh-doanh-ban-hang")]
    [InlineData("Tuyển dụng & HR", "nhan-su-tuyen-dung")]
    public void MatchCategory_CommonSynonyms_ShouldReturnCorrectCategoryCode(string input, string expectedCode)
    {
        var result = AdministrativeReference.MatchCategory(input);
        Assert.Equal(expectedCode, result);
    }
}
