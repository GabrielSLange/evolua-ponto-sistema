using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;

namespace EvoluaPonto.Api.Services
{
    public class EmpresaService
    {
        private readonly AppDbContext _context;

        public EmpresaService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResponse<ModelEmpresa>> GetByIdAsync(Guid Id) => new ServiceResponse<ModelEmpresa> { Data = await _context.Empresas.AsNoTracking().FirstOrDefaultAsync(tb => tb.Id == Id) };

        public async Task<ServiceResponse<List<ModelEmpresa>>> GetAsync() => new ServiceResponse<List<ModelEmpresa>> { Data = await _context.Empresas.AsNoTracking().ToListAsync() };

        public async Task<ServiceResponse<ModelEmpresa>> CreateAsync(ModelEmpresa NovaEmpresa)
        {
            ModelEmpresa? EmpresaBanco = await _context.Empresas.AsNoTracking().FirstOrDefaultAsync(tb => tb.Cnpj == NovaEmpresa.Cnpj);

            if (EmpresaBanco is not null)
            {
                return new ServiceResponse<ModelEmpresa>
                {
                    Success = false,
                    ErrorMessage = "Já existe uma empresa cadastrada com esse CNPJ"
                };

            }

            NovaEmpresa.Id = Guid.NewGuid();
            NovaEmpresa.CreatedAt = DateTime.UtcNow;

            await _context.Empresas.AddAsync(NovaEmpresa);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelEmpresa> {
                Data = NovaEmpresa 
            };
        }

        public async Task<ServiceResponse<ModelEmpresa>> UpdateAsync(ModelEmpresa EmpresaAtualizada)
        {
            ModelEmpresa? EmpresaBanco = await _context.Empresas.FirstOrDefaultAsync(tb => tb.Id == EmpresaAtualizada.Id);

            if (EmpresaBanco is null) { return new ServiceResponse<ModelEmpresa> { Success = false, ErrorMessage = "Não existe uma empresa com esse ID" }; }



            if (await _context.Empresas.AsNoTracking().AnyAsync(tb => tb.Cnpj == EmpresaAtualizada.Cnpj && tb.Id != EmpresaAtualizada.Id )) { return new ServiceResponse<ModelEmpresa> { Success = false, ErrorMessage = "Já existe uma empresa cadastrada com esse CNPJ" }; }

            EmpresaBanco.RazaoSocial = EmpresaAtualizada.RazaoSocial;

            _context.Update(EmpresaBanco);
            await _context.SaveChangesAsync();

           return new ServiceResponse<ModelEmpresa> { Data = EmpresaBanco };
        }        
    
        public async Task<ServiceResponse<bool>> ToggleAtivoAsync(Guid idEmpresa)
        {
            ModelEmpresa? empresaBanco = await _context.Empresas.FirstOrDefaultAsync(tb => tb.Id  == idEmpresa);

            if(empresaBanco == null)
                return new ServiceResponse<bool> { Success = false, ErrorMessage = "Empresa não encontrada no banco" };

            empresaBanco.Ativo = !empresaBanco.Ativo;
            _context.Update(empresaBanco);
            await _context.SaveChangesAsync();

            return new ServiceResponse<bool> { Data = true };
        }
    }
}
