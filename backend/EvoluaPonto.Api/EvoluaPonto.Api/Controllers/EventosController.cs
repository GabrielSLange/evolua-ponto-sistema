using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EvoluaPonto.Api.Dtos;

namespace EvoluaPonto.Api.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class EventosController : ControllerBase
  {
    private readonly ImportacaoService _importacaoService;
    private readonly EventosService _eventosService;

    public EventosController(ImportacaoService importacaoService, EventosService eventosService)
    {
      _importacaoService = importacaoService;
      _eventosService = eventosService;
    }

    [HttpPost("importar")]
    public async Task<IActionResult> ImportarPlanilha(IFormFile arquivo, [FromForm] Guid empresaId)
    {
      if (arquivo == null || arquivo.Length == 0)
      {
        return BadRequest("Ficheiro inválido.");
      }

      if (empresaId == Guid.Empty)
        return BadRequest("O ID da empresa é obrigatório.");

      try
      {
        var totalImportado = await _importacaoService.ProcessarArquivoAsync(arquivo, empresaId);
        return Ok(new { mensagem = "Importação concluída com sucesso", insercoes = totalImportado });
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { erro = ex.Message });
      }
    }

    [HttpGet("empresa/{empresaId}")]
    public async Task<IActionResult> ListarEventosDaEmpresa(
    Guid empresaId,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string search = "")
    {
      var resultado = await _eventosService.ListarEventosDaEmpresaPaginadoAsync(empresaId, page, pageSize, search);
      return Ok(resultado);
    }

    [HttpGet("{eventoId}/alunos")]
    public async Task<IActionResult> ListarAlunosDoEvento(Guid eventoId, [FromQuery] string? sala = null)
    {
      var alunos = await _eventosService.ListarAlunosDoEventoAsync(eventoId, sala);
      return Ok(alunos);
    }

    [HttpPut("inscricao/{inscricaoId}/presenca")]
    public async Task<IActionResult> RegistrarPresenca(Guid inscricaoId)
    {
      try
      {
        var resultado = await _eventosService.RegistrarPresencaAsync(inscricaoId);
        return Ok(resultado);
      }
      catch (KeyNotFoundException ex)
      {
        return NotFound(ex.Message);
      }
      catch (InvalidOperationException ex)
      {
        return BadRequest(ex.Message);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { erro = ex.Message });
      }
    }


    [HttpDelete("{id}")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> ExcluirEvento(Guid id)
    {
      try
      {
        var sucesso = await _eventosService.ExcluirEventoCompletoAsync(id);

        if (!sucesso)
          return NotFound(new { mensagem = "Evento não encontrado." });

        return Ok(new { mensagem = "Evento e todos os dados vinculados foram excluídos permanentemente." });
      }
      catch (Exception ex)
      {
        return BadRequest(new { erro = ex.Message });
      }
    }

    [HttpGet("{eventoId}/exportar-excel")]
    [Authorize]
    public async Task<IActionResult> ExportarExcel(Guid eventoId)
    {
      try
      {
        var arquivoBytes = await _eventosService.GerarExcelPresencaAsync(eventoId);

        var mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        var nomeArquivo = $"Presenca_Evento_{eventoId.ToString()[..8]}.xlsx";

        return File(arquivoBytes, mimeType, nomeArquivo);
      }
      catch (Exception ex)
      {
        return BadRequest(new { erro = "Erro ao gerar arquivo Excel: " + ex.Message });
      }
    }

    [HttpGet("{eventoId}/exportar-pdf")]
    [Authorize]
    public async Task<IActionResult> ExportarPdf(Guid eventoId)
    {
      try
      {
        var arquivoBytes = await _eventosService.GerarPdfPresencaAsync(eventoId);

        var mimeType = "application/pdf";
        var nomeArquivo = $"Presenca_Evento_{eventoId.ToString()[..8]}.pdf";

        return File(arquivoBytes, mimeType, nomeArquivo);
      }
      catch (Exception ex)
      {
        return BadRequest(new { erro = "Erro ao gerar arquivo PDF: " + ex.Message });
      }
    }

    [HttpPost("vazio")]
    [Authorize]
    public async Task<IActionResult> CriarEventoVazio([FromBody] CriarEventoVazioDto dto)
    {
      try
      {
        var eventoId = await _eventosService.CriarEventoVazioAsync(dto);
        return CreatedAtAction(nameof(CriarEventoVazio), new { id = eventoId }, new { mensagem = "Evento criado com sucesso.", id = eventoId });
      }
      catch (Exception ex)
      {
        return BadRequest(new { erro = ex.Message });
      }
    }

    [HttpPost("adicionar-aluno-avulso")]
    [Authorize]
    public async Task<IActionResult> AdicionarAlunoAvulso([FromBody] AdicionarAlunoAvulsoDto dto)
    {
      try
      {
        if (string.IsNullOrWhiteSpace(dto.NomeAluno))
          return BadRequest(new { erro = "O nome do aluno é obrigatório." });

        var inscricaoId = await _eventosService.AdicionarAlunoAvulsoAsync(dto);
        return Ok(new { mensagem = "Aluno avulso adicionado e presença registrada.", id = inscricaoId });
      }
      catch (Exception ex)
      {
        return BadRequest(new { erro = ex.Message });
      }
    }
  }
}