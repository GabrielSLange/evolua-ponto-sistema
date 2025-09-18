using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Services.External;
using Microsoft.AspNetCore.Mvc;

namespace EvoluaPonto.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly SupabaseAdminService _supabaseAdmin;

        public AuthController(SupabaseAdminService supabaseAdmin)
        {
            _supabaseAdmin = supabaseAdmin;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (data, error) = await _supabaseAdmin.SignInUserAsync(loginDto.Email, loginDto.Password);

            if (error != null || data == null)
            {
                return Unauthorized(new { message = "Email ou senha inválidos.", error });
            }

            return Ok(data);
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (data, error) = await _supabaseAdmin.RefreshTokenAsync(refreshTokenDto.RefreshToken);

            if (error != null || data == null)
            {
                return BadRequest(new { message = "Refresh token inválido ou expirado.", error });
            }

            return Ok(data);
        }
    }
}