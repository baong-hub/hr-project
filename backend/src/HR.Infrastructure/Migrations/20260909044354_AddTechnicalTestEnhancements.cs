using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HR.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTechnicalTestEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "technical_tests",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "PENDING",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "FAILED")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "answers_data",
                table: "technical_tests",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "correct_answers_count",
                table: "technical_tests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "passing_score",
                table: "technical_tests",
                type: "int",
                nullable: false,
                defaultValue: 70);

            migrationBuilder.AddColumn<string>(
                name: "questions_data",
                table: "technical_tests",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "start_time",
                table: "technical_tests",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "submitted_at",
                table: "technical_tests",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "title",
                table: "technical_tests",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "total_questions",
                table: "technical_tests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "job_assessment_templates",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    job_id = table.Column<int>(type: "int", nullable: false),
                    title = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    description = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    test_type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    duration_minutes = table.Column<int>(type: "int", nullable: false, defaultValue: 30),
                    passing_score = table.Column<int>(type: "int", nullable: false, defaultValue: 70),
                    total_questions = table.Column<int>(type: "int", nullable: false, defaultValue: 10),
                    questions_data = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    auto_invite_on_apply = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    auto_invite_on_screening = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    is_active = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    created_by = table.Column<int>(type: "int", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_by = table.Column<int>(type: "int", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    deleted_by = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_assessment_templates", x => x.id);
                    table.ForeignKey(
                        name: "fk_job_assessment_templates_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "idx_job_assessment_templates_job_id",
                table: "job_assessment_templates",
                column: "job_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "job_assessment_templates");

            migrationBuilder.DropColumn(
                name: "answers_data",
                table: "technical_tests");

            migrationBuilder.DropColumn(
                name: "correct_answers_count",
                table: "technical_tests");

            migrationBuilder.DropColumn(
                name: "passing_score",
                table: "technical_tests");

            migrationBuilder.DropColumn(
                name: "questions_data",
                table: "technical_tests");

            migrationBuilder.DropColumn(
                name: "start_time",
                table: "technical_tests");

            migrationBuilder.DropColumn(
                name: "submitted_at",
                table: "technical_tests");

            migrationBuilder.DropColumn(
                name: "title",
                table: "technical_tests");

            migrationBuilder.DropColumn(
                name: "total_questions",
                table: "technical_tests");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "technical_tests",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "FAILED",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "PENDING")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
