using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedLaptopsTableFixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1️⃣ Add nullable AssetId column (no default value)
            migrationBuilder.AddColumn<int>(
                name: "AssetId",
                table: "Laptops",
                type: "int",
                nullable: true);

            // 2️⃣ Create index on AssetId for better performance
            migrationBuilder.CreateIndex(
                name: "IX_Laptops_AssetId",
                table: "Laptops",
                column: "AssetId");

            // 3️⃣ Add the foreign key relationship to Assets.Id
            migrationBuilder.AddForeignKey(
                name: "FK_Laptops_Assets_AssetId",
                table: "Laptops",
                column: "AssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverse everything if migration is rolled back
            migrationBuilder.DropForeignKey(
                name: "FK_Laptops_Assets_AssetId",
                table: "Laptops");

            migrationBuilder.DropIndex(
                name: "IX_Laptops_AssetId",
                table: "Laptops");

            migrationBuilder.DropColumn(
                name: "AssetId",
                table: "Laptops");
        }
    }
}
