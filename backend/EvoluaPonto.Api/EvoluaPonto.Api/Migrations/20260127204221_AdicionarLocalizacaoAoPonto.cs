using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarLocalizacaoAoPonto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "registros_ponto",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "registros_ponto",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PrecisaoMetros",
                table: "registros_ponto",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "registros_ponto");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "registros_ponto");

            migrationBuilder.DropColumn(
                name: "PrecisaoMetros",
                table: "registros_ponto");
        }
    }
}
