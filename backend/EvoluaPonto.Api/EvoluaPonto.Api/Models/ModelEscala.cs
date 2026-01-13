using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EvoluaPonto.Api.Models
{
    [Table("escalas")]
    public class ModelEscala
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("nome")]
        public string Nome { get; set; } = string.Empty; // Ex: "Comercial", "12x36 Dia"

        [Column("carga_horaria_semanal")]
        public int CargaHorariaSemanal { get; set; } // Ex: 44, 40, 30

        [Column("empresa_id")]
        public Guid EmpresaId { get; set; }

        [Column("ativo")]
        public bool Ativo { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relacionamentos
        [JsonIgnore] // Evita ciclo infinito no JSON
        public ModelEmpresa? Empresa { get; set; }

        public List<ModelEscalaDia> Dias { get; set; } = new();
    }
}