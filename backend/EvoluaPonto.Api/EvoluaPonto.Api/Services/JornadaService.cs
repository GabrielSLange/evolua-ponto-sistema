using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace EvoluaPonto.Api.Services
{
    public class JornadaService
    {
        private readonly AppDbContext _context;
        private readonly FeriadoService _feriadoService;

        public JornadaService(AppDbContext context, FeriadoService feriadoService)
        {
            _context = context;
            _feriadoService = feriadoService;
        }

        public async Task<ServiceResponse<EspelhoPontoDto>> CalcularEspelhoPontoAsync(Guid funcionarioId, int ano, int mes)
        {
            var dataInicio = new DateTime(ano, mes, 1, 0, 0, 0, DateTimeKind.Utc);
            var dataFim = dataInicio.AddMonths(1).AddTicks(-1);

            var funcionario = await _context.Funcionarios
                .Include(f => f.Estabelecimento)
                .ThenInclude(e => e.Empresa)
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == funcionarioId);

            if (funcionario == null)
            {
                return new ServiceResponse<EspelhoPontoDto> { Success = false, ErrorMessage = "Funcionário não encontrado." };
            }

            // --- LÓGICA DE FERIADOS UNIFICADA ---

            // 1. Busca feriados nacionais da API
            var feriadosDoAno = new List<DateTime>();
            var feriadosNacionaisDto = await _feriadoService.GetFeriadosNacionaisAsync(ano);
            if (feriadosNacionaisDto != null)
            {
                feriadosDoAno.AddRange(feriadosNacionaisDto
                    .Select(f => DateTime.TryParse(f.Data, CultureInfo.InvariantCulture, out var data) ? data.Date : (DateTime?)null)
                    .Where(d => d.HasValue)
                    .Select(d => d.Value));
            }

            // **MUDANÇA:** 2. Busca feriados personalizados do banco de dados
            var feriadosPersonalizados = await _context.FeriadosPersonalizados
                .Where(f => f.Data.Year == ano &&
                            (f.EmpresaId == null || f.EmpresaId == funcionario.Estabelecimento.EmpresaId) &&
                            (f.EstabelecimentoId == null || f.EstabelecimentoId == funcionario.EstabelecimentoId))
                .AsNoTracking()
                .ToListAsync();

            // 3. Unifica as listas, removendo duplicatas caso existam
            feriadosDoAno.AddRange(feriadosPersonalizados.Select(f => f.Data.Date));
            feriadosDoAno = feriadosDoAno.Distinct().ToList();

            // --- FIM DA LÓGICA DE FERIADOS ---


            if (string.IsNullOrEmpty(funcionario.HorarioContratual))
            {
                return new ServiceResponse<EspelhoPontoDto> { Success = false, ErrorMessage = "Funcionário não possui horário contratual definido." };
            }

            var registros = await _context.RegistrosPonto
                .Where(r => r.FuncionarioId == funcionarioId && r.TimestampMarcacao >= dataInicio && r.TimestampMarcacao <= dataFim)
                .OrderBy(r => r.TimestampMarcacao)
                .ToListAsync();

            var espelhoPonto = new EspelhoPontoDto
            {
                Funcionario = funcionario,
                Estabelecimento = funcionario.Estabelecimento,
                Empresa = funcionario.Estabelecimento.Empresa,
                PeriodoInicio = dataInicio.Date,
                PeriodoFim = dataFim.Date
            };

            var horariosContratuais = ParseHorarioContratual(funcionario.HorarioContratual);
            if (horariosContratuais.Count == 0)
            {
                return new ServiceResponse<EspelhoPontoDto> { Success = false, ErrorMessage = "Formato do horário contratual é inválido. Use 'HH:mm-HH:mm-HH:mm-HH:mm'." };
            }

            TimeSpan totalHorasTrabalhadasMes = TimeSpan.Zero;
            TimeSpan totalHorasExtrasMes = TimeSpan.Zero;
            TimeSpan totalAtrasosMes = TimeSpan.Zero;
            TimeSpan horasContratuaisNoDia = (horariosContratuais[0].Saida - horariosContratuais[0].Entrada) + (horariosContratuais[1].Saida - horariosContratuais[1].Entrada);

            for (DateTime diaCorrente = dataInicio.Date; diaCorrente <= dataFim.Date; diaCorrente = diaCorrente.AddDays(1))
            {
                var marcacoesDoDia = registros
                    .Where(r => r.TimestampMarcacao.Date == diaCorrente.Date)
                    .OrderBy(r => r.TimestampMarcacao)
                    .ToList();

                var jornadaDiaria = new JornadaDiaria { Dia = diaCorrente.Date };

                bool isFimDeSemana = diaCorrente.DayOfWeek == DayOfWeek.Saturday || diaCorrente.DayOfWeek == DayOfWeek.Sunday;
                bool isFeriado = feriadosDoAno.Contains(diaCorrente.Date);

                if ((isFimDeSemana || isFeriado) && !marcacoesDoDia.Any())
                {
                    if (isFeriado) jornadaDiaria.Observacoes.Add("Feriado");
                    espelhoPonto.Jornadas.Add(jornadaDiaria);
                    continue;
                }

                if (marcacoesDoDia.Count % 2 != 0)
                {
                    jornadaDiaria.Observacoes.Add("Marcação ímpar: Verifique esquecimento de registro.");
                }

                TimeSpan totalTrabalhadoNoDia = TimeSpan.Zero;

                for (int i = 0; i < marcacoesDoDia.Count; i += 2)
                {
                    var entrada = marcacoesDoDia[i];
                    var saida = (i + 1 < marcacoesDoDia.Count) ? marcacoesDoDia[i + 1] : null;

                    var par = new ParMarcacao { Entrada = entrada.TimestampMarcacao };
                    if (saida != null && saida.Tipo.ToLower() == "saida" && entrada.Tipo.ToLower() == "entrada")
                    {
                        par.Saida = saida.TimestampMarcacao;
                        totalTrabalhadoNoDia += (par.Saida.Value - par.Entrada.Value);
                    }
                    jornadaDiaria.Marcacoes.Add(par);
                }
                jornadaDiaria.TotalTrabalhado = totalTrabalhadoNoDia;

                if (totalTrabalhadoNoDia > horasContratuaisNoDia)
                {
                    jornadaDiaria.HorasExtras = totalTrabalhadoNoDia - horasContratuaisNoDia;
                }
                else if (totalTrabalhadoNoDia < horasContratuaisNoDia && marcacoesDoDia.Any())
                {
                    jornadaDiaria.Atrasos = horasContratuaisNoDia - totalTrabalhadoNoDia;
                }
                else if (totalTrabalhadoNoDia == TimeSpan.Zero && !isFimDeSemana && !isFeriado)
                {
                    jornadaDiaria.Atrasos = horasContratuaisNoDia;
                    if (!marcacoesDoDia.Any()) jornadaDiaria.Observacoes.Add("Falta");
                }

                espelhoPonto.Jornadas.Add(jornadaDiaria);

                totalHorasTrabalhadasMes += jornadaDiaria.TotalTrabalhado;
                totalHorasExtrasMes += jornadaDiaria.HorasExtras;
                totalAtrasosMes += jornadaDiaria.Atrasos;
            }

            espelhoPonto.TotalHorasTrabalhadasMes = totalHorasTrabalhadasMes;
            espelhoPonto.TotalHorasExtrasMes = totalHorasExtrasMes;
            espelhoPonto.TotalAtrasosMes = totalAtrasosMes;
            espelhoPonto.SaldoMes = totalHorasExtrasMes - totalAtrasosMes;

            return new ServiceResponse<EspelhoPontoDto> { Data = espelhoPonto };
        }

        private List<(TimeSpan Entrada, TimeSpan Saida)> ParseHorarioContratual(string horarioContratual)
        {
            var pares = new List<(TimeSpan, TimeSpan)>();
            var horarios = horarioContratual.Split('-');

            if (horarios.Length != 4) return pares;

            try
            {
                pares.Add((TimeSpan.Parse(horarios[0]), TimeSpan.Parse(horarios[1])));
                pares.Add((TimeSpan.Parse(horarios[2]), TimeSpan.Parse(horarios[3])));
            }
            catch (FormatException)
            {
                return new List<(TimeSpan, TimeSpan)>();
            }

            return pares;
        }
    }
}