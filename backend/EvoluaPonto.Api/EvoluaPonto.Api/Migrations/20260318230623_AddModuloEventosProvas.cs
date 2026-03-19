using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddModuloEventosProvas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventosProva",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeAplicacao = table.Column<string>(type: "text", nullable: false),
                    PeriodoAplicacao = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventosProva", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LocaisProva",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Campus = table.Column<string>(type: "text", nullable: false),
                    Bloco = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocaisProva", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SalasProva",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LocalProvaId = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeSala = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalasProva", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SalasProva_LocaisProva_LocalProvaId",
                        column: x => x.LocalProvaId,
                        principalTable: "LocaisProva",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InscricoesAlunos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventoProvaId = table.Column<Guid>(type: "uuid", nullable: false),
                    SalaProvaId = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeAluno = table.Column<string>(type: "text", nullable: false),
                    NumeroCarteira = table.Column<string>(type: "text", nullable: false),
                    Curso = table.Column<string>(type: "text", nullable: false),
                    Modalidade = table.Column<string>(type: "text", nullable: false),
                    Presente = table.Column<bool>(type: "boolean", nullable: false),
                    DataHoraCheckin = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InscricoesAlunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InscricoesAlunos_EventosProva_EventoProvaId",
                        column: x => x.EventoProvaId,
                        principalTable: "EventosProva",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InscricoesAlunos_SalasProva_SalaProvaId",
                        column: x => x.SalaProvaId,
                        principalTable: "SalasProva",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InscricoesAlunos_EventoProvaId",
                table: "InscricoesAlunos",
                column: "EventoProvaId");

            migrationBuilder.CreateIndex(
                name: "IX_InscricoesAlunos_SalaProvaId",
                table: "InscricoesAlunos",
                column: "SalaProvaId");

            migrationBuilder.CreateIndex(
                name: "IX_SalasProva_LocalProvaId",
                table: "SalasProva",
                column: "LocalProvaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InscricoesAlunos");

            migrationBuilder.DropTable(
                name: "EventosProva");

            migrationBuilder.DropTable(
                name: "SalasProva");

            migrationBuilder.DropTable(
                name: "LocaisProva");
        }
    }
}
