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
        public async Task<IActionResult> GetComprovantes([FromQuery] Guid funcionarioId, [FromQuery] string dataInicio, [FromQuery] string dataFim)
        {
            // 1. BLINDAGEM: Envolvemos tudo num try/catch no nível do Controller
            // para garantir que qualquer erro devolva JSON e não quebre o CORS.
            try
            {
                // 2. CONVERSÃO MANUAL: Recebemos string e convertemos aqui dentro.
                // Isso evita que o .NET rejeite a requisição antes de começar.
                if (!DateTime.TryParse(dataInicio, out DateTime dtInicio))
                {
                    return BadRequest(new ServiceResponse<object> { Success = false, ErrorMessage = $"Data de início inválida: {dataInicio}. Use o formato YYYY-MM-DD." });
                }

                if (!DateTime.TryParse(dataFim, out DateTime dtFim))
                {
                    return BadRequest(new ServiceResponse<object> { Success = false, ErrorMessage = $"Data final inválida: {dataFim}. Use o formato YYYY-MM-DD." });
                }

                // Validação lógica
                if (dtFim < dtInicio)
                {
                    return BadRequest(new ServiceResponse<object> { Success = false, ErrorMessage = "Data final não pode ser anterior à data inicial." });
                }

                // Chama o serviço (passando os DateTimes já convertidos)
                var response = await _registroPontoService.GetComprovantesPorFuncionarioAsync(funcionarioId, dtInicio, dtFim);

                if (!response.Success)
                {
                    return BadRequest(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                // Se explodir aqui, devolvemos 500 com JSON, o que o navegador aceita melhor que um crash de rede
                return StatusCode(500, new ServiceResponse<object> { Success = false, ErrorMessage = $"Erro interno na Controller: {ex.Message}" });
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
