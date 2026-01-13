using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdcTabelasEscala : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "Usuarios",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_analise",
                table: "registros_ponto",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "registros_ponto",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "funcionarios",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "escala_id",
                table: "funcionarios",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "data",
                table: "feriados_personalizados",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "feriados_personalizados",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "estabelecimentos",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "empresas",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.CreateTable(
                name: "escalas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "text", nullable: false),
                    carga_horaria_semanal = table.Column<int>(type: "integer", nullable: false),
                    empresa_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_escalas", x => x.id);
                    table.ForeignKey(
                        name: "FK_escalas_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "escala_dias",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    escala_id = table.Column<Guid>(type: "uuid", nullable: false),
                    dia_semana = table.Column<int>(type: "integer", nullable: false),
                    is_folga = table.Column<bool>(type: "boolean", nullable: false),
                    entrada = table.Column<TimeSpan>(type: "interval", nullable: true),
                    saida_intervalo = table.Column<TimeSpan>(type: "interval", nullable: true),
                    volta_intervalo = table.Column<TimeSpan>(type: "interval", nullable: true),
                    saida = table.Column<TimeSpan>(type: "interval", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_escala_dias", x => x.id);
                    table.ForeignKey(
                        name: "FK_escala_dias_escalas_escala_id",
                        column: x => x.escala_id,
                        principalTable: "escalas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_funcionarios_escala_id",
                table: "funcionarios",
                column: "escala_id");

            migrationBuilder.CreateIndex(
                name: "IX_escala_dias_escala_id",
                table: "escala_dias",
                column: "escala_id");

            migrationBuilder.CreateIndex(
                name: "IX_escalas_empresa_id",
                table: "escalas",
                column: "empresa_id");

            migrationBuilder.AddForeignKey(
                name: "FK_funcionarios_escalas_escala_id",
                table: "funcionarios",
                column: "escala_id",
                principalTable: "escalas",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_funcionarios_escalas_escala_id",
                table: "funcionarios");

            migrationBuilder.DropTable(
                name: "escala_dias");

            migrationBuilder.DropTable(
                name: "escalas");

            migrationBuilder.DropIndex(
                name: "IX_funcionarios_escala_id",
                table: "funcionarios");

            migrationBuilder.DropColumn(
                name: "escala_id",
                table: "funcionarios");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "data_analise",
                table: "registros_ponto",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "registros_ponto",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "funcionarios",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "data",
                table: "feriados_personalizados",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "feriados_personalizados",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "estabelecimentos",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "empresas",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");
        }
    }
}
