using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvoluaPonto.Api.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var response = await _authService.Login(request.Login, request.Senha);
            if (!response.Success) return BadRequest(response.ErrorMessage);
            return Ok(response.Data);
        }

        // Endpoint para criar o primeiro usuário (proteja ou remova depois)
        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar([FromBody] RegistrarUsuarioDto request)
        {
            var response = await _authService.Registrar(request);
            if (!response.Success) return BadRequest(response.ErrorMessage);
            return Ok(response.Data);
        }

        [HttpPost("change-email")]
        [Authorize]
        public async Task<IActionResult> ChangeEmail([FromBody] ChangeEmailDto request)
        {
            // Validação básica do ModelState (caso o e-mail venha vazio ou inválido pelo DTO)
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var response = await _authService.TrocarEmailAsync(request);

            if (!response.Success)
            {
                // Retorna BadRequest (400) com a mensagem de erro (senha errada, email duplicado, etc)
                return BadRequest(response.ErrorMessage);
            }

            return Ok(response);
        }
    }
}