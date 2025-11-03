using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedMobilesTableFixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssetId",
                table: "Mobiles",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Mobiles_AssetId",
                table: "Mobiles",
                column: "AssetId");

            migrationBuilder.AddForeignKey(
                name: "FK_Mobiles_Assets_AssetId",
                table: "Mobiles",
                column: "AssetId",
                principalTable: "Assets",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mobiles_Assets_AssetId",
                table: "Mobiles");

            migrationBuilder.DropIndex(
                name: "IX_Mobiles_AssetId",
                table: "Mobiles");

            migrationBuilder.DropColumn(
                name: "AssetId",
                table: "Mobiles");
        }
    }
}
