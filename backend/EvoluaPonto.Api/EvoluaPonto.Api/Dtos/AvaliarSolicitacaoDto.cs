using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class AvaliarSolicitacaoDto
    {
        [Required]
        public bool Aprovado { get; set; } // true para aprovado, false para rejeitado

        public string? JustificativaAdmin { get; set; } // Justificativa opcional caso aprovado, obrigatória se rejeitado
    }
}
