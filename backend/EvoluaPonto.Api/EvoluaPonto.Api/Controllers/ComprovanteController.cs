using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ComprovanteController : ControllerBase
    {
        private readonly ComprovanteService _comprovanteService;

        public ComprovanteController(ComprovanteService comprovanteService)
        {
            _comprovanteService = comprovanteService;
        }

        [HttpGet]
        public async Task<IActionResult> GetComprovantes([FromQuery] Guid funcionarioId, [FromQuery] DateTime dataInicio, [FromQuery] DateTime dataFim)
        {
            // Validação simples das datas
            if (dataFim < dataInicio)
            {
                return BadRequest(new ServiceResponse<object> { Success = false, ErrorMessage = "Data final não pode ser anterior à data inicial." });
            }

            // Chama o serviço que criamos
            var response = await _comprovanteService.GetComprovantesPorFuncionarioAsync(funcionarioId, dataInicio, dataFim);

            if (!response.Success)
            {
                return BadRequest(response); // Retorna a mensagem de erro do serviço
            }

            return Ok(response); // Retorna a lista de comprovantes
        }
    }
}
