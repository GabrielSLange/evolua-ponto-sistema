using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class addLocalizacaoEstabelecimento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Longitude",
                table: "registros_ponto",
                newName: "longitude");

            migrationBuilder.RenameColumn(
                name: "Latitude",
                table: "registros_ponto",
                newName: "latitude");

            migrationBuilder.RenameColumn(
                name: "PrecisaoMetros",
                table: "registros_ponto",
                newName: "precisao_metros");

            migrationBuilder.AddColumn<double>(
                name: "latitude_estabelecimento",
                table: "registros_ponto",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "longitude_estabelecimento",
                table: "registros_ponto",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "raio_estabelecimento",
                table: "registros_ponto",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "latitude_estabelecimento",
                table: "registros_ponto");

            migrationBuilder.DropColumn(
                name: "longitude_estabelecimento",
                table: "registros_ponto");

            migrationBuilder.DropColumn(
                name: "raio_estabelecimento",
                table: "registros_ponto");

            migrationBuilder.RenameColumn(
                name: "longitude",
                table: "registros_ponto",
                newName: "Longitude");

            migrationBuilder.RenameColumn(
                name: "latitude",
                table: "registros_ponto",
                newName: "Latitude");

            migrationBuilder.RenameColumn(
                name: "precisao_metros",
                table: "registros_ponto",
                newName: "PrecisaoMetros");
        }
    }
}
