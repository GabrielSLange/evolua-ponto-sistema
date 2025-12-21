using EvoluaPonto.Api.Models;

namespace EvoluaPonto.Api.Dtos
{
    public class ParMarcacao
    {
        public DateTime? Entrada { get; set; }
        public DateTime? Saida { get; set; }
    }

    // Representa o resumo de um único dia de trabalho
    public class JornadaDiaria
    {
        public DateTime Dia { get; set; }
        public List<ModelRegistroPonto> Marcacoes { get; set; } = new();
        public List<string> Observacoes { get; set; } = new();

        public TimeSpan TotalTrabalhado { get; set; }
        public TimeSpan HorasExtras { get; set; }
        public TimeSpan HorasFaltas { get; set; } // Nova propriedade
        public TimeSpan SaldoDiario { get; set; } // Nova propriedade (Trabalhado - Carga)
    }

    // O objeto completo do Espelho de Ponto
    public class EspelhoPontoDto
    {
        public ModelFuncionario Funcionario { get; set; }
        public ModelEmpresa Empresa { get; set; }
        public ModelEstabelecimento Estabelecimento { get; set; }
        public DateTime PeriodoInicio { get; set; }
        public DateTime PeriodoFim { get; set; }
        public List<JornadaDiaria> Jornadas { get; set; } = new();
        public TimeSpan TotalHorasTrabalhadasMes { get; set; }
        public TimeSpan TotalHorasExtrasMes { get; set; }
        public TimeSpan TotalAtrasosMes { get; set; }
        public TimeSpan SaldoMes { get; set; }
        
    }
}
