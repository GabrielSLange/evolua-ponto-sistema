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

        public FeriadosController(FeriadoPersonalizadoService feriadoService)
        {
            _feriadoService = feriadoService;
        }

        // GET: api/feriados?empresaId=...
        [HttpGet]
        public async Task<IActionResult> GetFeriados([FromQuery] Guid empresaId)
        {
            var response = await _feriadoService.GetFeriadosByEmpresaAsync(empresaId);
            return Ok(response.Data);
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