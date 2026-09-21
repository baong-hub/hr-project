using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HR.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthVerificationAndGoogleAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_email_verified",
                table: "users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "email_verification_token",
                table: "users",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "email_verification_token_expires_at",
                table: "users",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "password_reset_token",
                table: "users",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "password_reset_token_expires_at",
                table: "users",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "google_id",
                table: "users",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_email_verified",
                table: "users");

            migrationBuilder.DropColumn(
                name: "email_verification_token",
                table: "users");

            migrationBuilder.DropColumn(
                name: "email_verification_token_expires_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_token",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_token_expires_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "google_id",
                table: "users");
        }
    }
}
