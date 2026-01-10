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
                .Where(f => f.EmpresaId == empresaId)
                .OrderBy(f => f.Data)
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
                CreatedAt = DateTime.UtcNow,
                Ativo = true
            };

            await _context.FeriadosPersonalizados.AddAsync(novoFeriado);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelFeriadoPersonalizado> { Data = novoFeriado };
        }

        public async Task<ServiceResponse<bool>> ToggleAtivoAsync(Guid feriadoId)
        {
            ModelFeriadoPersonalizado? feriadoBanco = await _context.FeriadosPersonalizados.FirstOrDefaultAsync(tb => tb.Id == feriadoId);

            if (feriadoBanco is null)
                return new ServiceResponse<bool> { Success = false, ErrorMessage = "Nenhum feriado encontrado com o ID informado" };
            feriadoBanco.Data = DateTime.SpecifyKind(feriadoBanco.Data, DateTimeKind.Utc);
            feriadoBanco.Ativo = !feriadoBanco.Ativo;
            _context.Update(feriadoBanco);
            await _context.SaveChangesAsync();

            return new ServiceResponse<bool> { Data = true };
        }

        public async Task<List<ModelFeriadoPersonalizado>> GetFeriadosParaFuncionarioAsync(Guid empresaId, Guid estabelecimentoId, DateTime inicio, DateTime fim)
        {
            var dataInicio = DateTime.SpecifyKind(inicio.Date, DateTimeKind.Utc);
            var dataFim = DateTime.SpecifyKind(fim.Date, DateTimeKind.Utc);

            var feriados = await _context.FeriadosPersonalizados
                .Where(f =>
                    f.EmpresaId == empresaId && // Tem que ser da mesma empresa
                    f.Ativo && // Tem que estar ativo
                    f.Data >= dataInicio &&
                    f.Data <= dataFim &&
                    (f.EstabelecimentoId == null || f.EstabelecimentoId == estabelecimentoId) // GLOBAL ou LOCAL
                )
                .AsNoTracking()
                .ToListAsync();

            return feriados;
        }
    }
}