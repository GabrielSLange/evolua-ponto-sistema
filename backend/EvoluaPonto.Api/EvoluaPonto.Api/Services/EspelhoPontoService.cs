using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models.Enums;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using System.Globalization;

namespace EvoluaPonto.Api.Services
{
    public class EspelhoPontoService
    {
        private readonly AppDbContext _context;
        private readonly FeriadoService _feriadoService;
        private readonly FeriadoPersonalizadoService _feriadoPersonalizadoService;

        public EspelhoPontoService(AppDbContext context, FeriadoService feriadoService, FeriadoPersonalizadoService feriadoPersonalizadoService)
        {
            _context = context;
            _feriadoService = feriadoService;
            _feriadoPersonalizadoService = feriadoPersonalizadoService;
        }

        // MUDANÇA: O parâmetro agora é EspelhoPontoAgrupadoDto
        public byte[] GerarEspelhoPontoPDF(EspelhoPontoAgrupadoDto dadosEspelho)
        {
            // O EspelhoPontoDocument que criamos anteriormente já espera esse tipo novo
            var document = new EspelhoPontoDocument(dadosEspelho);

            return document.GeneratePdf();
        }

        public async Task<ServiceResponse<EspelhoHomeResponseDto>> GetEspelhoHomeAsync(Guid funcionarioId)
        {
            var response = new ServiceResponse<EspelhoHomeResponseDto>();

            try
            {
                // Definir o período (Mês Atual)
                var hoje = DateTime.Now.Date;
                var primeiroDiaMes = new DateTime(hoje.Year, hoje.Month, 1);
                var ultimoDiaMes = primeiroDiaMes.AddMonths(1).AddDays(-1);

                var funcionario = await _context.Funcionarios
                    .Include(f => f.Estabelecimento)
                    .Include(f => f.Escala)
                        .ThenInclude(e => e.Dias)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(f => f.Id == funcionarioId);

                if (funcionario == null)
                {
                    response.Success = false;
                    response.ErrorMessage = "Funcionário não encontrado.";
                    return response;
                }

                // Busca Feriados (com cache)
                // Define uma cheve única para o cache (ex: "Feriados_2025")
                string cacheKey = $"Feriados_nacionais_{hoje.Year}";

                // Tenta pegar do cache. Se não existir, roda a função dentro do 'GetOrCreateAsync'
                var feriadosNacionais = await _feriadoService.GetFeriadosNacionaisAsync(hoje.Year);

                // Feriados personalizados
                var datasFeriadosPersonalizados = new List<DateTime>();

                var feriadosDb = await _feriadoPersonalizadoService.GetFeriadosParaFuncionarioAsync(
                    funcionario.Estabelecimento.EmpresaId,
                    funcionario.EstabelecimentoId,
                    primeiroDiaMes,
                    ultimoDiaMes);

                datasFeriadosPersonalizados = feriadosDb.Select(f => f.Data.Date).ToList();

                // Merge dos feriados nacionais com os personalizados
                var datasFeriados = feriadosNacionais
                    .Select(f => DateTime.Parse(f.Data).Date) // Converte String -> DateTime
                    .Concat(datasFeriadosPersonalizados)
                    .ToHashSet();

                // Buscar registros do funcionário neste período
                // Trazemos apenas o necessário do banco
                var registros = await _context.RegistrosPonto
                    .Where(r => r.FuncionarioId == funcionarioId
                             && r.TimestampMarcacao >= primeiroDiaMes.ToUniversalTime()
                             && r.TimestampMarcacao <= ultimoDiaMes.AddDays(1).ToUniversalTime()
                             && r.Status != StatusSolicitacao.Rejeitado) // Não mostramos rejeitados no espelho oficial
                    .OrderBy(r => r.TimestampMarcacao)
                    .ToListAsync();

                // Preparar o DTO de resposta
                var espelho = new EspelhoHomeResponseDto
                {
                    MesReferencia = primeiroDiaMes.ToString("MMMM/yyyy", new CultureInfo("pt-BR")),
                    SaldoPrevisto = "00:00" // Cálculo de saldo requer regras de Jornada complexas, deixamos zerado por enquanto
                };

                // Iterar dia a dia para montar o calendário (inclusive dias sem ponto)
                for (var dia = primeiroDiaMes; dia <= ultimoDiaMes; dia = dia.AddDays(1))
                {
                    // Filtra registros deste dia específico (convertendo UTC para Local)
                    var registrosDoDia = registros
                        .Where(r => r.TimestampMarcacao.ToLocalTime().Date == dia)
                        .OrderBy(r => r.TimestampMarcacao)
                        .ToList();

                    // Verificação uninficada de feriado
                    var isFeriado = datasFeriados.Contains(dia.Date);

                    var isFolga = false;

                    if (!isFeriado)
                    {
                        if (funcionario.Escala != null && funcionario.Escala.Dias.Any())
                        {
                            // Se tem escala: respeita a regra
                            var regraDia = funcionario.Escala.Dias.FirstOrDefault(d => d.DiaSemana == dia.DayOfWeek);

                            // Se existe regra para o dia e não está marcado como folga
                            if (regraDia != null && !regraDia.IsFolga)
                            {
                                isFolga = false;
                            }
                            else
                            {
                                // Se a regra diz IsFolga=true ou não tem regra
                                isFolga = true;
                            }
                        }
                        else
                        {
                            // Fallback (Sem Escala): Mantém a lógica antiga para legados
                            // Sabado e Domingo = Folga
                            if (dia.DayOfWeek == DayOfWeek.Saturday || dia.DayOfWeek == DayOfWeek.Sunday)
                                isFolga = true;
                            else
                                isFolga = false;
                        }
                    }

                    TimeZoneInfo fusoBrasilia;
                    try
                    {
                        fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
                    }
                    catch
                    {
                        fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
                    }

                    var diaDto = new DiaEspelhoHomeDto
                    {
                        Data = dia,
                        DiaSemana = dia.ToString("ddd", new CultureInfo("pt-BR")).ToUpper(), // SEG, TER...
                        IsFolga = isFolga,
                        IsFeriado = isFeriado,
                        IsHoje = dia == hoje,
                        Marcacoes = registrosDoDia.Select(r => new PontoHomeDto
                        {
                            Id = r.Id,
                            Hora = TimeZoneInfo.ConvertTimeFromUtc(r.TimestampMarcacao, fusoBrasilia).ToString("HH:mm"),
                            Tipo = r.Tipo.ToString(), // ENTRADA, SAIDA
                            IsManual = r.RegistroManual,
                            StatusSolicitacao = r.Status.ToString() // Pendente/Aprovado
                        }).ToList()
                    };

                    // Lógica simples de Status do Dia para exibir cor/alerta no Front
                    if (registrosDoDia.Any())
                    {
                        // Se tem registros, verificamos se é par (entrada+saida) ou ímpar (incompleto)
                        diaDto.Status = registrosDoDia.Count % 2 == 0 ? "Completo" : "Incompleto";
                    }
                    else
                    {
                        // Sem registros
                        if (dia > hoje)
                        {
                            diaDto.Status = "Futuro"; // Dias que ainda não chegaram
                        }
                        else if (isFolga || isFeriado)
                        {
                            diaDto.Status = "Folga";
                        }
                        else
                        {
                            diaDto.Status = "Falta"; // Dia útil passado sem registro
                        }
                    }

                    espelho.Dias.Add(diaDto);
                }

                // Ordenação: Dias mais recentes primeiro (melhor para Mobile) ou cronológico?
                // Para "Espelho", cronológico (1..30) costuma ser melhor, mas no mobile, 
                // ver o dia de hoje no topo ajuda. Vamos inverter.
                espelho.Dias.Reverse();

                response.Data = espelho;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.ErrorMessage = "Erro ao gerar espelho: " + ex.Message;
            }

            return response;
        }
    }
}