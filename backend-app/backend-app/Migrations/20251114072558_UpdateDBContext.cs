using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDBContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssignedAssets_Laptops_LaptopId",
                table: "AssignedAssets");

            migrationBuilder.DropIndex(
                name: "IX_AssignedAssets_LaptopId",
                table: "AssignedAssets");

            migrationBuilder.DropColumn(
                name: "ReturnedDate",
                table: "AssignedAssets");

            migrationBuilder.RenameColumn(
                name: "LaptopId",
                table: "AssignedAssets",
                newName: "AssetItemId");

            migrationBuilder.AddColumn<string>(
                name: "AssetType",
                table: "AssignedAssets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssetType",
                table: "AssignedAssets");

            migrationBuilder.RenameColumn(
                name: "AssetItemId",
                table: "AssignedAssets",
                newName: "LaptopId");

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnedDate",
                table: "AssignedAssets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssignedAssets_LaptopId",
                table: "AssignedAssets",
                column: "LaptopId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssignedAssets_Laptops_LaptopId",
                table: "AssignedAssets",
                column: "LaptopId",
                principalTable: "Laptops",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
