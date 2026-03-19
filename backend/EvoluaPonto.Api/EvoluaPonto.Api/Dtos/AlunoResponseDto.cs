namespace EvoluaPonto.Api.DTOs
{
  public class AlunoResponseDto
  {
    public Guid Id { get; set; }
    public string NomeAluno { get; set; }
    public string NumeroCarteira { get; set; }
    public string Curso { get; set; }
    public string Modalidade { get; set; }
    public string Sala { get; set; }
    public string Local { get; set; }
    public string Bloco { get; set; }
    public bool Presente { get; set; }
    public DateTime? DataHoraCheckin { get; set; }
  }
}