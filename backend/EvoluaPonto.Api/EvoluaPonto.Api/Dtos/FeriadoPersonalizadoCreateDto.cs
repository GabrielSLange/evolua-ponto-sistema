using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class FeriadoPersonalizadoCreateDto
    {
        [Required]
        public DateTime Data { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Descricao { get; set; }

        // Id da empresa à qual o feriado pertence. Pode ser nulo para um feriado global.
        public Guid? EmpresaId { get; set; }

        // Id do estabelecimento ao qual o feriado pertence. Pode ser nulo.
        public Guid? EstabelecimentoId { get; set; }
    }
}