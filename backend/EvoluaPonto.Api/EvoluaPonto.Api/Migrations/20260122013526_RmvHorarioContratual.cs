using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class RmvHorarioContratual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "horario_contratual",
                table: "funcionarios");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "horario_contratual",
                table: "funcionarios",
                type: "text",
                nullable: true);
        }
    }
}
