using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class EspelhoPontoController : ControllerBase
    {
        private readonly EspelhoPontoService _espelhoPontoService;

        public EspelhoPontoController(EspelhoPontoService espelhoPontoService)
        {
            _espelhoPontoService = espelhoPontoService;
        }

        [HttpGet("home")]
        public async Task<IActionResult> GetEspelhoHome([FromQuery] Guid funcionarioId)
        {
            try
            {
                var response = await _espelhoPontoService.GetEspelhoHomeAsync(funcionarioId);

                if (!response.Success)
                {
                    return BadRequest(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new ServiceResponse<object>
                {
                    Success = false,
                    ErrorMessage = $"Erro ao obter espelho: {ex.Message}"
                });
            }
        }
    }
}
