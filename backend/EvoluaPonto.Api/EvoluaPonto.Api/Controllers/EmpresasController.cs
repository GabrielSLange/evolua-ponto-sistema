
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EmpresasController : ControllerBase
    {
        private readonly EmpresaService _empresaService;

        public EmpresasController(EmpresaService empresaService, IConfiguration configuration)
        {
            _empresaService = empresaService;
        }

        [HttpGet("{Id}")]
        public async Task<IActionResult> GetEmpresaById(Guid Id)
        {
            try
            {
                ServiceResponse<ModelEmpresa> ResponseEmpresa = await _empresaService.GetByIdAsync(Id);
                if(!ResponseEmpresa.Success)
                {
                    return NotFound(ResponseEmpresa.ErrorMessage);
                }
                else
                {
                    return Ok(ResponseEmpresa.Data);
                }
            }
            catch (Exception ex) 
            {
                return BadRequest(ex.Message);
            }            
        }

        [HttpGet]
        public async Task<IActionResult> GetEmpresas()
        {
            try
            {
                ServiceResponse<List<ModelEmpresa>> responseEmpresa = await _empresaService.GetAsync();
                return Ok(responseEmpresa.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmpresa([FromBody] ModelEmpresa NovaEmpresa)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                ServiceResponse<ModelEmpresa> ResponseEmpresa = await _empresaService.CreateAsync(NovaEmpresa);

                if (!ResponseEmpresa.Success)
                {
                    return Conflict(ResponseEmpresa.ErrorMessage);
                }

                return CreatedAtAction(nameof(GetEmpresaById), new { id = ResponseEmpresa.Data?.Id }, ResponseEmpresa.Data);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }            
        }

        [HttpPut]
        public async Task<IActionResult> UpdateEmpresa([FromBody] ModelEmpresa EmpresaAtualizada)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                ServiceResponse<ModelEmpresa> ResponseEmpresa = await _empresaService.UpdateAsync(EmpresaAtualizada);

                if (!ResponseEmpresa.Success && ResponseEmpresa.ErrorMessage is not null)
                {
                    if (ResponseEmpresa.ErrorMessage.Contains("ID"))
                    {
                        return NotFound(ResponseEmpresa.ErrorMessage);
                    }
                    else
                    {
                        return Conflict(ResponseEmpresa.ErrorMessage);
                    }
                    
                }

                return Ok(ResponseEmpresa.Data);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
            
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteEmpresa(Guid Id)
        {
            try
            {
                ServiceResponse<bool> responseEmpresa = await _empresaService.DeleteAsync(Id);
                if (!responseEmpresa.Success)
                {
                    return NotFound(responseEmpresa.ErrorMessage);
                }

                return Ok(responseEmpresa.Success);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
