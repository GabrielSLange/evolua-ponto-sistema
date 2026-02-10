using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Dtos
{
    public class HistoricoPontoDto
    {
        public long Id { get; set; }
        public string Tipo { get; set; }
        public DateTime TimestampMarcacao { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public decimal? PrecisaoMetros { get; set; }
        public string FuncionarioNome { get; set; }
        public string FuncionarioCargo { get; set; }

        public decimal? LatitudeEstabelecimento { get; set; }
        public decimal? LongitudeEstabelecimento { get; set; }
        public decimal? RaioEstabelecimento { get; set; }

        public Guid funcionarioId { get; set; }
    }
}
