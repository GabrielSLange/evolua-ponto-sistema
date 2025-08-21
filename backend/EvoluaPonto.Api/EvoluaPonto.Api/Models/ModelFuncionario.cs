using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Models
{
    [Table("funcionarios")]
    public class ModelFuncionario
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("nome")]
        public string Nome { get; set; }

        [Required]
        [Column("cpf")]
        public string Cpf { get; set; }

        [Column("cargo")]
        public string? Cargo { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        //Relação com a tabela de empresas

        [Required]
        [Column("estabelecimento_id")]
        public Guid EstabelecimentoId { get; set; }

        public ModelEstabelecimento? Estabelecimento { get; set; }
    }
}
