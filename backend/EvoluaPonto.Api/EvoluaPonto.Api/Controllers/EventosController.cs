using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EvoluaPonto.Api.Services;

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
  }
}