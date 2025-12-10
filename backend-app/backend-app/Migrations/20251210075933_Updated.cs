using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class Updated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ScannerType",
                table: "AssetRequestItems",
                newName: "Scanner1Type");

            migrationBuilder.RenameColumn(
                name: "ScanSpeed",
                table: "AssetRequestItems",
                newName: "Scanner1Resolution");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Scanner1Type",
                table: "AssetRequestItems",
                newName: "ScannerType");

            migrationBuilder.RenameColumn(
                name: "Scanner1Resolution",
                table: "AssetRequestItems",
                newName: "ScanSpeed");
        }
    }
}
