using EvoluaPonto.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Reflection.Emit;

namespace EvoluaPonto.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        

        // Estas propriedades representam as tabelas no nosso banco de dados.
        // O Entity Framework Core vai usá-las para fazer as operações de CRUD.
        public DbSet<ModelEmpresa> Empresas { get; set; }
        public DbSet<ModelFuncionario> Funcionarios { get; set; }
        public DbSet<ModelRegistroPonto> RegistrosPonto { get; set; }
        public DbSet<ModelEstabelecimento> Estabelecimentos { get; set; }
        public DbSet<ModelFeriadoPersonalizado> FeriadosPersonalizados { get; set; }
        public DbSet<ModelUsuario> Usuarios { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            var utcConverter = new ValueConverter<DateTime, DateTime>(
                // GRAVAÇÃO (Ida): Garante que vai como UTC
                v => v.ToUniversalTime(),

                // LEITURA (Volta): O Npgsql entrega Local, nós convertemos de volta pra UTC
                v => v.ToUniversalTime()
            );

            var nullableUtcConverter = new ValueConverter<DateTime?, DateTime?>(
                v => v.HasValue ? v.Value.ToUniversalTime() : v,
                v => v.HasValue ? v.Value.ToUniversalTime() : v
            );

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

            // Garante que o Login seja único
            builder.Entity<ModelUsuario>()
                .HasIndex(tb => tb.Login)
                .IsUnique();

            // (Opcional) Garante que um funcionário só tenha UM usuário
            builder.Entity<ModelUsuario>()
                .HasIndex(tb => tb.FuncionarioId)
                .IsUnique();
        }
    }
}