using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;

namespace EvoluaPonto.Api.Services
{
    public class JornadaService
    {
        private readonly AppDbContext _context;

        public JornadaService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResponse<EspelhoPontoDto>> CalcularEspelhoPontoAsync(Guid funcionarioId, int ano, int mes)
        {
            var dataInicio = new DateTime(ano, mes, 1);
            var dataFim = dataInicio.AddMonths(1).AddDays(-1);

            var funcionario = await _context.Funcionarios
                .Include(f => f.Estabelecimento)
                .ThenInclude(e => e.Empresa)
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == funcionarioId);

            if (funcionario == null)
            {
                return new ServiceResponse<EspelhoPontoDto> { Success = false, ErrorMessage = "Funcionário não encontrado." };
            }

            var registros = await _context.RegistrosPonto
                .Where(r => r.FuncionarioId == funcionarioId && r.TimestampMarcacao >= dataInicio.ToUniversalTime() && r.TimestampMarcacao <= dataFim.ToUniversalTime())
                .OrderBy(r => r.TimestampMarcacao)
                .ToListAsync();

            var espelhoPonto = new EspelhoPontoDto
            {
                Funcionario = funcionario,
                Estabelecimento = funcionario.Estabelecimento,
                Empresa = funcionario.Estabelecimento.Empresa,
                PeriodoInicio = dataInicio,
                PeriodoFim = dataFim
            };

            var registrosPorDia = registros.GroupBy(r => r.TimestampMarcacao.Date);

            foreach (var grupoDia in registrosPorDia)
            {
                var jornadaDiaria = new JornadaDiaria { Dia = grupoDia.Key };
                var marcacoesDoDia = grupoDia.ToList();

                // Lógica simples para parear entradas e saídas
                for (int i = 0; i < marcacoesDoDia.Count; i += 2)
                {
                    var entrada = marcacoesDoDia[i];
                    var saida = (i + 1 < marcacoesDoDia.Count) ? marcacoesDoDia[i + 1] : null;

                    if (entrada.Tipo.ToLower() == "entrada")
                    {
                        var par = new ParMarcacao { Entrada = entrada.TimestampMarcacao };
                        if (saida != null && saida.Tipo.ToLower() == "saida")
                        {
                            par.Saida = saida.TimestampMarcacao;
                            jornadaDiaria.TotalTrabalhado += (par.Saida.Value - par.Entrada.Value);
                        }
                        jornadaDiaria.Marcacoes.Add(par);
                    }
                }
                espelhoPonto.Jornadas.Add(jornadaDiaria);
            }

            // Futuramente, adicionaremos os cálculos de horas extras, atrasos e totais do mês aqui...

            return new ServiceResponse<EspelhoPontoDto> { Data = espelhoPonto };
        }
    }
}