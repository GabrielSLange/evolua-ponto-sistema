using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Models
{
    [Table("estabelecimentos")]
    public class ModelEstabelecimento
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("nome_fantasia")]
        public string NomeFantasia{ get; set; }

        [Required]
        [Column("logradouro")]
        public string Logradouro { get; set; }

        [Column("numero")]
        public string? Numero { get; set; }

        [Column("complemento")]
        public string? Complemento { get; set; }

        [Required]
        [Column("bairro")]
        public string Bairro { get; set; }

        [Required]
        [Column("cidade")]
        public string Cidade { get; set; }

        [Required]
        [Column("estado")]
        public string Estado { get; set; }

        [Column("cep")]
        public string? Cep { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        // Relação com a Empresa
        [Required]
        [Column("empresa_id")]
        public Guid EmpresaId { get; set; }

        public ModelEmpresa? Empresa { get; set; }
    }
}
