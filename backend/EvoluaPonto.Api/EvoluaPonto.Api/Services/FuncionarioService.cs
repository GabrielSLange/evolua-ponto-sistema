using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using EvoluaPonto.Api.Services.External;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

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

        public async Task<ServiceResponse<List<ModelFuncionario>>> GetFuncionariosEmpresa(Guid empresaId)
            => new ServiceResponse<List<ModelFuncionario>>
            {
                Data = await _context.Funcionarios
                .AsNoTracking()
                .Where(tb => tb.Estabelecimento.EmpresaId == empresaId)
                .ToListAsync()
            };

        public async Task<ServiceResponse<List<ModelFuncionario>>> GetFuncionariosEstabelecimento(Guid estabelecimentoId)
            => new ServiceResponse<List<ModelFuncionario>>
            {
                Data = await _context.Funcionarios
                .AsNoTracking()
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

            (SupabaseUserResponse? supabaseUser, string? error) = await _supabaseAdmin.GetByIdAsync(funcionario.Id.ToString());

            if (error != null || supabaseUser is null)
            {
                return new ServiceResponse<FuncionarioDto> { Success = false, ErrorMessage = $"Erro Supabase: {error}" };
            }

            FuncionarioDto funcionarioDto = new FuncionarioDto
            {
                Id = funcionario.Id,
                Nome = funcionario.Nome,
                Cpf = funcionario.Cpf,
                Cargo = funcionario.Cargo,
                HorarioContratual = funcionario.HorarioContratual,
                Ativo = funcionario.Ativo,
                EstabelecimentoId = funcionario.EstabelecimentoId,
                Estabelecimento = funcionario.Estabelecimento,
                Email = supabaseUser.Email,
                Role = supabaseUser.App_Metadata["role"].ToString(),
            };

            return new ServiceResponse<FuncionarioDto> { Data = funcionarioDto };
        }

        public async Task<ServiceResponse<ModelFuncionario>> CriarFuncionarioComAcesso(FuncionarioDto dto)
        {
            var response = new ServiceResponse<ModelFuncionario>();

            // 1. Validações Básicas
            if (await _context.Funcionarios.AnyAsync(tb => tb.Cpf == dto.Cpf))
            {
                response.Success = false;
                response.ErrorMessage = "Já existe um funcionário com este CPF.";
                return response;
            }

            if (await _context.Usuarios.AnyAsync(tb => tb.Login == dto.Email))
            {
                response.Success = false;
                response.ErrorMessage = "Este e-mail já está em uso por outro usuário.";
                return response;
            }

            // 2. Inicia a Transação (Tudo ou Nada)
            using (IDbContextTransaction transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // A. Cria o Funcionário (RH)
                    var novoFuncionario = new ModelFuncionario
                    {
                        Id = Guid.NewGuid(),
                        Nome = dto.Nome,
                        Cpf = dto.Cpf,
                        Cargo = dto.Cargo,
                        HorarioContratual = dto.HorarioContratual,
                        EstabelecimentoId = dto.EstabelecimentoId,
                        Ativo = true
                    };

                    _context.Funcionarios.Add(novoFuncionario);
                    await _context.SaveChangesAsync(); // Salva para garantir que o ID exista

                    // B. Cria o Usuário (Acesso)
                    string senhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

                    var novoUsuario = new Usuario
                    {
                        Id = Guid.NewGuid(),
                        Login = dto.Email, // Usamos o email como login
                        SenhaHash = senhaHash,
                        Perfil = dto.Role, // Admin/Colaborador
                        FuncionarioId = novoFuncionario.Id, // Vínculo Importante!
                        AcessoPermitido = true
                    };

                    _context.Usuarios.Add(novoUsuario);
                    await _context.SaveChangesAsync();

                    // C. Confirma tudo
                    await transaction.CommitAsync();

                    response.Data = novoFuncionario;
                    response.ErrorMessage = "Funcionário e acesso criados com sucesso!";
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    response.Success = false;
                    response.ErrorMessage = $"Erro ao criar funcionário: {ex.Message}";
                }
            }

            return response;
        }

        public async Task<ServiceResponse<ModelFuncionario>> CreateFuncionario(FuncionarioDto funcionarioDto)
        {
            if (!await _context.Estabelecimentos.AsNoTracking().AnyAsync(tb => tb.Id == funcionarioDto.EstabelecimentoId))
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "O estabelecimento vinculado ao funcionário não existe" };

            // Validação: A senha é obrigatória apenas na criação de um novo funcionário.
            if (string.IsNullOrWhiteSpace(funcionarioDto.Password))
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "A senha é obrigatória para criar um novo funcionário." };

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
                HorarioContratual = funcionarioDto.HorarioContratual,
                EstabelecimentoId = funcionarioDto.EstabelecimentoId,
                CreatedAt = DateTime.UtcNow,
                Ativo = true
            };

            await _context.Funcionarios.AddAsync(novoFuncionario);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelFuncionario> { Data = novoFuncionario };
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

            (SupabaseUserResponse? supabaseUser, string? error) = await _supabaseAdmin.UpdateAuthUserAsync(funcionarioAtualizado.Id.ToString(), funcionarioAtualizado.Email, funcionarioAtualizado.Role);

            if (error != null || supabaseUser is null)
            {
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = $"Erro Supabase: {error}" };
            }

            funcionarioBanco.Nome = funcionarioAtualizado.Nome;
            funcionarioBanco.Cpf = funcionarioAtualizado.Cpf;
            funcionarioBanco.Cargo = funcionarioAtualizado.Cargo;
            funcionarioBanco.HorarioContratual = funcionarioAtualizado.HorarioContratual;
            funcionarioBanco.EstabelecimentoId = funcionarioAtualizado.EstabelecimentoId;

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

    // DTO de resposta da API do Supabase Auth
    public class SupabaseUserResponse
    {
        public string Id { get; set; }
        public string? Email { get; set; }
        public Dictionary<string, object>? App_Metadata { get; set; }
    }
}
