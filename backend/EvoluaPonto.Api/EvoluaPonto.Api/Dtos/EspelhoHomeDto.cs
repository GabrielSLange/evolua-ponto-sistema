using System;
using System.Collections.Generic;

namespace EvoluaPonto.Api.Dtos
{
    public class EspelhoHomeResponseDto
    {
        public string MesReferencia { get; set; } // Ex: "Outubro/2023"
        public string SaldoPrevisto { get; set; } // Ex: "00:00" (Placeholder para futuro cálculo de banco de horas)
        public List<DiaEspelhoHomeDto> Dias { get; set; } = new();
    }

    public class DiaEspelhoHomeDto
    {
        public DateTime Data { get; set; }
        public string DiaSemana { get; set; } // "Seg", "Ter", etc.
        public bool IsFimDeSemana { get; set; }
        public bool IsFeriado { get; set; }
        public bool IsHoje { get; set; }
        public string Status { get; set; } // "Completo", "Incompleto", "Falta", "Folga", "Feriado"
        public List<PontoHomeDto> Marcacoes { get; set; } = new();
    }

    public class PontoHomeDto
    {
        public long Id { get; set; }
        public string Hora { get; set; } // "08:00"
        public string Tipo { get; set; } // "ENTRADA", "SAIDA"
        public bool IsManual { get; set; }
        public string StatusSolicitacao { get; set; } // "Aprovado", "Pendente", "Rejeitado"
    }
}