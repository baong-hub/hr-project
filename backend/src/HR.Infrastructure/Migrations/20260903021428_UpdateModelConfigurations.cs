using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HR.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModelConfigurations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_jobs_companies_company_id1",
                table: "jobs");

            migrationBuilder.DropIndex(
                name: "ix_jobs_company_id1",
                table: "jobs");

            migrationBuilder.DropColumn(
                name: "company_id1",
                table: "jobs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "company_id1",
                table: "jobs",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_jobs_company_id1",
                table: "jobs",
                column: "company_id1");

            migrationBuilder.AddForeignKey(
                name: "fk_jobs_companies_company_id1",
                table: "jobs",
                column: "company_id1",
                principalTable: "companies",
                principalColumn: "id");
        }
    }
}
