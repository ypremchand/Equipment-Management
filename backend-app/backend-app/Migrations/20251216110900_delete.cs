using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class delete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.DropTable(
            //    name: "AssetAssignmentHistories");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.CreateTable(
            //    name: "AssetAssignmentHistories",
            //    columns: table => new
            //    {
            //        Id = table.Column<int>(type: "int", nullable: false)
            //            .Annotation("SqlServer:Identity", "1, 1"),
            //        AssetId = table.Column<int>(type: "int", nullable: true),
            //        AssetItemId = table.Column<int>(type: "int", nullable: false),
            //        AssetType = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        AssignedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        AssignedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
            //        AssignedTo = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        Location = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
            //        Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        ReturnedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
            //    },
            //    constraints: table =>
            //    {
            //        table.PrimaryKey("PK_AssetAssignmentHistories", x => x.Id);
            //    });
        }
    }
}
