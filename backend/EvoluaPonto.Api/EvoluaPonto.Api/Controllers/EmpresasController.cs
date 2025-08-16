using EvoluaPonto.Api.Interfaces;
using EvoluaPonto.Api.Models;
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
                ModelEmpresa? empresa = await _empresaService.GetByIdAsync(Id);
                if(empresa == null)
                {
                    return NotFound();
                }
                else
                {
                    return Ok(empresa);
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

                ModelEmpresa empresaCriada = await _empresaService.CreateAsync(NovaEmpresa);

                return CreatedAtAction(nameof(GetEmpresaById), new { id = empresaCriada }, empresaCriada);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }            
        }
    }
}
