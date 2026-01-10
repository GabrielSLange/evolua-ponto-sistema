using EvoluaPonto.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace EvoluaPonto.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Tabelas do Banco de Dados
        public DbSet<ModelEmpresa> Empresas { get; set; }
        public DbSet<ModelFuncionario> Funcionarios { get; set; }
        public DbSet<ModelRegistroPonto> RegistrosPonto { get; set; }
        public DbSet<ModelEstabelecimento> Estabelecimentos { get; set; }
        public DbSet<ModelFeriadoPersonalizado> FeriadosPersonalizados { get; set; }
        public DbSet<ModelUsuario> Usuarios { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // --- A LÓGICA DE OURO DO UTC (BLINDADA) ---
            var utcConverter = new ValueConverter<DateTime, DateTime>(
                // IDA (Gravar no Banco): 
                // Garante que tudo vira UTC antes de entrar.
                v => v.ToUniversalTime(),

                // VOLTA (Ler do Banco): 
                // A Lógica: Se o driver do banco (Npgsql) entregar "Local" (Windows),
                // o .ToUniversalTime() converte de volta para o UTC Real.
                // Se entregar "Utc" (Linux/Docker), ele mantém.
                v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime()
            );

            var nullableUtcConverter = new ValueConverter<DateTime?, DateTime?>(
                v => v.HasValue ? v.Value.ToUniversalTime() : v,
                v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v : v.Value.ToUniversalTime()) : v
            );

            // Aplica os conversores em TODAS as colunas de data de TODAS as tabelas
            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetValueConverter(utcConverter);
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(nullableUtcConverter);
                    }
                }
            }
            // -------------------------------------------

            // Configurações de Índices e Chaves Únicas
            builder.Entity<ModelUsuario>()
                .HasIndex(tb => tb.Login)
                .IsUnique();

            builder.Entity<ModelUsuario>()
                .HasIndex(tb => tb.FuncionarioId)
                .IsUnique();
        }
    }
}