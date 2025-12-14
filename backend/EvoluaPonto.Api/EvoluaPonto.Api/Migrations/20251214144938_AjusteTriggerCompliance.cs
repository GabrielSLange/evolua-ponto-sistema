using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EvoluaPonto.Api.Migrations
{
    /// <inheritdoc />
    public partial class AjusteTriggerCompliance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION impedir_alteracao_registro_ponto()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- EXCEÇÃO: Permitir atualização ou exclusão se o registro NÃO tiver NSR (ou seja, é uma solicitação pendente)
                    -- E se for um registro marcado como manual.
                    IF OLD.nsr IS NULL AND OLD.registro_manual = true THEN
                        RETURN NEW;
                    END IF;

                    -- Caso contrário, mantém o bloqueio estrito da lei (Portaria 671)
                    RAISE EXCEPTION 'Alterações ou exclusões na tabela registros_ponto são proibidas por lei (Portaria 671 MTP).';
                END;
                $$ LANGUAGE plpgsql;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION impedir_alteracao_registro_ponto()
                RETURNS TRIGGER AS $$
                BEGIN
                    RAISE EXCEPTION 'Alterações ou exclusões na tabela registros_ponto são proibidas por lei (Portaria 671 MTP).';
                END;
                $$ LANGUAGE plpgsql;
            ");
        }
    }
}
