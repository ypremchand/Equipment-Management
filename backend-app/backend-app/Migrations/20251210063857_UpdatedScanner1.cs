using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedScanner1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Scanner1");

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
                name: "ScanSpeed",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "ScannerPaperSize",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "ScannerType",
                table: "AssetRequestItems");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
                name: "ScanSpeed",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScannerPaperSize",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScannerType",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Scanner1",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssetId = table.Column<int>(type: "int", nullable: true),
                    AssetTag = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AssignedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Brand = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorSupport = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Connectivity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsAssigned = table.Column<bool>(type: "bit", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Model = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaperSize = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PurchaseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ScanResolution = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScanSpeed = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScannerType = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scanner1", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Scanner1_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Scanner1_AssetId",
                table: "Scanner1",
                column: "AssetId");
        }
    }
}
