using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "empresas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    razao_social = table.Column<string>(type: "text", nullable: false),
                    cnpj = table.Column<string>(type: "text", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UsaModuloEventos = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_empresas", x => x.id);
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
                name: "estabelecimentos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome_fantasia = table.Column<string>(type: "text", nullable: false),
                    logradouro = table.Column<string>(type: "text", nullable: false),
                    numero = table.Column<string>(type: "text", nullable: true),
                    complemento = table.Column<string>(type: "text", nullable: true),
                    bairro = table.Column<string>(type: "text", nullable: false),
                    cidade = table.Column<string>(type: "text", nullable: false),
                    estado = table.Column<string>(type: "text", nullable: false),
                    cep = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    latitude = table.Column<decimal>(type: "numeric", nullable: true),
                    longitude = table.Column<decimal>(type: "numeric", nullable: true),
                    raio_km = table.Column<decimal>(type: "numeric", nullable: true),
                    empresa_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_estabelecimentos", x => x.id);
                    table.ForeignKey(
                        name: "FK_estabelecimentos_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventosProva",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeAplicacao = table.Column<string>(type: "text", nullable: false),
                    PeriodoAplicacao = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventosProva", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventosProva_empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "empresas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
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

            migrationBuilder.CreateTable(
                name: "feriados_personalizados",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    empresa_id = table.Column<Guid>(type: "uuid", nullable: true),
                    estabelecimento_id = table.Column<Guid>(type: "uuid", nullable: true),
                    data = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    descricao = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feriados_personalizados", x => x.id);
                    table.ForeignKey(
                        name: "FK_feriados_personalizados_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_feriados_personalizados_estabelecimentos_estabelecimento_id",
                        column: x => x.estabelecimento_id,
                        principalTable: "estabelecimentos",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "funcionarios",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "text", nullable: false),
                    cpf = table.Column<string>(type: "text", nullable: false),
                    cargo = table.Column<string>(type: "text", nullable: true),
                    escala_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    estabelecimento_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_funcionarios", x => x.id);
                    table.ForeignKey(
                        name: "FK_funcionarios_escalas_escala_id",
                        column: x => x.escala_id,
                        principalTable: "escalas",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_funcionarios_estabelecimentos_estabelecimento_id",
                        column: x => x.estabelecimento_id,
                        principalTable: "estabelecimentos",
                        principalColumn: "id",
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

            migrationBuilder.CreateTable(
                name: "registros_ponto",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nsr = table.Column<long>(type: "bigint", nullable: true),
                    timestamp_marcacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tipo = table.Column<string>(type: "text", nullable: false),
                    foto_url = table.Column<string>(type: "text", nullable: true),
                    geolocalizacao_ip = table.Column<string>(type: "text", nullable: true),
                    hash_sha256 = table.Column<string>(type: "text", nullable: true),
                    comprovante_url = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    funcionario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    registro_manual = table.Column<bool>(type: "boolean", nullable: false),
                    status_solicitacao = table.Column<int>(type: "integer", nullable: true),
                    justificativa_funcionario_solicitacao = table.Column<string>(type: "text", nullable: true),
                    justificativa_admin_solicitacao = table.Column<string>(type: "text", nullable: true),
                    admin_id_analise_solicitacao = table.Column<Guid>(type: "uuid", nullable: true),
                    data_analise_solicitacao = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    tipo_ponto_original = table.Column<string>(type: "text", nullable: true),
                    justificativa_funcionario_troca_tipo = table.Column<string>(type: "text", nullable: true),
                    justificativa_admin_troca_tipo = table.Column<string>(type: "text", nullable: true),
                    admin_id_troca_tipo = table.Column<Guid>(type: "uuid", nullable: true),
                    data_analise_troca_tipo = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    latitude = table.Column<decimal>(type: "numeric", nullable: true),
                    longitude = table.Column<decimal>(type: "numeric", nullable: true),
                    precisao_metros = table.Column<decimal>(type: "numeric", nullable: true),
                    latitude_estabelecimento = table.Column<decimal>(type: "numeric", nullable: true),
                    longitude_estabelecimento = table.Column<decimal>(type: "numeric", nullable: true),
                    raio_estabelecimento = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_registros_ponto", x => x.id);
                    table.ForeignKey(
                        name: "FK_registros_ponto_funcionarios_funcionario_id",
                        column: x => x.funcionario_id,
                        principalTable: "funcionarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Login = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SenhaHash = table.Column<string>(type: "text", nullable: false),
                    Perfil = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AcessoPermitido = table.Column<bool>(type: "boolean", nullable: false),
                    FuncionarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_funcionarios_FuncionarioId",
                        column: x => x.FuncionarioId,
                        principalTable: "funcionarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_escala_dias_escala_id",
                table: "escala_dias",
                column: "escala_id");

            migrationBuilder.CreateIndex(
                name: "IX_escalas_empresa_id",
                table: "escalas",
                column: "empresa_id");

            migrationBuilder.CreateIndex(
                name: "IX_estabelecimentos_empresa_id",
                table: "estabelecimentos",
                column: "empresa_id");

            migrationBuilder.CreateIndex(
                name: "IX_EventosProva_EmpresaId",
                table: "EventosProva",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_feriados_personalizados_empresa_id",
                table: "feriados_personalizados",
                column: "empresa_id");

            migrationBuilder.CreateIndex(
                name: "IX_feriados_personalizados_estabelecimento_id",
                table: "feriados_personalizados",
                column: "estabelecimento_id");

            migrationBuilder.CreateIndex(
                name: "IX_funcionarios_escala_id",
                table: "funcionarios",
                column: "escala_id");

            migrationBuilder.CreateIndex(
                name: "IX_funcionarios_estabelecimento_id",
                table: "funcionarios",
                column: "estabelecimento_id");

            migrationBuilder.CreateIndex(
                name: "IX_InscricoesAlunos_EventoProvaId",
                table: "InscricoesAlunos",
                column: "EventoProvaId");

            migrationBuilder.CreateIndex(
                name: "IX_InscricoesAlunos_SalaProvaId",
                table: "InscricoesAlunos",
                column: "SalaProvaId");

            migrationBuilder.CreateIndex(
                name: "IX_registros_ponto_funcionario_id",
                table: "registros_ponto",
                column: "funcionario_id");

            migrationBuilder.CreateIndex(
                name: "IX_SalasProva_LocalProvaId",
                table: "SalasProva",
                column: "LocalProvaId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_FuncionarioId",
                table: "Usuarios",
                column: "FuncionarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Login",
                table: "Usuarios",
                column: "Login",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "escala_dias");

            migrationBuilder.DropTable(
                name: "feriados_personalizados");

            migrationBuilder.DropTable(
                name: "InscricoesAlunos");

            migrationBuilder.DropTable(
                name: "registros_ponto");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "EventosProva");

            migrationBuilder.DropTable(
                name: "SalasProva");

            migrationBuilder.DropTable(
                name: "funcionarios");

            migrationBuilder.DropTable(
                name: "LocaisProva");

            migrationBuilder.DropTable(
                name: "escalas");

            migrationBuilder.DropTable(
                name: "estabelecimentos");

            migrationBuilder.DropTable(
                name: "empresas");
        }
    }
}
