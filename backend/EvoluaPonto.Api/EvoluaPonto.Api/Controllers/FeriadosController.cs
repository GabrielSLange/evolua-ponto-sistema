using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize] // Protege os endpoints
    [ApiController]
    [Route("[controller]")]
    public class FeriadosController : ControllerBase
    {
        private readonly FeriadoPersonalizadoService _feriadoService;
        private readonly FeriadoService _feriadoNacionalService;

        public FeriadosController(FeriadoPersonalizadoService feriadoService, FeriadoService feriadoNacionalService)
        {
            _feriadoService = feriadoService;
            _feriadoNacionalService = feriadoNacionalService;
        }

        // GET: api/feriados?empresaId=...
        [HttpGet]
        public async Task<IActionResult> GetFeriados([FromQuery] Guid empresaId)
        {
            var response = await _feriadoService.GetFeriadosByEmpresaAsync(empresaId);
            return Ok(response.Data);
        }

        // GET: api/feriados/nacionais?ano=...
        [HttpGet("nacionais")]
        public async Task<IActionResult> GetFeriadosNacionais([FromQuery] int ano)
        {
            var feriadosNacionais = await _feriadoNacionalService.GetFeriadosNacionaisAsync(ano);
            if (feriadosNacionais is null)
            {
                return BadRequest("Não foi possível obter os feriados nacionais.");
            }
            return Ok(new ServiceResponse<List<FeriadoDto>> { Data = feriadosNacionais });
        }

        // POST: api/feriados
        [HttpPost]
        public async Task<IActionResult> CreateFeriado([FromBody] FeriadoPersonalizadoCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _feriadoService.CreateFeriadoAsync(dto);
            if (!response.Success)
            {
                return BadRequest(response.ErrorMessage);
            }

            return CreatedAtAction(nameof(GetFeriados), new { empresaId = response.Data.EmpresaId }, response);
        }

        [HttpPatch]
        public async Task<IActionResult> ToggleAtivo(Guid feriadoId)
        {
            try
            {
                ServiceResponse<bool> responseFeriado = await _feriadoService.ToggleAtivoAsync(feriadoId);

                if (!responseFeriado.Success)
                    return NotFound(responseFeriado.ErrorMessage);

                return Ok(responseFeriado.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}