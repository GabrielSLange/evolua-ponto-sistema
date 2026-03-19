using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Models
{
  public class ModelLocalProva
  {
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Campus { get; set; }
    public string Bloco { get; set; }

    public List<ModelSalaProva> Salas { get; set; }
  }
}