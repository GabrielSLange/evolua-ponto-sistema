using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Models
{
  public class ModelInscricaoAluno
  {
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EventoProvaId { get; set; }

    [ForeignKey("EventoProvaId")]
    public ModelEventoProva Evento { get; set; }

    public Guid SalaProvaId { get; set; }

    [ForeignKey("SalaProvaId")]
    public ModelSalaProva Sala { get; set; }

    public string NomeAluno { get; set; }
    public string NumeroCarteira { get; set; }
    public string Curso { get; set; }
    public string Modalidade { get; set; }

    public bool Presente { get; set; } = false;
    public DateTime? DataHoraCheckin { get; set; }
  }
}