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

        [HttpPost("solicitacao")]
        public async Task<IActionResult> SolicitarPonto([FromBody] SolicitacaoRegistroDto solicitacaoDto)
        {
            try
            {
                ServiceResponse<ModelRegistroPonto> responseSolicitacao = await _registroPontoService.SolicitarPontoAsync(solicitacaoDto);

                if (!responseSolicitacao.Success)
                    return BadRequest(responseSolicitacao.ErrorMessage);

                return Ok(responseSolicitacao);
            }
            catch (Exception ex)
            {
                return BadRequest(new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = ex.Message });
            }
        }

        [HttpGet("pendentes/{empresaId}")]
        public async Task<IActionResult> GetPendentes(Guid empresaId)
        {
            // Idealmente, pegue o ID da empresa do Token do usuário logado por segurança,
            // mas para dev, passar via parametro funciona.
            var response = await _registroPontoService.GetSolicitacoesPendentesAsync(empresaId);
            return Ok(response);
        }

        [HttpPut("avaliar/{id}")]
        public async Task<IActionResult> AvaliarSolicitacao(long id, [FromBody] AvaliarSolicitacaoDto dto)
        {
            var response = await _registroPontoService.AvaliarSolicitacaoAsync(id, dto);

            if (!response.Success)
                return BadRequest(response.ErrorMessage);

            return Ok(response);
        }
    }
}
