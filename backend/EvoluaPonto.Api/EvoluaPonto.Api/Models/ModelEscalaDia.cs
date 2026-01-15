using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EvoluaPonto.Api.Models
{
    [Table("escala_dias")]
    public class ModelEscalaDia
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("escala_id")]
        public Guid EscalaId { get; set; }

        // 0 = Domingo, 1 = Segunda... 6 = Sábado
        [Column("dia_semana")]
        public DayOfWeek DiaSemana { get; set; }

        [Column("is_folga")]
        public bool IsFolga { get; set; }

        // Usamos TimeSpan? porque em dias de folga os horários serão nulos
        // No PostgreSQL será mapeado para 'interval' ou 'time' dependendo da config

        [Column("entrada")]
        public TimeSpan? Entrada { get; set; }

        [Column("saida_intervalo")]
        public TimeSpan? SaidaIntervalo { get; set; }

        [Column("volta_intervalo")]
        public TimeSpan? VoltaIntervalo { get; set; }

        [Column("saida")]
        public TimeSpan? Saida { get; set; }

        // Relacionamento
        [JsonIgnore]
        public ModelEscala? Escala { get; set; }
    }
}