using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    // O que o Frontend envia para Criar/Editar a Escala
    public class EscalaCreateDto
    {
        [Required]
        public string Nome { get; set; } = string.Empty;

        public int CargaHorariaSemanal { get; set; }

        public Guid EmpresaId { get; set; }

        public List<EscalaDiaDto> Dias { get; set; } = new();
    }

    // Detalhe de cada dia dentro da escala
    public class EscalaDiaDto
    {
        // 0 = Dom, 1 = Seg, ... 6 = Sab
        public int DiaSemana { get; set; }

        public bool IsFolga { get; set; }

        // TimeSpan aceita strings como "08:00:00" no JSON
        public TimeSpan? Entrada { get; set; }
        public TimeSpan? SaidaIntervalo { get; set; }
        public TimeSpan? VoltaIntervalo { get; set; }
        public TimeSpan? Saida { get; set; }
    }
}