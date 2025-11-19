using EvoluaPonto.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;

using EvoluaPonto.Api.Models.Enums;

namespace EvoluaPonto.Api.Services
{
    public class AfdService
    {
        private readonly AppDbContext _context;

        public AfdService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> GerarAfdAsync(Guid estabelecimentoId, DateTime dataInicio, DateTime dataFim)
        {
            var estabelecimento = await _context.Estabelecimentos
                .Include(e => e.Empresa)
                .FirstOrDefaultAsync(e => e.Id == estabelecimentoId);

            if (estabelecimento == null)
            {
                throw new Exception("Estabelecimento não encontrado.");
            }

            var registrosPonto = await _context.RegistrosPonto
                .Include(r => r.Funcionario)
                .Where(r => r.Funcionario.EstabelecimentoId == estabelecimentoId &&
                            r.TimestampMarcacao >= dataInicio.ToUniversalTime() &&
                            r.TimestampMarcacao <= dataFim.ToUniversalTime() &&
                            (r.RegistroManual == false || r.Status == StatusSolicitacao.Aprovado))
                .OrderBy(r => r.TimestampMarcacao)
                .ToListAsync();

            var sb = new StringBuilder();

            // --- REGISTRO TIPO 1: CABEÇALHO ---
            string cabecalho =
                "000000000" +
                "1" +
                "1" +
                FormatString(estabelecimento.Empresa?.Cnpj, 14) +
                FormatString("", 14) +
                FormatString(estabelecimento.Empresa?.RazaoSocial, 150) +
                FormatString("SEU_NUMERO_INPI_AQUI", 17) +
                dataInicio.ToString("ddMMyyyy") +
                dataFim.ToString("ddMMyyyy") +
                DateTime.Now.ToString("ddMMyyyyHHmm") +
                "001"; // Versão do Layout do AFD Portaria 671
            sb.AppendLine(cabecalho);

            // --- REGISTROS TIPO 7: MARCAÇÕES DE PONTO (REP-P) ---
            foreach (var registro in registrosPonto)
            {
                var timestampGravacao = registro.CreatedAt.ToUniversalTime();

                string marcacao =
                    FormatNumeric(registro.Nsr.Value, 9) +
                    "7" +
                    registro.TimestampMarcacao.ToUniversalTime().ToString("ddMMyyyyHHmmss") +
                    FormatString(registro.Funcionario.Cpf, 12) +
                    timestampGravacao.ToString("ddMMyyyyHHmmss") +
                    FormatString("02", 2) + // Identificador do Coletor (ex: 02 = browser)
                    "0" + // Tipo de Marcação (0 = online)
                    FormatString(registro.HashSha256, 64); // HASH ADICIONADO CONFORME PORTARIA
                sb.AppendLine(marcacao);
            }

            // --- REGISTRO TIPO 9: TRAILER (RODAPÉ) ---
            string trailer =
                "999999999" +
                FormatNumeric(0, 9) + // Qtd. Registros Tipo 2
                FormatNumeric(0, 9) + // Qtd. Registros Tipo 3
                FormatNumeric(0, 9) + // Qtd. Registros Tipo 4
                FormatNumeric(0, 9) + // Qtd. Registros Tipo 5
                FormatNumeric(registrosPonto.Count, 9) + // Qtd. Registros Tipo 7
                "9";
            sb.Append(trailer); // Usamos Append na última linha para não criar uma linha em branco no final

            return sb.ToString();
        }

        // --- FUNÇÕES AUXILIARES CORRIGIDAS ---

        private string FormatString(string? value, int length)
        {
            value ??= "";
            // Primeiro, trunca a string se ela for maior que o tamanho permitido.
            // Depois, preenche com espaços à direita até atingir o tamanho exato.
            return value.PadRight(length).Substring(0, length);
        }

        private string FormatNumeric(long value, int length)
        {
            return value.ToString().PadLeft(length, '0');
        }
    }
}