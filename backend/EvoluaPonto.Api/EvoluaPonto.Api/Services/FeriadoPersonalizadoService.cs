using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;

namespace EvoluaPonto.Api.Services
{
    public class FeriadoPersonalizadoService
    {
        private readonly AppDbContext _context;

        public FeriadoPersonalizadoService(AppDbContext context)
        {
            _context = context;
        }

        // Listar feriados de uma empresa
        public async Task<ServiceResponse<List<ModelFeriadoPersonalizado>>> GetFeriadosByEmpresaAsync(Guid empresaId)
        {
            var feriados = await _context.FeriadosPersonalizados
                .Where(f => f.EmpresaId == empresaId || f.EmpresaId == null)
                .AsNoTracking()
                .ToListAsync();

            return new ServiceResponse<List<ModelFeriadoPersonalizado>> { Data = feriados };
        }

        // Criar um novo feriado
        public async Task<ServiceResponse<ModelFeriadoPersonalizado>> CreateFeriadoAsync(FeriadoPersonalizadoCreateDto dto)
        {
            var novoFeriado = new ModelFeriadoPersonalizado
            {
                Data = dto.Data.Date, // Salva apenas a data, sem a hora
                Descricao = dto.Descricao,
                EmpresaId = dto.EmpresaId,
                EstabelecimentoId = dto.EstabelecimentoId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.FeriadosPersonalizados.AddAsync(novoFeriado);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelFeriadoPersonalizado> { Data = novoFeriado };
        }

        // Deletar um feriado
        public async Task<ServiceResponse<bool>> DeleteFeriadoAsync(Guid id)
        {
            var feriado = await _context.FeriadosPersonalizados.FindAsync(id);

            if (feriado == null)
            {
                return new ServiceResponse<bool> { Success = false, ErrorMessage = "Feriado não encontrado." };
            }

            _context.FeriadosPersonalizados.Remove(feriado);
            await _context.SaveChangesAsync();

            return new ServiceResponse<bool> { Data = true };
        }
    }
}