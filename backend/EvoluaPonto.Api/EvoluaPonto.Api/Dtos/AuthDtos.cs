using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class LoginDto
    {
        [Required]
        public string Login { get; set; }
        [Required]
        public string Senha { get; set; }
    }

    public class RegistrarUsuarioDto
    {
        [Required]
        public Guid FuncionarioId { get; set; }
        [Required]
        public string Login { get; set; }
        [Required]
        public string Senha { get; set; }
        public string Perfil { get; set; } = "normal";
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public string Nome { get; set; }
        public string Perfil { get; set; }
        public Guid UsuarioId { get; set; }
    }

    public class ChangeEmailDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        [EmailAddress]
        public string NewEmail { get; set; }

        [Required]
        public string Password { get; set; }
    }
}