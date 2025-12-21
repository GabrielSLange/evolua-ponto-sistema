using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace EvoluaPonto.Api.Services
{
    public class AejService
    {
        private readonly AppDbContext _context;
        private readonly JornadaService _jornadaService;

        public AejService(AppDbContext context, JornadaService jornadaService)
        {
            _context = context;
            _jornadaService = jornadaService;
        }

        public async Task<string> GerarAejAsync(Guid estabelecimentoId, DateTime dataInicio, DateTime dataFim)
        {
            var estabelecimento = await _context.Estabelecimentos
                .Include(e => e.Empresa)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == estabelecimentoId);

            if (estabelecimento == null) throw new Exception("Estabelecimento não encontrado.");

            var funcionarios = await _context.Funcionarios
                .Where(f => f.EstabelecimentoId == estabelecimentoId)
                .ToListAsync();

            var sb = new StringBuilder();
            long numeroSequencial = 1;

            // Registro 10: Cabeçalho
            sb.AppendLine(GerarRegistro10(numeroSequencial++, estabelecimento, dataInicio, dataFim));

            // Registro 20: Empregador
            sb.AppendLine(GerarRegistro20(numeroSequencial++, estabelecimento.Empresa));

            foreach (var funcionario in funcionarios)
            {
                // MUDANÇA: Chamamos o método novo "Agrupado"
                // Nota: Passamos Month e Year baseados no range solicitado
                var espelhoResponse = await _jornadaService.CalcularEspelhoPontoAgrupadoAsync(
                    funcionario.Id,
                    dataInicio.Year,
                    dataInicio.Month,
                    dataFim.Month
                );

                if (espelhoResponse.Success && espelhoResponse.Data != null)
                {
                    var dadosAgrupados = espelhoResponse.Data;

                    // Registro 30: Empregado
                    sb.AppendLine(GerarRegistro30(numeroSequencial++, funcionario));

                    // Registro 40: Horários Contratuais
                    sb.AppendLine(GerarRegistro40(numeroSequencial++, funcionario));

                    // Registro 50: Totalizadores do Período
                    // MUDANÇA: Passamos o objeto agrupado inteiro para calcular a soma interna
                    sb.AppendLine(GerarRegistro50(numeroSequencial++, dadosAgrupados));
                }
            }

            // Registro 90: Trailer
            sb.AppendLine(GerarRegistro90(numeroSequencial));

            return sb.ToString();
        }

        // --- Métodos Auxiliares ---

        private string GerarRegistro10(long nsr, ModelEstabelecimento estab, DateTime inicio, DateTime fim)
        {
            return "10" +
                   nsr.ToString().PadLeft(9, '0') +
                   "1" +
                   (estab.Empresa.Cnpj ?? "").PadRight(14) +
                   inicio.ToString("ddMMyyyy") +
                   fim.ToString("ddMMyyyy") +
                   DateTime.Now.ToString("ddMMyyyy") +
                   DateTime.Now.ToString("HHmm");
        }

        private string GerarRegistro20(long nsr, ModelEmpresa empresa)
        {
            return "20" +
                   nsr.ToString().PadLeft(9, '0') +
                   "1" +
                   (empresa.Cnpj ?? "").PadRight(14) +
                   (empresa.RazaoSocial ?? "").PadRight(150);
        }

        private string GerarRegistro30(long nsr, ModelFuncionario func)
        {
            return "30" +
                   nsr.ToString().PadLeft(9, '0') +
                   (func.Cpf ?? "").PadLeft(11, '0') +
                   (func.Nome ?? "").PadRight(150);
        }

        private string GerarRegistro40(long nsr, ModelFuncionario func)
        {
            var horarioFormatado = (func.HorarioContratual ?? "").Replace(":", "").Replace("-", "");
            return "40" +
                   nsr.ToString().PadLeft(9, '0') +
                   "0001" +
                   horarioFormatado.PadRight(100);
        }

        // MUDANÇA IMPORTANTE: Agora recebe EspelhoPontoAgrupadoDto e soma os meses
        private string GerarRegistro50(long nsr, EspelhoPontoAgrupadoDto dados)
        {
            // 1. Somar os totais de todos os meses retornados
            var totalTrabalhado = new TimeSpan(dados.Meses.Sum(m => m.TotalHorasTrabalhadas.Ticks));
            var totalExtras = new TimeSpan(dados.Meses.Sum(m => m.TotalHorasExtras.Ticks));
            var totalAtrasos = new TimeSpan(dados.Meses.Sum(m => m.TotalAtrasos.Ticks));

            // 2. Formatar HHMM
            var strTrabalhado = $"{(int)totalTrabalhado.TotalHours:00}{totalTrabalhado.Minutes:00}";
            var strExtras = $"{(int)totalExtras.TotalHours:00}{totalExtras.Minutes:00}";
            var strAtrasos = $"{(int)totalAtrasos.TotalHours:00}{totalAtrasos.Minutes:00}";

            // 3. Pegar Data Inicial do primeiro mês e Final do último mês
            var dataInicio = dados.Meses.First().PeriodoInicio;
            var dataFim = dados.Meses.Last().PeriodoFim;

            return "50" +
                   nsr.ToString().PadLeft(9, '0') +
                   (dados.Funcionario.Cpf ?? "").PadLeft(11, '0') +
                   dataInicio.ToString("ddMMyyyy") +
                   dataFim.ToString("ddMMyyyy") +
                   "0001" +
                   strTrabalhado.PadLeft(4, '0') +
                   "0000" + // Adicional Noturno (placeholder)
                   strAtrasos.PadLeft(4, '0') +
                   strExtras.PadLeft(4, '0') +
                   "".PadRight(150);
        }

        private string GerarRegistro90(long nsr)
        {
            return "90" + nsr.ToString().PadLeft(9, '0');
        }
    }
}