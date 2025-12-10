using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddScannerFieldsToAssetRequestItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ColorSupport",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Connectivity",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScanResolution",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScannerPaperSize",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ColorSupport",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "Connectivity",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "ScanResolution",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "ScannerPaperSize",
                table: "AssetRequestItems");
        }
    }
}
