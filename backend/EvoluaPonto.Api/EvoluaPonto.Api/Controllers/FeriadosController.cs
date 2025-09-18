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
            return Ok(response);
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

        // DELETE: api/feriados/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFeriado(Guid id)
        {
            var response = await _feriadoService.DeleteFeriadoAsync(id);
            if (!response.Success)
            {
                return NotFound(response.ErrorMessage);
            }

            return NoContent(); // Retorno padrão para delete com sucesso
        }
    }
}