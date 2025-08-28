using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace EvoluaPonto.Api.Models
{
    // Esta classe não será uma tabela, mas um "Owned Entity Type" ou simplesmente um objeto complexo.
    [ComplexType]
    public class JornadaDeTrabalho
    {
        public TimeSpan CargaHorariaDiaria { get; set; } = TimeSpan.FromHours(8);
        public TimeSpan CargaHorariaSemanal { get; set; } = TimeSpan.FromHours(44);

        // Exemplo: "08:00", "12:00", "14:00", "18:00"
        public List<string> HorariosPrevistos { get; set; } = new();

        public List<DayOfWeek> DiasDeFolga { get; set; } = new() { DayOfWeek.Saturday, DayOfWeek.Sunday };

        public TimeSpan ToleranciaMinutos { get; set; } = TimeSpan.FromMinutes(10);
    }
}