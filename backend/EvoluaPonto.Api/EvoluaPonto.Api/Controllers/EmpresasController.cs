
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EmpresasController : ControllerBase
    {
        private readonly EmpresaService _empresaService;
        private readonly IConfiguration _configuration;

        public EmpresasController(EmpresaService empresaService, IConfiguration configuration)
        {
            _empresaService = empresaService;
            _configuration = configuration;
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

        [HttpGet("test-auth")]
        public IActionResult TestAuthentication()
        {
            try
            {
                // 1. Pega o token do cabeçalho da requisição
                string? token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

                if (token == null)
                {
                    return BadRequest("Token não encontrado no cabeçalho Authorization.");
                }

                // 2. Recria os mesmos parâmetros de validação que estão no Program.cs
                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"])), // Injetar IConfiguration no controller
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"],
                    ClockSkew = TimeSpan.Zero
                };

                // 3. Tenta validar o token manualmente
                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken validatedToken);

                // Se chegar aqui, o token é válido!
                var claims = principal.Claims.Select(c => new { c.Type, c.Value });
                return Ok(new { Message = "Token é válido!", Claims = claims });
            }
            catch (Exception ex)
            {
                // Se a validação falhar, esta exceção nos dirá exatamente o porquê.
                return StatusCode(500, $"Erro na validação manual do token: {ex.ToString()}");
            }
        }
    }
}
