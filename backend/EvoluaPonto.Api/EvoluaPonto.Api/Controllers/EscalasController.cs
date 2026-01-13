using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize] // Garante que apenas usuários logados acessem
    [ApiController]
    [Route("[controller]")]
    public class EscalasController : ControllerBase
    {
        private readonly EscalaService _escalaService;

        public EscalasController(EscalaService escalaService)
        {
            _escalaService = escalaService;
        }

        // GET: /Escalas?empresaId=...
        [HttpGet]
        public async Task<IActionResult> GetEscalas([FromQuery] Guid empresaId)
        {
            try
            {
                var response = await _escalaService.GetEscalasByEmpresaAsync(empresaId);
                return Ok(response.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET: /Escalas/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEscalaById(Guid id)
        {
            try
            {
                var response = await _escalaService.GetEscalaByIdAsync(id);

                if (!response.Success)
                    return NotFound(response.ErrorMessage);

                return Ok(response.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }            
        }

        // POST: /Escalas
        [HttpPost]
        public async Task<IActionResult> CreateEscala([FromBody] EscalaCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var response = await _escalaService.CreateEscalaAsync(dto);

                if (!response.Success)
                    return BadRequest(response.ErrorMessage);

                return CreatedAtAction(nameof(GetEscalaById), new { id = response.Data.Id }, response.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }            
        }

        // PUT: /Escalas/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEscala(Guid id, [FromBody] EscalaCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var response = await _escalaService.UpdateEscalaAsync(id, dto);

                if (!response.Success)
                    return BadRequest(response.ErrorMessage);

                return Ok(response.Data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }            
        }
    }
}