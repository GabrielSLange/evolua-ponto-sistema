using EvoluaPonto.Api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Dtos
{
    public class FuncionarioDto
    {
        public Guid? Id { get; set; } // Opcional, se quiser definir um ID específico

        [Required] 
        public string Nome { get; set; }

        [Required] 
        public string Cpf { get; set; }

        [Required]
        [EmailAddress] 
        public string Email { get; set; }

        public string? Password { get; set; }

        [Required]
        public string Role { get; set; } // "admin" ou "normal"

        [Required]
        public string Cargo { get; set; }

        [Required]
        public string HorarioContratual { get; set; }

        public bool Ativo { get; set; }

        [Required] 
        public Guid EstabelecimentoId { get; set; }

        public ModelEstabelecimento? Estabelecimento { get; set; }
    }
}
