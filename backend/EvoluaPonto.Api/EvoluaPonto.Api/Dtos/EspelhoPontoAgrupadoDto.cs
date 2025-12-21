using EvoluaPonto.Api.Models;

namespace EvoluaPonto.Api.Dtos
{
    // DTO Principal: Contém dados fixos e a lista de meses
    public class EspelhoPontoAgrupadoDto
    {
        public ModelFuncionario Funcionario { get; set; }
        public ModelEstabelecimento Estabelecimento { get; set; }
        public ModelEmpresa Empresa { get; set; }
        public List<EspelhoPontoMensalDto> Meses { get; set; } = new();
    }

    // DTO Mensal: Contém apenas o que varia mês a mês
    public class EspelhoPontoMensalDto
    {
        public int Mes { get; set; }
        public int Ano { get; set; }
        public DateTime PeriodoInicio { get; set; }
        public DateTime PeriodoFim { get; set; }
        public List<JornadaDiaria> Jornadas { get; set; } = new();

        // Totais específicos deste mês
        public TimeSpan TotalHorasTrabalhadas { get; set; }
        public TimeSpan TotalHorasExtras { get; set; }
        public TimeSpan TotalAtrasos { get; set; }
        public TimeSpan Saldo { get; set; }
    }

    // Filtro para o download em lote
    public class FiltroDownloadLoteDto
    {
        public List<Guid> FuncionariosIds { get; set; }
        public int Ano { get; set; }
        public int MesInicio { get; set; }
        public int MesFim { get; set; }
    }
}