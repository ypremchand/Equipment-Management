using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddMobilesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WarrantyExpiry",
                table: "Mobiles");

            migrationBuilder.RenameColumn(
                name: "SerialNumber",
                table: "Mobiles",
                newName: "SIMType");

            migrationBuilder.RenameColumn(
                name: "OperatingSystem",
                table: "Mobiles",
                newName: "NetworkType");

            migrationBuilder.RenameColumn(
                name: "GraphicsCard",
                table: "Mobiles",
                newName: "Model");

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastServicedDate",
                table: "Mobiles",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<string>(
                name: "IMEINumber",
                table: "Mobiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IMEINumber",
                table: "Mobiles");

            migrationBuilder.RenameColumn(
                name: "SIMType",
                table: "Mobiles",
                newName: "SerialNumber");

            migrationBuilder.RenameColumn(
                name: "NetworkType",
                table: "Mobiles",
                newName: "OperatingSystem");

            migrationBuilder.RenameColumn(
                name: "Model",
                table: "Mobiles",
                newName: "GraphicsCard");

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastServicedDate",
                table: "Mobiles",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "WarrantyExpiry",
                table: "Mobiles",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
