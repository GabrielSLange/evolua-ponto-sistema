using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedAtToUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: DateTime.UtcNow);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "created_at",
                table: "Usuarios");
        }
    }
}
