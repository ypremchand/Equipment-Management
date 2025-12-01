using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedAssetsRequestItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Brand",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Dpi",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NetworkType",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperatingSystem",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaperSize",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrinterType",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Processor",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ram",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScanSpeed",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScannerType",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SimSupport",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SimType",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Storage",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Brand",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "Dpi",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "NetworkType",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "OperatingSystem",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "PaperSize",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "PrinterType",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "Processor",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "Ram",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "ScanSpeed",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "ScannerType",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "SimSupport",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "SimType",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "Storage",
                table: "AssetRequestItems");
        }
    }
}
