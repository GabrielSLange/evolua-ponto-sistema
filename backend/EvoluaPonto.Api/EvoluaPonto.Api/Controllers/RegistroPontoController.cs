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

        [HttpGet("ultimoPonto")]
        public async Task<IActionResult> GetUltimoPonto([FromQuery] Guid funcionarioId)
        {
            try
            {
                ServiceResponse<string> responseFuncionario = await _registroPontoService.GetUltimoPontoAsync(funcionarioId);

                if (!responseFuncionario.Success)
                    return BadRequest(responseFuncionario.ErrorMessage);

                return Ok(responseFuncionario.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

        }


        [HttpPost]
        public async Task<IActionResult> RegistrarPonto([FromForm] RegistroPontoDto pontoDto)
        {
            try
            {
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

        [HttpGet("historico")]
        public async Task<IActionResult> GetHistoricoSolicitacoes([FromQuery] Guid funcionarioId)
        {
            try
            {
                ServiceResponse<List<ModelRegistroPonto>> response = await _registroPontoService.GetHistoricoSolicitacoesAsync(funcionarioId);

                if (!response.Success)
                {
                    return BadRequest(response);
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new ServiceResponse<List<ModelRegistroPonto>>
                {
                    Success = false,
                    ErrorMessage = $"Erro ao listar histórico: {ex.Message}"
                });
            }
        }

        [HttpGet("pendentes")]
        public async Task<IActionResult> GetPendentes([FromQuery] Guid funcionarioId)
        {
            try
            {
                var response = await _registroPontoService.GetSolicitacoesPendentesAsync(funcionarioId);

                if (!response.Success)
                {
                    return BadRequest(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                // Retorna um erro estruturado em vez de estourar a API
                return BadRequest(new ServiceResponse<List<ModelRegistroPonto>>
                {
                    Success = false,
                    ErrorMessage = $"Erro ao listar pendências: {ex.Message}"
                });
            }
        }

        [HttpPut("avaliar/{id}")]
        public async Task<IActionResult> AvaliarSolicitacao(long id, [FromBody] AvaliarSolicitacaoDto dto)
        {
            try
            {
                var response = await _registroPontoService.AvaliarSolicitacaoAsync(id, dto);

                if (!response.Success)
                {
                    return BadRequest(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new ServiceResponse<bool>
                {
                    Success = false,
                    ErrorMessage = $"Erro ao processar avaliação: {ex.Message}"
                });
            }
        }

        [HttpGet("espelho/home")]
        public async Task<IActionResult> GetEspelhoHome([FromQuery] Guid funcionarioId)
        {
            try
            {
                var response = await _registroPontoService.GetEspelhoHomeAsync(funcionarioId);

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
