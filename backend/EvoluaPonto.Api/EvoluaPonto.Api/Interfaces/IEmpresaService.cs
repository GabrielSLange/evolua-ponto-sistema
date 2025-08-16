using EvoluaPonto.Api.Models;

namespace EvoluaPonto.Api.Interfaces
{
    public interface IEmpresaService
    {
        Task<ModelEmpresa?> GetByIdAsync(Guid Id);
        Task<ModelEmpresa> CreateAsync(ModelEmpresa NovaEmpresa);
    }
}
