using EvoluaPonto.Api.Interfaces;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.AspNetCore.Mvc;

namespace EvoluaPonto.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmpresasController : ControllerBase
    {
        private readonly IEmpresaService _empresaService;

        public EmpresasController(IEmpresaService empresaService)
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
    }
}
