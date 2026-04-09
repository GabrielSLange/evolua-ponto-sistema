using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace EvoluaPonto.Api.Services
{
    public class FuncionarioService
    {
        private readonly AppDbContext _context;

        public FuncionarioService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResponse<List<ModelFuncionario>>> GetFuncionariosEmpresa(Guid empresaId)
            => new ServiceResponse<List<ModelFuncionario>>
            {
                Data = await _context.Funcionarios
                .AsNoTracking()
                .Include(tb => tb.Estabelecimento)
                .Where(tb => tb.Estabelecimento.EmpresaId == empresaId)
                .ToListAsync()
            };

        public async Task<ServiceResponse<List<ModelFuncionario>>> GetFuncionariosEstabelecimento(Guid estabelecimentoId)
            => new ServiceResponse<List<ModelFuncionario>>
            {
                Data = await _context.Funcionarios
                .AsNoTracking()
                .Include(tb => tb.Estabelecimento)
                .Where(tb => tb.EstabelecimentoId == estabelecimentoId)
                .ToListAsync()
            };

        public async Task<ServiceResponse<FuncionarioDto>> GetFuncionarioById(Guid funcionarioId)
        {
            ModelFuncionario? funcionario = await _context.Funcionarios
                .Include(tb => tb.Estabelecimento)
                .FirstOrDefaultAsync(tb => tb.Id == funcionarioId);

            if (funcionario is null)
                return new ServiceResponse<FuncionarioDto> { Success = false, ErrorMessage = "Não existe funcionário com esse ID" };

            ModelUsuario? usuarioBanco = await _context.Usuarios.FirstOrDefaultAsync(tb => tb.FuncionarioId == funcionario.Id);

            if (usuarioBanco is null)
                    return new ServiceResponse<FuncionarioDto> { Success = false, ErrorMessage = "Funcionário não possui usuário vinculado" };



            FuncionarioDto funcionarioDto = new FuncionarioDto
            {
                Id = funcionario.Id,
                Nome = funcionario.Nome,
                Cpf = funcionario.Cpf,
                Cargo = funcionario.Cargo,
                Ativo = funcionario.Ativo,
                EstabelecimentoId = funcionario.EstabelecimentoId,
                Estabelecimento = funcionario.Estabelecimento,
                Email = usuarioBanco.Login,
                Role = usuarioBanco.Perfil,
                EscalaId = funcionario.EscalaId
            };

            return new ServiceResponse<FuncionarioDto> { Data = funcionarioDto };
        }

        public async Task<ServiceResponse<ModelFuncionario>> CriarFuncionarioComAcesso(FuncionarioDto funcionarioDto)
        {
            ModelFuncionario? funcionarioBanco = await _context.Funcionarios.FirstOrDefaultAsync(tb => tb.Cpf == funcionarioDto.Cpf);
            ModelEstabelecimento? estabelecimentoBanco = await _context.Estabelecimentos.FirstOrDefaultAsync(tb => tb.Id == funcionarioDto.EstabelecimentoId);

            if (funcionarioBanco is not null)
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "Já existe um funcionario cadastrado com esse CPF" };
            if (estabelecimentoBanco is null)
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "Não existe nenhum estabelecimento com o ID informado" };

            ModelUsuario? usuarioBanco = await _context.Usuarios.FirstOrDefaultAsync(tb => tb.Login == funcionarioDto.Email);

            if (usuarioBanco is not null)
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "Já existe um usuário cadastrado com esse e-mail" };

            ModelFuncionario novoFuncionario = new()
            {
                Id = Guid.NewGuid(),
                Nome = funcionarioDto.Nome,
                Cpf = funcionarioDto.Cpf,
                Cargo = funcionarioDto.Cargo,
                CreatedAt = DateTime.UtcNow,
                Ativo = true,
                EstabelecimentoId = funcionarioDto.EstabelecimentoId,
                EscalaId = funcionarioDto.EscalaId
            };

            try
            {
                _context.Add(novoFuncionario);
                await _context.SaveChangesAsync();
            }
            catch(Exception e)
            {
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = $"Erro ao salvar o funcionario: {e.Message}" };
            }

            

            ModelUsuario? novoUsuario = new() 
            { 
                Id = Guid.NewGuid(),
                Login = funcionarioDto.Email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(funcionarioDto.Password),
                Perfil = funcionarioDto.Role,
                AcessoPermitido = true,
                FuncionarioId = novoFuncionario.Id
            };

            try
            {
                _context.Add(novoUsuario);
                await _context.SaveChangesAsync();
            }
            catch(Exception e)
            {
                _context.Remove(novoFuncionario);
                await _context.SaveChangesAsync();
                return new ServiceResponse<ModelFuncionario> { Success = false , ErrorMessage = $"Erro ao cadastrar o usuario: {e.Message}" };
            }

            return new ServiceResponse<ModelFuncionario> { Success = true, Data = novoFuncionario };
        }

        public async Task<ServiceResponse<ModelFuncionario>> UpdateFuncionario(FuncionarioDto funcionarioAtualizado)
        {
            ModelFuncionario? funcionarioBanco = await _context.Funcionarios.FirstOrDefaultAsync(tb => tb.Id == funcionarioAtualizado.Id);
            if (funcionarioBanco is null)
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "Não existe funcionário com esse ID" };

            if (await _context.Funcionarios.AnyAsync(tb => tb.Cpf == funcionarioAtualizado.Cpf && tb.Id != funcionarioAtualizado.Id))
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "Já existe um funcionário cadastrado com esse CPF" };

            if (!await _context.Estabelecimentos.AsNoTracking().AnyAsync(tb => tb.Id == funcionarioAtualizado.EstabelecimentoId))
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "O estabelecimento vinculado ao funcionário não existe" };

            ModelUsuario? usuarioBanco = await _context.Usuarios.FirstOrDefaultAsync(tb => tb.FuncionarioId == funcionarioAtualizado.Id);

            if (usuarioBanco is null)
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "O funcionário não possui nenhum usuário vinculado" };

            usuarioBanco.Login = funcionarioAtualizado.Email;
            usuarioBanco.Perfil = funcionarioAtualizado.Role;
            if (funcionarioAtualizado.Password is not null)
                usuarioBanco.SenhaHash = BCrypt.Net.BCrypt.HashPassword(funcionarioAtualizado.Password);
            funcionarioBanco.Nome = funcionarioAtualizado.Nome;
            funcionarioBanco.Cpf = funcionarioAtualizado.Cpf;
            funcionarioBanco.Cargo = funcionarioAtualizado.Cargo;
            funcionarioBanco.EstabelecimentoId = funcionarioAtualizado.EstabelecimentoId;
            funcionarioBanco.EscalaId = funcionarioAtualizado.EscalaId;

            _context.Update(usuarioBanco);
            _context.Update(funcionarioBanco);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelFuncionario> { Data = funcionarioBanco };
        }

        public async Task<ServiceResponse<bool>> ToggleAtivoAsync(Guid funcionarioId)
        {
            ModelFuncionario? funcionarioBanco = await _context.Funcionarios.FirstOrDefaultAsync(tb => tb.Id == funcionarioId);

            if (funcionarioBanco is null)
                return new ServiceResponse<bool> { Success = false, ErrorMessage = "Não existe um funcionário cadastrado com esse ID" };

            funcionarioBanco.Ativo = !funcionarioBanco.Ativo;

            _context.Update(funcionarioBanco);
            await _context.SaveChangesAsync();

            return new ServiceResponse<bool> { Data = true };
        }
    }
}
