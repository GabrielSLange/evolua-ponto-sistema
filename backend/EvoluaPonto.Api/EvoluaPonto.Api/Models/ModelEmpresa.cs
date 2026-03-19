using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Models
{
    [Table("empresas")]
    public class ModelEmpresa
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("razao_social")]
        public string RazaoSocial { get; set; }

        [Required]
        [Column("cnpj")]
        public string Cnpj { get; set; }

        [Column("ativo")]
        public bool Ativo { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        public bool UsaModuloEventos { get; set; } = false; // Por padrão, as empresas não usam

        // Relação 1 para N (Uma empresa pode ter várias provas)
        public List<ModelEventoProva> Eventos { get; set; } = new List<ModelEventoProva>();
    }
}
