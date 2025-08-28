using EvoluaPonto.Api.Data;
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

        /// <summary>
        /// Gera o conteúdo do arquivo AEJ (Arquivo Eletrônico de Jornada) para um estabelecimento em um período.
        /// </summary>
        public async Task<string> GerarAejAsync(Guid estabelecimentoId, DateTime dataInicio, DateTime dataFim)
        {
            var estabelecimento = await _context.Estabelecimentos
                .Include(e => e.Empresa)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == estabelecimentoId);

            if (estabelecimento == null)
            {
                throw new Exception("Estabelecimento não encontrado.");
            }

            var funcionarios = await _context.Funcionarios
                .Where(f => f.EstabelecimentoId == estabelecimentoId)
                .ToListAsync();

            var sb = new StringBuilder();
            long numeroSequencial = 1;

            // Registro 10: Cabeçalho
            sb.AppendLine(GerarRegistro10(numeroSequencial++, estabelecimento, dataInicio, dataFim));

            // Registro 20: Empregador
            sb.AppendLine(GerarRegistro20(numeroSequencial++, estabelecimento.Empresa));

            // Loop para cada funcionário
            foreach (var funcionario in funcionarios)
            {
                // Calcula o espelho de ponto para obter os totais
                var espelhoResponse = await _jornadaService.CalcularEspelhoPontoAsync(funcionario.Id, dataInicio.Year, dataInicio.Month);

                if (espelhoResponse.Success && espelhoResponse.Data != null)
                {
                    var dadosEspelho = espelhoResponse.Data;

                    // Registro 30: Empregado
                    sb.AppendLine(GerarRegistro30(numeroSequencial++, funcionario));

                    // Registro 40: Horários Contratuais (vamos simplificar por agora)
                    sb.AppendLine(GerarRegistro40(numeroSequencial++, funcionario));

                    // Registro 50: Totalizadores do Período
                    sb.AppendLine(GerarRegistro50(numeroSequencial++, dadosEspelho));
                }
            }

            // Registro 90: Trailer
            sb.AppendLine(GerarRegistro90(numeroSequencial));

            return sb.ToString();
        }

        // --- Métodos Auxiliares para gerar cada linha ---

        private string GerarRegistro10(long nsr, ModelEstabelecimento estab, DateTime inicio, DateTime fim)
        {
            // Layout: 10 + NSR(9) + TipoIdentificador(1) + Identificador(14) + DataInicial(8) + DataFinal(8) + DataGeracao(8) + HoraGeracao(4)
            return "10" +
                   nsr.ToString().PadLeft(9, '0') +
                   "1" +
                   // CORREÇÃO: Garante que o CNPJ tenha 14 caracteres, preenchido com espaços.
                   (estab.Empresa.Cnpj ?? "").PadRight(14) +
                   inicio.ToString("ddMMyyyy") +
                   fim.ToString("ddMMyyyy") +
                   DateTime.Now.ToString("ddMMyyyy") +
                   DateTime.Now.ToString("HHmm");
        }

        private string GerarRegistro20(long nsr, ModelEmpresa empresa)
        {
            // Layout: 20 + NSR(9) + TipoIdentificador(1) + Identificador(14) + RazaoSocial(150)
            return "20" +
                   nsr.ToString().PadLeft(9, '0') +
                   "1" +
                   // CORREÇÃO: Garante que o CNPJ tenha 14 caracteres, preenchido com espaços.
                   (empresa.Cnpj ?? "").PadRight(14) +
                   (empresa.RazaoSocial ?? "").PadRight(150);
        }

        // Registro 30 estava correto, sem necessidade de alteração.
        private string GerarRegistro30(long nsr, ModelFuncionario func)
        {
            // Layout: 30 + NSR(9) + CPF(11) + Nome(150)
            return "30" +
                   nsr.ToString().PadLeft(9, '0') +
                   (func.Cpf ?? "").PadLeft(11, '0') +
                   (func.Nome ?? "").PadRight(150);
        }


        private string GerarRegistro40(long nsr, ModelFuncionario func)
        {
            // Layout: 40 + NSR(9) + CodHorario(4) + HorasMinutos(HHMM-HHMM,...)
            // CORREÇÃO: Remove os dois pontos (:) do horário.
            var horarioFormatado = (func.HorarioContratual ?? "").Replace(":", "").Replace("-", "");
            return "40" +
                   nsr.ToString().PadLeft(9, '0') +
                   "0001" +
                   horarioFormatado.PadRight(100);
        }

        private string GerarRegistro50(long nsr, Dtos.EspelhoPontoDto espelho)
        {
            // Layout: 50 + NSR(9) + CPF(11) + DataInicial(8) + DataFinal(8) + CodHorario(4) + Totais...(HHMM)

            // CORREÇÃO: Calcula e formata os totais corretamente para HHMM.
            var totalHorasTrabalhadas = (int)espelho.TotalHorasTrabalhadasMes.TotalHours;
            var minutosTrabalhados = espelho.TotalHorasTrabalhadasMes.Minutes;
            var totalTrabalhadoFormatado = $"{totalHorasTrabalhadas:00}{minutosTrabalhados:00}";

            var totalHorasAtraso = (int)espelho.TotalAtrasosMes.TotalHours;
            var minutosAtraso = espelho.TotalAtrasosMes.Minutes;
            var totalAtrasosFormatado = $"{totalHorasAtraso:00}{minutosAtraso:00}";

            var totalHorasExtras = (int)espelho.TotalHorasExtrasMes.TotalHours;
            var minutosExtras = espelho.TotalHorasExtrasMes.Minutes;
            var totalExtrasFormatado = $"{totalHorasExtras:00}{minutosExtras:00}";

            return "50" +
                   nsr.ToString().PadLeft(9, '0') +
                   (espelho.Funcionario.Cpf ?? "").PadLeft(11, '0') +
                   espelho.PeriodoInicio.ToString("ddMMyyyy") +
                   espelho.PeriodoFim.ToString("ddMMyyyy") +
                   "0001" + // Mesmo código de horário do registro 40
                   totalTrabalhadoFormatado.PadLeft(4, '0') +
                   "0000" + // Horas Noturnas (não implementado)
                   totalAtrasosFormatado.PadLeft(4, '0') +
                   totalExtrasFormatado.PadLeft(4, '0') +
                   "".PadRight(150); // Campos futuros preenchidos com espaços
        }

        private string GerarRegistro90(long nsr)
        {
            // Layout: 90 + NSR(9)
            return "90" + nsr.ToString().PadLeft(9, '0');
        }
    }
}