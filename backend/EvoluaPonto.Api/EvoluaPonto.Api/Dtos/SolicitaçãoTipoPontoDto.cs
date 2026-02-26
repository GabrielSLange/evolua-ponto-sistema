using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class SolicitacaoTipoPontoDto // Renomeado para seguir o padrão 'Dto'
    {
        [Required(ErrorMessage = "O ID do funcionário é obrigatório.")]
        public Guid FuncionarioId { get; set; }

        [Required(ErrorMessage = "A justificativa é obrigatória para alteração do tipo de ponto.")]
        public string Justificativa { get; set; }
    }
}