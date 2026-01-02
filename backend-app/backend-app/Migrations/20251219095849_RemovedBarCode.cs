using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class RemovedBarCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BarCodeScanners");

            migrationBuilder.DropColumn(
                name: "BarCodeTechnology",
                table: "AssetRequestItems");

            migrationBuilder.DropColumn(
                name: "BarCodeType",
                table: "AssetRequestItems");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BarCodeTechnology",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BarCodeType",
                table: "AssetRequestItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BarCodeScanners",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssetId = table.Column<int>(type: "int", nullable: true),
                    AssignedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BarCodeAssetTag = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BarCodeBrand = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BarCodeLocation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BarCodeModel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BarCodeTechnology = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BarCodeType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsAssigned = table.Column<bool>(type: "bit", nullable: false),
                    PurchaseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true)
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
    }
}
