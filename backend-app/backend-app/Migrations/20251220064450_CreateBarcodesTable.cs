using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class CreateBarcodesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Barcode_Assets_AssetId",
                table: "Barcode");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Barcode",
                table: "Barcode");

            migrationBuilder.RenameTable(
                name: "Barcode",
                newName: "Barcodes");

            migrationBuilder.RenameIndex(
                name: "IX_Barcode_AssetId",
                table: "Barcodes",
                newName: "IX_Barcodes_AssetId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Barcodes",
                table: "Barcodes",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Barcodes_Assets_AssetId",
                table: "Barcodes",
                column: "AssetId",
                principalTable: "Assets",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Barcodes_Assets_AssetId",
                table: "Barcodes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Barcodes",
                table: "Barcodes");

            migrationBuilder.RenameTable(
                name: "Barcodes",
                newName: "Barcode");

            migrationBuilder.RenameIndex(
                name: "IX_Barcodes_AssetId",
                table: "Barcode",
                newName: "IX_Barcode_AssetId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Barcode",
                table: "Barcode",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Barcode_Assets_AssetId",
                table: "Barcode",
                column: "AssetId",
                principalTable: "Assets",
                principalColumn: "Id");
        }
    }
}
