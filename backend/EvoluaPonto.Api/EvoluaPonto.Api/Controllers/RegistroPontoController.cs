using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvoluaPonto.Api.Controllers
{
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
                string? funcionarioIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(funcionarioIdString))
                    return Unauthorized("ID do funcionário não encontrado no Token");

                if (!Guid.TryParse(funcionarioIdString, out Guid funcionarioId))
                {
                    return BadRequest("O ID do funcionário no token é inválido.");
                }

                ServiceResponse<ModelRegistroPonto> responseFuncionario = await _registroPontoService.RegistrarPontoAsync(pontoDto, funcionarioId);

                if (!responseFuncionario.Success)
                    return BadRequest(responseFuncionario.ErrorMessage);

                return Ok(responseFuncionario.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

        }
    }
}
