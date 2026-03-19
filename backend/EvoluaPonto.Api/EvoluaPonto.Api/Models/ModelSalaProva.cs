using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Models
{
  public class ModelSalaProva
  {
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid LocalProvaId { get; set; }

    [ForeignKey("LocalProvaId")]
    public ModelLocalProva Local { get; set; }

    public string NomeSala { get; set; }

    public List<ModelInscricaoAluno> Inscricoes { get; set; }
  }
}