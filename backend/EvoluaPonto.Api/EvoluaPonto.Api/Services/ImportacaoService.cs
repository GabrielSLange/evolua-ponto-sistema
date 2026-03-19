using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using ExcelDataReader;
using EvoluaPonto.Api.DTOs;
using EvoluaPonto.Api.Mappings;
using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EvoluaPonto.Api.Services
{
  public class ImportacaoService
  {
    private readonly AppDbContext _context;

    public ImportacaoService(AppDbContext context)
    {
      _context = context;
    }

    public async Task<int> ProcessarArquivoAsync(IFormFile ficheiro, Guid empresaId)
    {
      var empresa = await _context.Empresas.FindAsync(empresaId);
      if (empresa == null)
        throw new Exception("Empresa não encontrada.");

      var extensao = Path.GetExtension(ficheiro.FileName).ToLower();
      List<ImportacaoProvaCsvDto> registosExtraidos = new List<ImportacaoProvaCsvDto>();

      if (extensao == ".csv")
      {
        registosExtraidos = LerArquivoCsv(ficheiro);
      }
      else if (extensao == ".xlsx" || extensao == ".xls")
      {
        registosExtraidos = LerArquivoExcel(ficheiro);
      }
      else
      {
        throw new Exception("Formato de ficheiro não suportado. Envie um .csv ou .xlsx");
      }

      // A partir daqui, a lógica de salvar no banco é idêntica para os dois formatos
      var locaisDb = await _context.LocaisProva.ToListAsync();
      var salasDb = await _context.SalasProva.ToListAsync();
      var eventosDb = await _context.EventosProva.Where(e => e.EmpresaId == empresaId).ToListAsync();

      int totalInscricoesNovas = 0;

      using var transaction = await _context.Database.BeginTransactionAsync();

      try
      {
        foreach (var dto in registosExtraidos)
        {
          // Ignora linhas vazias
          if (string.IsNullOrWhiteSpace(dto.Aluno)) continue;

          var local = locaisDb.FirstOrDefault(l => l.Campus == dto.CampusPolo && l.Bloco == dto.Bloco);
          if (local == null)
          {
            local = new ModelLocalProva { Campus = dto.CampusPolo, Bloco = dto.Bloco };
            _context.LocaisProva.Add(local);
            locaisDb.Add(local);
          }

          var sala = salasDb.FirstOrDefault(s => s.NomeSala == dto.Sala && s.LocalProvaId == local.Id);
          if (sala == null)
          {
            sala = new ModelSalaProva { NomeSala = dto.Sala, Local = local };
            _context.SalasProva.Add(sala);
            salasDb.Add(sala);
          }

          var evento = eventosDb.FirstOrDefault(e => e.PeriodoAplicacao == dto.Aplicacao);
          if (evento == null)
          {
            evento = new ModelEventoProva { EmpresaId = empresaId, NomeAplicacao = "Avaliação Presencial", PeriodoAplicacao = dto.Aplicacao };
            _context.EventosProva.Add(evento);
            eventosDb.Add(evento);
          }

          var inscricaoExiste = await _context.InscricoesAlunos
              .AnyAsync(i => i.Evento == evento && i.NomeAluno == dto.Aluno);

          if (!inscricaoExiste)
          {
            var inscricao = new ModelInscricaoAluno
            {
              Evento = evento,
              Sala = sala,
              NomeAluno = dto.Aluno,
              NumeroCarteira = dto.NumeroCarteira,
              Curso = dto.Curso,
              Modalidade = dto.Modalidade
            };

            _context.InscricoesAlunos.Add(inscricao);
            totalInscricoesNovas++;
          }
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return totalInscricoesNovas;
      }
      catch
      {
        await transaction.RollbackAsync();
        throw;
      }
    }

    // --- MÉTODOS AUXILIARES DE LEITURA ---

    private List<ImportacaoProvaCsvDto> LerArquivoCsv(IFormFile ficheiro)
    {
      using var stream = ficheiro.OpenReadStream();
      using var reader = new StreamReader(stream);

      var config = new CsvConfiguration(CultureInfo.InvariantCulture)
      {
        HasHeaderRecord = true,
        Delimiter = ","
      };

      using var csv = new CsvReader(reader, config);
      csv.Context.RegisterClassMap<ImportacaoProvaCsvMap>();

      return csv.GetRecords<ImportacaoProvaCsvDto>().ToList();
    }

    private List<ImportacaoProvaCsvDto> LerArquivoExcel(IFormFile ficheiro)
    {
      // Necessário para o ExcelDataReader funcionar no .NET Core / .NET 8
      System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

      var registos = new List<ImportacaoProvaCsvDto>();

      using var stream = ficheiro.OpenReadStream();
      using var reader = ExcelReaderFactory.CreateReader(stream);

      bool isHeader = true;
      while (reader.Read()) // Lê linha por linha
      {
        if (isHeader)
        {
          isHeader = false; // Pula a primeira linha (cabeçalho)
          continue;
        }

        // Mapeia as colunas do Excel (Índice 0 é a coluna A, Índice 1 é a B...)
        var dto = new ImportacaoProvaCsvDto
        {
          CampusPolo = reader.GetValue(0)?.ToString(),
          Bloco = reader.GetValue(1)?.ToString(),
          Sala = reader.GetValue(2)?.ToString(),
          Aluno = reader.GetValue(3)?.ToString(),
          NumeroCarteira = reader.GetValue(4)?.ToString(),
          Curso = reader.GetValue(5)?.ToString(),
          Modalidade = reader.GetValue(6)?.ToString(),
          Aplicacao = reader.GetValue(7)?.ToString()
        };

        registos.Add(dto);
      }

      return registos;
    }
  }
}