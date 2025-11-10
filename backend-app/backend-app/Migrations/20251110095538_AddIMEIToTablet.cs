using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddIMEIToTablet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedTo",
                table: "Tablets");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Tablets");

            migrationBuilder.AlterColumn<string>(
                name: "Remarks",
                table: "Tablets",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "IMEINumber",
                table: "Tablets",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IMEINumber",
                table: "Tablets");

            migrationBuilder.AlterColumn<string>(
                name: "Remarks",
                table: "Tablets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignedTo",
                table: "Tablets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Tablets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
