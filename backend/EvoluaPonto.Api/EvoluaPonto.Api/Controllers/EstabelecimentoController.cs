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
    public class EstabelecimentoController : ControllerBase
    {
        private readonly EstabelecimentoService _estabelecimentoService;

        public EstabelecimentoController(EstabelecimentoService estabelecimentoService)
        {
            _estabelecimentoService = estabelecimentoService;
        }

        [HttpGet]
        public async Task<IActionResult> GetEstabelecimentosEmpresa(Guid empresaId)
        {
            try
            {
                return Ok((await _estabelecimentoService.GetEstabelecimentosEmpresa(empresaId)).Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("Id")]
        public async Task<IActionResult> GetEstabelecimentoId(Guid estabelecimentoId)
        {
            try
            {
                ServiceResponse<ModelEstabelecimento> responseEstabelecimento = await _estabelecimentoService.GetEstabelecimentoById(estabelecimentoId);

                if (!responseEstabelecimento.Success)
                    return NotFound(responseEstabelecimento.ErrorMessage);

                return Ok(responseEstabelecimento.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateEstabelecimento([FromBody] ModelEstabelecimento estabelecimentoNovo)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                ServiceResponse<ModelEstabelecimento> responseEstabelecimento = await _estabelecimentoService.CreateEsabelecimento(estabelecimentoNovo);

                if (!responseEstabelecimento.Success)
                    return NotFound(responseEstabelecimento.ErrorMessage);

                return Ok(responseEstabelecimento.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateEstabelecimento([FromBody] ModelEstabelecimento estabelecimentoAtualizado)
        {
            try
            {
                ServiceResponse<ModelEstabelecimento> responseEstabelecimento = await _estabelecimentoService.UpdateEstabelecimento(estabelecimentoAtualizado);

                if (!responseEstabelecimento.Success)
                    return NotFound(responseEstabelecimento.ErrorMessage);

                return Ok(responseEstabelecimento.Data);
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
                ServiceResponse<bool> responseEstabelecimento = await _estabelecimentoService.ToggleAtivoAsync(Id);

                if (!responseEstabelecimento.Success)
                    return NotFound(responseEstabelecimento.ErrorMessage);

                return Ok(responseEstabelecimento.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
