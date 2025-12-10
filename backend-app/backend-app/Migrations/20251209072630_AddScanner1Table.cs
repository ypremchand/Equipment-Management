using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddScanner1Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Scanner1",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Brand = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Model = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScannerType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScanSpeed = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScanResolution = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaperSize = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorSupport = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Connectivity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DuplexScanning = table.Column<bool>(type: "bit", nullable: false),
                    PurchaseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsAssigned = table.Column<bool>(type: "bit", nullable: false),
                    AssignedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AssetId = table.Column<int>(type: "int", nullable: true)
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Scanner1");
        }
    }
}
