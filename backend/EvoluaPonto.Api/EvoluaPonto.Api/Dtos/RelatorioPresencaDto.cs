namespace EvoluaPonto.Api.Dtos
{
    public class RelatorioPresencaDto
    {
        public string NomeAluno { get; set; }
        public string? Documento { get; set; } // CPF ou Carteira
        public string Sala { get; set; }
        public string Bloco { get; set; }
        public DateTime? HorarioCheckin { get; set; }

        public string CheckinFormatado { get; set; }
    }
}
