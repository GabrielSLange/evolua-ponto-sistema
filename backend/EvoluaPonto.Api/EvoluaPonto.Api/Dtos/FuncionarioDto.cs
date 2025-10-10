using System.ComponentModel.DataAnnotations;

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

        [Required] 
        public string Password { get; set; }

        public string? Cargo { get; set; }

        [Required] 
        public Guid EstabelecimentoId { get; set; }

        [Required]
        public string Role { get; set; } // "admin" ou "normal"
    }
}
