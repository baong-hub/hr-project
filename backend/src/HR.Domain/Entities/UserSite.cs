using System.ComponentModel.DataAnnotations.Schema;
namespace HR.Domain.Entities;

/// <summary>Bảng mapping nhiều-nhiều giữa Người dùng và Chi nhánh (Site)</summary>
public class UserSite : BaseEntity
{
    [Column("user_id")]
    public int UserId { get; set; }
    [Column("site_id")]
    public int SiteId { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Site Site { get; set; } = null!;
}

