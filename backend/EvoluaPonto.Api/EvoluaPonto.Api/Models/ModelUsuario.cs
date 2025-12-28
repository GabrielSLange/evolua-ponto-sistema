using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EvoluaPonto.Api.Models
{
    public class ModelUsuario
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Login { get; set; } // Email ou Username

        [JsonIgnore]
        [Required]
        public string SenhaHash { get; set; }

        [MaxLength(50)]
        public string Perfil { get; set; } = "normal";

        public bool AcessoPermitido { get; set; } = true;

        public Guid FuncionarioId { get; set; }

        [ForeignKey("FuncionarioId")]
        public virtual ModelFuncionario Funcionario { get; set; }
    }
}