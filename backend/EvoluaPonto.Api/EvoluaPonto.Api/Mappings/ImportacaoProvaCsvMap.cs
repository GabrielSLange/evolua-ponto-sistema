using CsvHelper.Configuration;
using EvoluaPonto.Api.DTOs;

namespace EvoluaPonto.Api.Mappings
{
  public class ImportacaoProvaCsvMap : ClassMap<ImportacaoProvaCsvDto>
  {
    public ImportacaoProvaCsvMap()
    {
      Map(m => m.CampusPolo).Name("Campus/Polo");
      Map(m => m.Bloco).Name("Bloco");
      Map(m => m.Sala).Name("Sala");
      Map(m => m.Aluno).Name("Aluno");
      Map(m => m.NumeroCarteira).Name("Número da carteira");
      Map(m => m.Curso).Name("Curso");
      Map(m => m.Modalidade).Name("Modalidade");
      Map(m => m.Aplicacao).Name("Aplicação");
    }
  }
}