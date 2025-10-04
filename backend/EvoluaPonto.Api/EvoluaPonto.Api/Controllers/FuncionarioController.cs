using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class FuncionariosController : ControllerBase
    {
        private readonly FuncionarioService _funcionarioService;

        public FuncionariosController(FuncionarioService funcionarioService)
        {
            _funcionarioService = funcionarioService;
        }

        [HttpGet]
        public async Task<IActionResult> GetFuncionariosEmpresa(Guid estabelecimentoId)
        {
            try
            {
                ServiceResponse<List<ModelFuncionario>> responseFuncionario = await _funcionarioService.GetFuncionariosEstabelecimento(estabelecimentoId);
                return Ok(responseFuncionario.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("id")]
        public async Task<IActionResult> GetFuncionarioId(Guid funcionarioId)
        {
            try
            {
                ServiceResponse<ModelFuncionario> responseFuncionario = await _funcionarioService.GetFuncionarioById(funcionarioId);

                if (!responseFuncionario.Success)
                    return Conflict(responseFuncionario.ErrorMessage);

                return Ok(responseFuncionario.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateFuncionario([FromBody] FuncionarioCreateDto novoFuncionario)
        {
            try
            {
                ServiceResponse<ModelFuncionario> responseFuncionario = await _funcionarioService.CreateFuncionario(novoFuncionario);

                if (!responseFuncionario.Success)
                    return Conflict(responseFuncionario.ErrorMessage);

                return Ok(responseFuncionario.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateFuncionario(ModelFuncionario funcionarioAtualizado)
        {
            try
            {
                ServiceResponse<ModelFuncionario> responseFuncionario = await _funcionarioService.UpdateFuncionario(funcionarioAtualizado);

                if (!responseFuncionario.Success)
                    return NotFound(responseFuncionario.ErrorMessage);

                return Ok(responseFuncionario.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch]
        public async Task<IActionResult> ToggleAtivo(Guid Id)
        {
            try
            {
                ServiceResponse<bool> responseFuncionario = await _funcionarioService.ToggleAtivoAsync(Id);

                if (!responseFuncionario.Success)
                    return NotFound(responseFuncionario.ErrorMessage);

                return Ok(responseFuncionario.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
