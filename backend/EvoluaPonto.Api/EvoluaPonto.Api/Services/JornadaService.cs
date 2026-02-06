using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Enums;
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

        public async Task<ServiceResponse<EspelhoPontoAgrupadoDto>> CalcularEspelhoPontoAgrupadoAsync(Guid funcionarioId, int ano, int mesInicio, int mesFim)
        {
            // Define o período TOTAL (ex: 01/05 a 30/06) para busca no banco
            var dataInicioTotal = new DateTime(ano, mesInicio, 1);
            var dataFimTotal = new DateTime(ano, mesFim, 1).AddMonths(1).AddDays(-1);

            // 1. Buscas no Banco (Mantive sua lógica de includes)
            var funcionario = await _context.Funcionarios
                .Include(f => f.Estabelecimento).ThenInclude(e => e.Empresa)
                .Include(func => func.Escala).ThenInclude(escala => escala.Dias)
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == funcionarioId);

            if (funcionario == null)
                return new ServiceResponse<EspelhoPontoAgrupadoDto> { Success = false, ErrorMessage = "Funcionário não encontrado." };

            if (funcionario.Escala is null)
                return new ServiceResponse<EspelhoPontoAgrupadoDto> { Success = false, ErrorMessage = $"Funcionário: {funcionario.Nome} sem escala cadastrada!." };


            // 2. Feriados e Registros (Busca TOTAL)
            // ... (Sua lógica de busca de feriados aqui, igual ao anterior) ...
            var feriadosDoAno = await ObterFeriadosUnificados(ano, funcionario, dataInicioTotal, dataFimTotal);

            var todosRegistros = await _context.RegistrosPonto
                .Where(r => r.FuncionarioId == funcionarioId 
                    && r.TimestampMarcacao >= dataInicioTotal.ToUniversalTime() 
                    && r.TimestampMarcacao <= dataFimTotal.ToUniversalTime().AddDays(1)
                    && (r.Status == StatusSolicitacao.Aprovado || r.Status == null))
                .OrderBy(r => r.TimestampMarcacao)
                .ToListAsync();

            TimeZoneInfo fusoBrasilia;
            try
            {
                fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
            }
            catch
            {
                fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            }

            // O Select Inteligente
            var todosOsRegistrosConvertido = todosRegistros.Select(r =>
            {
                // CASO 1: É UTC explícito? Converte.
                if (r.TimestampMarcacao.Kind == DateTimeKind.Utc)
                {
                    r.TimestampMarcacao = TimeZoneInfo.ConvertTimeFromUtc(r.TimestampMarcacao, fusoBrasilia);
                }
                // CASO 2: O banco devolveu sem etiqueta (Unspecified)?
                // Assume que é UTC (já que seu banco salva em UTC) e converte.
                else if (r.TimestampMarcacao.Kind == DateTimeKind.Unspecified)
                {
                    var dataCorrigida = DateTime.SpecifyKind(r.TimestampMarcacao, DateTimeKind.Utc);
                    r.TimestampMarcacao = TimeZoneInfo.ConvertTimeFromUtc(dataCorrigida, fusoBrasilia);
                }

                // CASO 3: Se for DateTimeKind.Local, ele ignora e mantem o valor.

                return r;
            }).ToList();

            // 3. Montagem do Objeto de Retorno
            var resultado = new EspelhoPontoAgrupadoDto
            {
                Funcionario = funcionario,
                Estabelecimento = funcionario.Estabelecimento,
                Empresa = funcionario.Estabelecimento.Empresa
            };

            // 4. O LOOP MÁGICO (Itera mês a mês)
            for (int mesAtual = mesInicio; mesAtual <= mesFim; mesAtual++)
            {
                var inicioMes = new DateTime(ano, mesAtual, 1);
                var fimMes = inicioMes.AddMonths(1).AddDays(-1);

                var dtoMes = new EspelhoPontoMensalDto
                {
                    Mes = mesAtual,
                    Ano = ano,
                    PeriodoInicio = inicioMes,
                    PeriodoFim = fimMes
                };

                // Processa cada dia do mês atual
                for (DateTime dia = inicioMes; dia <= fimMes; dia = dia.AddDays(1))
                {
                    var registrosDia = todosOsRegistrosConvertido.Where(r => r.TimestampMarcacao.Date == dia.Date).ToList();

                    // *Extraí a lógica de cálculo do dia para um método privado para não repetir código*
                    var jornada = CalcularJornadaDoDia(dia, registrosDia, feriadosDoAno, funcionario.Escala.Dias);

                    dtoMes.Jornadas.Add(jornada);

                    // Acumuladores Mensais
                    dtoMes.TotalHorasTrabalhadas += jornada.TotalTrabalhado;
                    dtoMes.TotalHorasExtras += jornada.HorasExtras;
                    dtoMes.TotalAtrasos += jornada.HorasFaltas;
                }

                dtoMes.Saldo = dtoMes.TotalHorasExtras - dtoMes.TotalAtrasos;
                resultado.Meses.Add(dtoMes);
            }

            return new ServiceResponse<EspelhoPontoAgrupadoDto> { Data = resultado };
        }

        // Método auxiliar com a sua lógica de cálculo diário (copiada e isolada)
        private JornadaDiaria CalcularJornadaDoDia(DateTime dia, List<ModelRegistroPonto> marcacoes, List<DateTime> feriados, List<ModelEscalaDia> escalasDias)
        {
            var jornada = new JornadaDiaria
            {
                Dia = dia,
                Marcacoes = marcacoes.OrderBy(m => m.TimestampMarcacao).ToList()
            };
            bool isFeriado = feriados.Contains(dia.Date);

            ModelEscalaDia? DiaEscala = escalasDias.FirstOrDefault(tb => tb.DiaSemana == dia.DayOfWeek);

            bool DiaInvalido = DiaEscala is null ? true : DiaEscala.IsFolga;

            TimeSpan cargaHorariaDiaria = (DiaEscala is null || DiaEscala.IsFolga == true) ? TimeSpan.Zero : CalcularHorasDia(DiaEscala);

            // Se não tem marcações
            if (!jornada.Marcacoes.Any())
            {
                if (DiaInvalido) jornada.Observacoes.Add("Folga DSR");
                else if (isFeriado) jornada.Observacoes.Add("Feriado");
                else
                {
                    jornada.Observacoes.Add("Falta Integral");
                    // Se faltou, deve a carga horária inteira (negativo)
                    jornada.HorasFaltas = cargaHorariaDiaria;
                    jornada.SaldoDiario = -cargaHorariaDiaria;
                }
                return jornada;
            }

            // Lógica de cálculo de horas trabalhadas (Pares Entrada/Saída)
            TimeSpan trabalhado = TimeSpan.Zero;

            for (int i = 0; i < jornada.Marcacoes.Count; i += 2)
            {
                if (i + 1 < jornada.Marcacoes.Count)
                {
                    // Temos um par (Entrada e Saída)
                    var entrada = jornada.Marcacoes[i].TimestampMarcacao;
                    var saida = jornada.Marcacoes[i + 1].TimestampMarcacao;
                    trabalhado += (saida - entrada);
                }
                else
                {
                    // Marcação ímpar (esqueceu de bater a saída)
                    jornada.Observacoes.Add("Marcação Ímpar");
                }
            }

            jornada.TotalTrabalhado = trabalhado;

            // Definição da Carga Esperada para o dia
            TimeSpan cargaEsperada = (DiaInvalido || isFeriado) ? TimeSpan.Zero : cargaHorariaDiaria;

            // Cálculo do Saldo (Trabalhado - Esperado)
            var saldo = trabalhado - cargaEsperada;
            jornada.SaldoDiario = saldo;

            if (saldo > TimeSpan.Zero)
            {
                jornada.HorasExtras = saldo;
                jornada.HorasFaltas = TimeSpan.Zero;
            }
            else
            {
                jornada.HorasExtras = TimeSpan.Zero;
                jornada.HorasFaltas = saldo.Duration(); // Duration() torna o negativo em positivo absoluto para exibição
            }

            return jornada;
        }


        private async Task<List<DateTime>> ObterFeriadosUnificados(int ano, ModelFuncionario funcionario, DateTime dataInicio, DateTime dataFim)
        {
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
            return feriadosDoAno;
        }

        private TimeSpan CalcularHorasDia(ModelEscalaDia Dia)
        {
            bool temIntervalo = Dia.SaidaIntervalo.HasValue && Dia.VoltaIntervalo.HasValue;

            if (temIntervalo)
            {
                return (Dia.SaidaIntervalo.Value - Dia.Entrada.Value) + (Dia.Saida.Value - Dia.VoltaIntervalo.Value);
            }
            else
            {
                return Dia.Saida.Value - Dia.Entrada.Value;
            }
        }
    }
}