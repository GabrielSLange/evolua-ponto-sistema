using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class RegistroPontoController : ControllerBase
    {
        private readonly RegistroPontoService _registroPontoService;

        public RegistroPontoController(RegistroPontoService registroPontoService)
        {
            _registroPontoService = registroPontoService;
        }

        [HttpPost]
        public async Task<IActionResult> RegistrarPonto([FromForm] RegistroPontoDto pontoDto)
        {
            try
            {
                //if (!ModelState.IsValid)
                //{
                //    return BadRequest(ModelState);
                //}

                ServiceResponse<ModelRegistroPonto> responseFuncionario = await _registroPontoService.RegistrarPontoAsync(pontoDto);

                if (!responseFuncionario.Success)
                    return BadRequest(responseFuncionario.ErrorMessage);

                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

        }

        [HttpGet("comprovantes")]
        public async Task<IActionResult> GetComprovantes([FromQuery] Guid funcionarioId, [FromQuery] DateTime dataInicio, [FromQuery] DateTime dataFim)
        {
            // Validação simples das datas
            if (dataFim < dataInicio)
            {
                return BadRequest(new ServiceResponse<object> { Success = false, ErrorMessage = "Data final não pode ser anterior à data inicial." });
            }

            // Chama o serviço que criamos
            var response = await _registroPontoService.GetComprovantesPorFuncionarioAsync(funcionarioId, dataInicio, dataFim);

            if (!response.Success)
            {
                return BadRequest(response); // Retorna a mensagem de erro do serviço
            }

            return Ok(response); // Retorna a lista de comprovantes
        }
    }
}
