using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class AlterarTipoPontoDto
    {
        [Required]
        public bool Aprovado { get; set; } // true para aprovado, false para rejeitado

        [Required]
        public Guid AdminId { get; set; } // Quem está fazendo a alteração

        public string? JustificativaAdmin { get; set; }
    }
}
