using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddTabletAssetRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssetId",
                table: "Tablets",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tablets_AssetId",
                table: "Tablets",
                column: "AssetId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tablets_Assets_AssetId",
                table: "Tablets",
                column: "AssetId",
                principalTable: "Assets",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tablets_Assets_AssetId",
                table: "Tablets");

            migrationBuilder.DropIndex(
                name: "IX_Tablets_AssetId",
                table: "Tablets");

            migrationBuilder.DropColumn(
                name: "AssetId",
                table: "Tablets");
        }
    }
}
