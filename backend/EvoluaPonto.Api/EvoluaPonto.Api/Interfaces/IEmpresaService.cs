using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;

namespace EvoluaPonto.Api.Interfaces
{
    public interface IEmpresaService
    {
        Task<ServiceResponse<ModelEmpresa>> GetByIdAsync(Guid Id);
        Task<ServiceResponse<ModelEmpresa>> CreateAsync(ModelEmpresa NovaEmpresa);
        Task<ServiceResponse<ModelEmpresa>> UpdateAsync(ModelEmpresa EmpresaAtualizada);
    }
}
