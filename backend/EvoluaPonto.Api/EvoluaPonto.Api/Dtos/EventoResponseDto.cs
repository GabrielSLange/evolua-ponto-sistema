namespace EvoluaPonto.Api.DTOs
{
  public class EventoResponseDto
  {
    public Guid Id { get; set; }
    public string NomeAplicacao { get; set; }
    public string PeriodoAplicacao { get; set; }
    public int TotalInscritos { get; set; }
  }
}