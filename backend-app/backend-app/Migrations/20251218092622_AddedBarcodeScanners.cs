using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddedBarcodeScanners : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BarCodeScanners",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BarCodeBrand = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BarCodeModel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BarCodeType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BarCodeTechnology = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BarCodeAssetTag = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PurchaseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    BarCodeLocation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsAssigned = table.Column<bool>(type: "bit", nullable: false),
                    AssignedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReturnedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BarCodeScanners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BarCodeScanners_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BarCodeScanners_AssetId",
                table: "BarCodeScanners",
                column: "AssetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BarCodeScanners");
        }
    }
}
