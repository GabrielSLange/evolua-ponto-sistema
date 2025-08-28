using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Models
{
    [Table("feriados_personalizados")]
    public class ModelFeriadoPersonalizado
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("empresa_id")]
        public Guid? EmpresaId { get; set; }

        [Column("estabelecimento_id")]
        public Guid? EstabelecimentoId { get; set; }

        [Required]
        [Column("data")]
        public DateTime Data { get; set; }

        [Required]
        [Column("descricao")]
        public string Descricao { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        // Propriedades de navegação (opcionais, mas boas práticas)
        public ModelEmpresa? Empresa { get; set; }
        public ModelEstabelecimento? Estabelecimento { get; set; }
    }
}