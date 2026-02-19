using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditoriaPonto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "data_analise",
                table: "registros_ponto",
                newName: "data_analise_troca_tipo");

            migrationBuilder.RenameColumn(
                name: "admin_id_analise",
                table: "registros_ponto",
                newName: "admin_id_troca_tipo");

            migrationBuilder.AddColumn<Guid>(
                name: "admin_id_analise_solicitacao",
                table: "registros_ponto",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "data_analise_solicitacao",
                table: "registros_ponto",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "justificativa_admin_troca_tipo",
                table: "registros_ponto",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "justificativa_funcionario_troca_tipo",
                table: "registros_ponto",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo_ponto_original",
                table: "registros_ponto",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "admin_id_analise_solicitacao",
                table: "registros_ponto");

            migrationBuilder.DropColumn(
                name: "data_analise_solicitacao",
                table: "registros_ponto");

            migrationBuilder.DropColumn(
                name: "justificativa_admin_troca_tipo",
                table: "registros_ponto");

            migrationBuilder.DropColumn(
                name: "justificativa_funcionario_troca_tipo",
                table: "registros_ponto");

            migrationBuilder.DropColumn(
                name: "tipo_ponto_original",
                table: "registros_ponto");

            migrationBuilder.RenameColumn(
                name: "data_analise_troca_tipo",
                table: "registros_ponto",
                newName: "data_analise");

            migrationBuilder.RenameColumn(
                name: "admin_id_troca_tipo",
                table: "registros_ponto",
                newName: "admin_id_analise");
        }
    }
}
