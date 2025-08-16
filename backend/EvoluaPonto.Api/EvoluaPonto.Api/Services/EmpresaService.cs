using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Interfaces;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;

namespace EvoluaPonto.Api.Services
{
    public class EmpresaService : IEmpresaService
    {
        private readonly AppDbContext _context;

        public EmpresaService(AppDbContext context)
        {
            _context = context;
        }

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

        public async Task<ServiceResponse<ModelEmpresa>> GetByIdAsync(Guid Id) => new ServiceResponse<ModelEmpresa> { Data = await _context.Empresas.AsNoTracking().FirstOrDefaultAsync(tb => tb.Id == Id) };
    }
}
