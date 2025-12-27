using BCrypt.Net;
using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EvoluaPonto.Api.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<ServiceResponse<Usuario>> Registrar(RegistrarUsuarioDto dto)
        {
            if (await _context.Usuarios.AnyAsync(u => u.Login == dto.Login))
                return new ServiceResponse<Usuario> { Success = false, ErrorMessage = "Login já existe." };

            if (await _context.Usuarios.AnyAsync(u => u.FuncionarioId == dto.FuncionarioId))
                return new ServiceResponse<Usuario> { Success = false, ErrorMessage = "Este funcionário já possui um usuário." };

            // Criptografa a senha
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);

            var usuario = new Usuario
            {
                Id = Guid.NewGuid(),
                FuncionarioId = dto.FuncionarioId,
                Login = dto.Login,
                SenhaHash = passwordHash,
                Perfil = dto.Perfil,
                AcessoPermitido = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return new ServiceResponse<Usuario> { Data = usuario };
        }

        public async Task<ServiceResponse<AuthResponseDto>> Login(string login, string senha)
        {
            var usuario = await _context.Usuarios
                .Include(tb => tb.Funcionario) // Traz dados do RH
                .FirstOrDefaultAsync(tb => tb.Login == login);

            if (usuario == null)
                return new ServiceResponse<AuthResponseDto> { Success = false, ErrorMessage = "Usuário ou senha inválidos." };

            // 1. Valida Senha
            if (!BCrypt.Net.BCrypt.Verify(senha, usuario.SenhaHash))
                return new ServiceResponse<AuthResponseDto> { Success = false, ErrorMessage = "Usuário ou senha inválidos." };

            // 2. Valida Bloqueio de Segurança (Tabela Usuario)
            if (!usuario.AcessoPermitido)
                return new ServiceResponse<AuthResponseDto> { Success = false, ErrorMessage = "Acesso bloqueado pelo administrador." };

            // 3. Valida Vínculo Empregatício (Tabela Funcionario)
            // Se o Funcionario for null ou Ativo == false
            if (usuario.Funcionario == null || !usuario.Funcionario.Ativo)
                return new ServiceResponse<AuthResponseDto> { Success = false, ErrorMessage = "Colaborador inativo no quadro de funcionários." };

            // Gera Token
            var token = GerarTokenJwt(usuario);

            return new ServiceResponse<AuthResponseDto>
            {
                Data = new AuthResponseDto
                {
                    Token = token,
                    Nome = usuario.Funcionario.Nome,
                    Perfil = usuario.Perfil,
                    UsuarioId = usuario.Id
                }
            };
        }

        private string GerarTokenJwt(Usuario usuario)
        {
            var key = Encoding.ASCII.GetBytes(_config["JwtSettings:SecretKey"]);
            var tokenHandler = new JwtSecurityTokenHandler();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Login),
                new Claim(ClaimTypes.Role, usuario.Perfil),
                new Claim("FuncionarioId", usuario.FuncionarioId.ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(double.Parse(_config["JwtSettings:ExpireHours"])),
                Issuer = _config["JwtSettings:Issuer"],
                Audience = _config["JwtSettings:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}