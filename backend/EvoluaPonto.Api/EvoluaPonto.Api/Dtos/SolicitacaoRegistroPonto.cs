using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class SolicitacaoRegistroDto // Renomeado para seguir o padrão 'Dto'
    {
        [Required(ErrorMessage = "O tipo de registro é obrigatório (Entrada/Saída).")]
        public string Tipo { get; set; }

        [Required(ErrorMessage = "O ID do funcionário é obrigatório.")]
        public Guid FuncionarioId { get; set; }

        [Required(ErrorMessage = "O horário do ponto é obrigatório.")]
        public DateTime Horario { get; set; }

        [Required(ErrorMessage = "A justificativa é obrigatória para solicitações manuais.")]
        public string Justificativa { get; set; }

        // Campos opcionais
        public string? FotoUrl { get; set; }
    }
}