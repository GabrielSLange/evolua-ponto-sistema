using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Interfaces;
using EvoluaPonto.Api.Models;
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

        public async Task<ModelEmpresa> CreateAsync(ModelEmpresa NovaEmpresa)
        {
            NovaEmpresa.Id = Guid.NewGuid();
            NovaEmpresa.CreatedAt = DateTime.UtcNow;

            await _context.Empresas.AddAsync(NovaEmpresa);
            await _context.SaveChangesAsync();

            return NovaEmpresa;
        }

        public async Task<ModelEmpresa?> GetByIdAsync(Guid Id) => await _context.Empresas.AsNoTracking().FirstOrDefaultAsync(tb => tb.Id == Id);
    }
}
