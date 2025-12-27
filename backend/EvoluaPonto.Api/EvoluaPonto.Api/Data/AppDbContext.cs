using EvoluaPonto.Api.Models;
using Microsoft.EntityFrameworkCore;

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
        public DbSet<Usuario> Usuarios { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Garante que o Login seja único
            builder.Entity<Usuario>()
                .HasIndex(tb => tb.Login)
                .IsUnique();

            // (Opcional) Garante que um funcionário só tenha UM usuário
            builder.Entity<Usuario>()
                .HasIndex(tb => tb.FuncionarioId)
                .IsUnique();
        }
    }
}