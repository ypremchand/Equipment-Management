using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAssetHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReturnedBy",
                table: "AssetAssignmentHistories");

            migrationBuilder.AddColumn<string>(
                name: "AssignedBy",
                table: "AssetAssignmentHistories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedBy",
                table: "AssetAssignmentHistories");

            migrationBuilder.AddColumn<string>(
                name: "ReturnedBy",
                table: "AssetAssignmentHistories",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
