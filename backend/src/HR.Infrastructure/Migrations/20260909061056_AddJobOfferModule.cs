using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HR.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJobOfferModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "job_offers",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    application_id = table.Column<int>(type: "int", nullable: false),
                    job_id = table.Column<int>(type: "int", nullable: false),
                    candidate_id = table.Column<int>(type: "int", nullable: false),
                    created_by_employer_id = table.Column<int>(type: "int", nullable: false),
                    position_title = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    department_name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    work_location = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    working_hours = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    basic_salary = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    allowance = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    salary_type = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    currency = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, defaultValue: "VND")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    probation_period_months = table.Column<int>(type: "int", nullable: false, defaultValue: 2),
                    probation_salary_percentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false, defaultValue: 85m),
                    start_date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    expiry_date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    issued_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    responded_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    benefits = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    special_terms = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    notes = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    offer_letter_file_url = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    offer_letter_file_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    candidate_response_note = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    candidate_desired_salary = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    decline_reason = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    created_by = table.Column<int>(type: "int", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_by = table.Column<int>(type: "int", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    deleted_by = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_offers", x => x.id);
                    table.ForeignKey(
                        name: "fk_job_offers_applications_application_id",
                        column: x => x.application_id,
                        principalTable: "applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_job_offers_candidates_candidate_id",
                        column: x => x.candidate_id,
                        principalTable: "candidates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_job_offers_employers_created_by_employer_id",
                        column: x => x.created_by_employer_id,
                        principalTable: "employers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_job_offers_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "ix_job_offers_application_id",
                table: "job_offers",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "ix_job_offers_candidate_id",
                table: "job_offers",
                column: "candidate_id");

            migrationBuilder.CreateIndex(
                name: "ix_job_offers_created_by_employer_id",
                table: "job_offers",
                column: "created_by_employer_id");

            migrationBuilder.CreateIndex(
                name: "ix_job_offers_job_id",
                table: "job_offers",
                column: "job_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "job_offers");
        }
    }
}
