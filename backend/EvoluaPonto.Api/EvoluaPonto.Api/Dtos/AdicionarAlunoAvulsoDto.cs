namespace EvoluaPonto.Api.Dtos
{
  public class AdicionarAlunoAvulsoDto
  {
    public Guid EventoProvaId { get; set; }
    public Guid SalaProvaId { get; set; }
    public string NomeAluno { get; set; }
  }
}