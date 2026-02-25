using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class AlterarTipoPontoDto
    {
        [Required]
        public string NovoTipo { get; set; }

        [Required]
        public Guid AdminId { get; set; } // Quem está fazendo a alteração

        [Required(ErrorMessage = "A justificativa é obrigatória para alterações legais.")]
        public string JustificativaAdmin { get; set; }

        public string? JustificativaFuncionario { get; set; } // Opcional, mas pode ser preenchida pelo funcionário para registro
    }
}
