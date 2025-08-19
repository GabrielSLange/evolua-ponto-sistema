using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;

namespace EvoluaPonto.Api.Services
{
    public class FuncionarioService
    {
        private readonly AppDbContext _context;

        public FuncionarioService(AppDbContext context)
        {
            _context = context;            
        }

        public async Task<ServiceResponse<List<ModelFuncionario>>> GetFuncionariosEmpresa(Guid IdEmpresa) 
            => new ServiceResponse<List<ModelFuncionario>> { Data = await _context.Funcionarios.AsNoTracking().Where(tb => tb.EmpresaId == IdEmpresa).ToListAsync() };

        public async Task<ServiceResponse<ModelFuncionario>> CreateFuncionario(ModelFuncionario novoFuncionario)
        {
            if (await _context.Funcionarios.AnyAsync(tb => tb.Cpf == novoFuncionario.Cpf))
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "Já existe um funcionário cadastrado com esse CPF" };

            if (!await _context.Empresas.AnyAsync(tb => tb.Id == novoFuncionario.EmpresaId))
                return new ServiceResponse<ModelFuncionario> { Success = false, ErrorMessage = "Não existe nenhuma empresa com o ID passado" };

            novoFuncionario.Id = Guid.NewGuid();
            novoFuncionario.CreatedAt = DateTime.UtcNow;

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

            funcionarioBanco.Nome = funcionarioAtualizado.Nome;
            funcionarioBanco.Cpf = funcionarioAtualizado.Cpf;
            funcionarioBanco.Cargo = funcionarioAtualizado.Cargo;

            _context.Update(funcionarioBanco);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelFuncionario> { Data =  funcionarioBanco };
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
}
