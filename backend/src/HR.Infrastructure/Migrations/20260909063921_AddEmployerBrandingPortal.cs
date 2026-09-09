using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HR.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployerBrandingPortal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "company_faqs",
                table: "companies",
                type: "json",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "culture_highlights",
                table: "companies",
                type: "json",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "office_gallery",
                table: "companies",
                type: "json",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "testimonials",
                table: "companies",
                type: "json",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "video_url",
                table: "companies",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "company_faqs",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "culture_highlights",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "office_gallery",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "testimonials",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "video_url",
                table: "companies");
        }
    }
}
