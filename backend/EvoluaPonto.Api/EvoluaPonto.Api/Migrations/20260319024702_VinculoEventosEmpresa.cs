using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class VinculoEventosEmpresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EmpresaId",
                table: "EventosProva",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<bool>(
                name: "UsaModuloEventos",
                table: "empresas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_EventosProva_EmpresaId",
                table: "EventosProva",
                column: "EmpresaId");

            migrationBuilder.AddForeignKey(
                name: "FK_EventosProva_empresas_EmpresaId",
                table: "EventosProva",
                column: "EmpresaId",
                principalTable: "empresas",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EventosProva_empresas_EmpresaId",
                table: "EventosProva");

            migrationBuilder.DropIndex(
                name: "IX_EventosProva_EmpresaId",
                table: "EventosProva");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "EventosProva");

            migrationBuilder.DropColumn(
                name: "UsaModuloEventos",
                table: "empresas");
        }
    }
}
