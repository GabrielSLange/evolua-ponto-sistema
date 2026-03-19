using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Models
{
  public class ModelEventoProva
  {
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EmpresaId { get; set; }

    [ForeignKey("EmpresaId")]
    public ModelEmpresa Empresa { get; set; }

    public string NomeAplicacao { get; set; }
    public string PeriodoAplicacao { get; set; }

    public List<ModelInscricaoAluno> Inscricoes { get; set; }
  }
}