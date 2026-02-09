using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class alterarNomeColunaJustificativa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "justificativa_funcionario",
                table: "registros_ponto",
                newName: "justificativa_funcionario_solicitacao");

            migrationBuilder.RenameColumn(
                name: "justificativa_admin",
                table: "registros_ponto",
                newName: "justificativa_admin_solicitacao");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "justificativa_funcionario_solicitacao",
                table: "registros_ponto",
                newName: "justificativa_funcionario");

            migrationBuilder.RenameColumn(
                name: "justificativa_admin_solicitacao",
                table: "registros_ponto",
                newName: "justificativa_admin");
        }
    }
}
