namespace EvoluaPonto.Api.Dtos
{
    public class HistoricoPontoDto
    {
        public long Id { get; set; }
        public string Tipo { get; set; }
        public DateTime TimestampMarcacao { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? PrecisaoMetros { get; set; }
        public string FuncionarioNome { get; set; }
        public string FuncionarioCargo { get; set; }

        public Guid funcionarioId { get; set; }
    }
}
