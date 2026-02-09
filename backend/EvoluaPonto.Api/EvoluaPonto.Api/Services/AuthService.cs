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

        public async Task<ServiceResponse<ModelUsuario>> Registrar(RegistrarUsuarioDto dto)
        {
            if (await _context.Usuarios.AnyAsync(u => u.Login == dto.Login))
                return new ServiceResponse<ModelUsuario> { Success = false, ErrorMessage = "Login já existe." };

            if (await _context.Usuarios.AnyAsync(u => u.FuncionarioId == dto.FuncionarioId))
                return new ServiceResponse<ModelUsuario> { Success = false, ErrorMessage = "Este funcionário já possui um usuário." };

            // Criptografa a senha
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);

            var usuario = new ModelUsuario
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

            return new ServiceResponse<ModelUsuario> { Data = usuario };
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

        private string GerarTokenJwt(ModelUsuario usuario)
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

        public async Task<ServiceResponse<bool>> TrocarEmailAsync(ChangeEmailDto dto)
        {
            var response = new ServiceResponse<bool>();

            try
            {
                // 1. Busca o usuário (incluindo dados do funcionário para manter consistência)
                var usuario = await _context.Usuarios
                    .Include(u => u.Funcionario)
                    .FirstOrDefaultAsync(u => u.FuncionarioId == dto.UserId);

                if (usuario == null)
                {
                    response.Success = false;
                    response.ErrorMessage = "Usuário não encontrado.";
                    return response;
                }

                // 2. VERIFICA A SENHA ATUAL (Passo de Segurança Crítico)
                // O usuário só pode trocar o e-mail se confirmar quem ele é
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, usuario.SenhaHash))
                {
                    response.Success = false;
                    response.ErrorMessage = "Senha incorreta. Não foi possível alterar o e-mail.";
                    return response;
                }

                // 3. Verifica se o novo e-mail já está em uso por OUTRO usuário
                var emailEmUso = await _context.Usuarios
                    .AnyAsync(u => u.Login == dto.NewEmail && u.Id != dto.UserId);

                if (emailEmUso)
                {
                    response.Success = false;
                    response.ErrorMessage = "Este e-mail já está em uso por outro usuário.";
                    return response;
                }

                // 4. Realiza a troca
                usuario.Login = dto.NewEmail;

                await _context.SaveChangesAsync();

                response.Data = true;
                response.Success = true;
                response.ErrorMessage = "E-mail alterado com sucesso.";
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.ErrorMessage = "Erro ao trocar e-mail: " + ex.Message;
            }

            return response;
        }

        public async Task<ServiceResponse<bool>> TrocarSenhaAsync(ChangePasswordDto dto)
        {
            var response = new ServiceResponse<bool>();

            try
            {
                // 1. Busca o usuário
                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.FuncionarioId == dto.UserId);

                if (usuario == null)
                {
                    response.Success = false;
                    response.ErrorMessage = "Usuário não encontrado.";
                    return response;
                }

                // 2. Valida a senha ATUAL
                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, usuario.SenhaHash))
                {
                    response.Success = false;
                    response.ErrorMessage = "Senha atual incorreta.";
                    return response;
                }

                // 3. Verifica se a nova senha é igual à antiga (Opcional, mas boa prática)
                if (BCrypt.Net.BCrypt.Verify(dto.NewPassword, usuario.SenhaHash))
                {
                    response.Success = false;
                    response.ErrorMessage = "A nova senha não pode ser igual à atual.";
                    return response;
                }

                // 4. Gera o hash da NOVA senha e salva
                string novoHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                usuario.SenhaHash = novoHash;

                await _context.SaveChangesAsync();

                response.Data = true;
                response.Success = true;
                response.ErrorMessage = "Senha alterada com sucesso.";
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.ErrorMessage = "Erro ao trocar senha: " + ex.Message;
            }

            return response;
        }
    }
}