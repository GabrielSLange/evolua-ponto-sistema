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

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}
