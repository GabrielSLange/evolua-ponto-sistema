namespace EvoluaPonto.Api.Dtos
{
  public class CriarEventoVazioDto
  {
    public string NomeAplicacao { get; set; }
    public string PeriodoAplicacao { get; set; }
    public Guid EmpresaId { get; set; }
  }
}