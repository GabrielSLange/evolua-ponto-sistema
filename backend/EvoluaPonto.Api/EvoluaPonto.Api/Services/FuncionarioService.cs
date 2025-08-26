using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services.External;
using Microsoft.EntityFrameworkCore;

namespace EvoluaPonto.Api.Services
{
    public class FuncionarioService
    {
        private readonly AppDbContext _context;
        private readonly SupabaseAdminService _supabaseAdmin;

        public FuncionarioService(AppDbContext context, SupabaseAdminService supabaseAdmin)
        {
            _context = context;
            _supabaseAdmin = supabaseAdmin;
        }

        public async Task<ServiceResponse<List<ModelFuncionario>>> GetFuncionariosEmpresa(Guid IdEmpresa)
            => new ServiceResponse<List<ModelFuncionario>>
            {
                Data = await _context.Funcionarios
                    .AsNoTracking()
                    .Where(tb => tb.Estabelecimento.EmpresaId == IdEmpresa)
                    .ToListAsync()
            };

        public async Task<ServiceResponse<ModelFuncionario>> CreateFuncionario(FuncionarioCreateDto funcionarioDto)
        {
            if (!await _context.Estabelecimentos.AsNoTracking().AnyAsync(tb => tb.Id == funcionarioDto.EstabelecimentoId))
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "O estabelecimento vinculado ao funcionário não existe" };

            (SupabaseUserResponse? supabaseUser, string? error) = await _supabaseAdmin.CreateAuthUserAsync(funcionarioDto.Email, funcionarioDto.Password, funcionarioDto.Role);

            if (error != null || supabaseUser is null)
            {
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = $"Erro Supabase: {error}" };
            }

            ModelFuncionario novoFuncionario = new ModelFuncionario
            {
                Id = Guid.Parse(supabaseUser.Id),
                Nome = funcionarioDto.Nome,
                Cpf = funcionarioDto.Cpf,
                Cargo = funcionarioDto.Cargo,
                EstabelecimentoId = funcionarioDto.EstabelecimentoId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Funcionarios.AddAsync(novoFuncionario);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelFuncionario> { Data = novoFuncionario };
        }

        public async Task<ServiceResponse<ModelFuncionario>> UpdateFuncionario(ModelFuncionario funcionarioAtualizado)
        {
            ModelFuncionario? funcionarioBanco = await _context.Funcionarios.FirstOrDefaultAsync(tb => tb.Id == funcionarioAtualizado.Id);
            if (funcionarioBanco is null)
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "Não existe funcionário com esse ID" };

            if (await _context.Funcionarios.AnyAsync(tb => tb.Cpf == funcionarioAtualizado.Cpf && tb.Id != funcionarioAtualizado.Id))
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "Já existe um funcionário cadastrado com esse CPF" };

            if (!await _context.Estabelecimentos.AsNoTracking().AnyAsync(tb => tb.Id == funcionarioAtualizado.EstabelecimentoId))
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "O estabelecimento vinculado ao funcionário não existe" };

            funcionarioBanco.Nome = funcionarioAtualizado.Nome;
            funcionarioBanco.Cpf = funcionarioAtualizado.Cpf;
            funcionarioBanco.Cargo = funcionarioAtualizado.Cargo;
            funcionarioBanco.EstabelecimentoId = funcionarioAtualizado.EstabelecimentoId;

            _context.Update(funcionarioBanco);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelFuncionario> { Data = funcionarioBanco };
        }

        public async Task<ServiceResponse<bool>> DeleteFuncionario(Guid Id)
        {
            ModelFuncionario? funcionarioBanco = await _context.Funcionarios.FirstOrDefaultAsync(tb => tb.Id == Id);

            if (funcionarioBanco is null)
                return new ServiceResponse<bool> { Success = false, ErrorMessage = "Não existe um funcionário cadastrado com esse ID" };

            _context.Remove(funcionarioBanco);
            await _context.SaveChangesAsync();

            return new ServiceResponse<bool> { Data = true };
        }
    }

    // DTO de resposta da API do Supabase Auth
    public class SupabaseUserResponse
    {
        public string Id { get; set; }
        public string? Email { get; set; }
        public Dictionary<string, object>? App_Metadata { get; set; }
    }
}
