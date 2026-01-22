using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;

namespace EvoluaPonto.Api.Services
{
    public class EscalaService
    {
        private readonly AppDbContext _context;

        public EscalaService(AppDbContext context)
        {
            _context = context;
        }

        // Listar Escalas da Empresa
        public async Task<ServiceResponse<List<ModelEscala>>> GetEscalasByEmpresaAsync(Guid empresaId)
        {
            var escalas = await _context.Escalas
                // Incluímos os dias para exibir detalhes na tela se precisar
                .Include(e => e.Dias.OrderBy(d => d.DiaSemana))
                .Where(e => e.EmpresaId == empresaId && e.Ativo)
                .AsNoTracking()
                .ToListAsync();

            return new ServiceResponse<List<ModelEscala>> { Data = escalas };
        }

        // Obter Escala por ID (para edição)
        public async Task<ServiceResponse<ModelEscala>> GetEscalaByIdAsync(Guid id)
        {
            var escala = await _context.Escalas
                .Include(e => e.Dias.OrderBy(d => d.DiaSemana))
                .FirstOrDefaultAsync(e => e.Id == id);

            if (escala == null)
                return new ServiceResponse<ModelEscala> { Success = false, ErrorMessage = "Escala não encontrada." };

            return new ServiceResponse<ModelEscala> { Data = escala };
        }

        // Criar Nova Escala
        public async Task<ServiceResponse<ModelEscala>> CreateEscalaAsync(EscalaCreateDto dto)
        {
            try
            {
                var novaEscala = new ModelEscala
                {
                    Nome = dto.Nome,
                    CargaHorariaSemanal = dto.CargaHorariaSemanal,
                    EmpresaId = dto.EmpresaId,
                    Ativo = true,
                    CreatedAt = DateTime.UtcNow,
                    // Mapeia a lista de DTOs para Models
                    Dias = dto.Dias.Select(d => new ModelEscalaDia
                    {
                        DiaSemana = (DayOfWeek)d.DiaSemana,
                        IsFolga = d.IsFolga,
                        Entrada = d.Entrada,
                        SaidaIntervalo = d.SaidaIntervalo,
                        VoltaIntervalo = d.VoltaIntervalo,
                        Saida = d.Saida
                    }).ToList()
                };

                _context.Escalas.Add(novaEscala);
                await _context.SaveChangesAsync();

                return new ServiceResponse<ModelEscala> { Data = novaEscala };
            }
            catch (Exception ex)
            {
                return new ServiceResponse<ModelEscala> { Success = false, ErrorMessage = "Erro ao criar escala: " + ex.Message };
            }
        }

        // Atualizar Escala (somente o nome)
        public async Task<ServiceResponse<ModelEscala>> UpdateEscalaAsync(Guid id, EscalaCreateDto dto)
        {
            var escalaDb = await _context.Escalas
                .FirstOrDefaultAsync(e => e.Id == id);

            if (escalaDb == null)
                return new ServiceResponse<ModelEscala> { Success = false, ErrorMessage = "Escala não encontrada." };

            // Atualiza dados básicos
            escalaDb.Nome = dto.Nome;

            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelEscala> { Data = escalaDb };
        }
    }
}