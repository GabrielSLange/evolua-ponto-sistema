using EvoluaPonto.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;

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
                            r.TimestampMarcacao <= dataFim.ToUniversalTime())
                .OrderBy(r => r.TimestampMarcacao)
                .ToListAsync();

            var sb = new StringBuilder();

            // --- REGISTRO TIPO 1: CABEÇALHO ---
            // Posição 001-009: NSR (sempre 0 no cabeçalho)
            // Posição 010-010: Tipo de Registro (1)
            // Posição 011-011: Tipo de Identificador (1 para CNPJ)
            // Posição 012-025: CNPJ da Empresa
            // ... e assim por diante, seguindo o layout da portaria.
            sb.Append("0000000001"); // NSR e Tipo
            sb.Append("1"); // Tipo de Identificador (1 = CNPJ)
            sb.Append(estabelecimento.Empresa.Cnpj.PadRight(14));
            sb.Append("".PadRight(14)); // CEI/CAEPF/CNO (não temos)
            sb.Append(estabelecimento.Empresa.RazaoSocial.PadRight(150));
            sb.Append("SEU_NUMERO_INPI_AQUI".PadRight(17)); // Substituir pelo seu nº de registro do software no INPI
            sb.Append(dataInicio.ToString("ddMMyyyy"));
            sb.Append(dataFim.ToString("ddMMyyyy"));
            sb.Append(DateTime.Now.ToString("ddMMyyyyHHmm"));
            sb.Append("001"); // Versão do Layout do AFD
            sb.Append("\r\n"); // Quebra de linha padrão do Windows

            // --- REGISTROS TIPO 7: MARCAÇÕES DE PONTO (Específico para REP-P) ---
            foreach (var registro in registrosPonto)
            {
                sb.Append(registro.Nsr.ToString().PadLeft(9, '0')); // NSR
                sb.Append("7"); // Tipo de Registro
                sb.Append(registro.TimestampMarcacao.ToString("ddMMyyyyHHmmss"));
                sb.Append(registro.Funcionario.Cpf.PadRight(12));
                // Outros campos específicos do REP-P podem ser adicionados aqui se necessário
                sb.Append("\r\n");
            }

            // --- REGISTRO TIPO 9: TRAILER (RODAPÉ) ---
            sb.Append("999999999"); // NSR fixo para trailer
            sb.Append("000000000"); // Qtd. registros tipo 2
            sb.Append("000000000"); // Qtd. registros tipo 3
            sb.Append("000000000"); // Qtd. registros tipo 4
            sb.Append("000000000"); // Qtd. registros tipo 5
            sb.Append(registrosPonto.Count.ToString().PadLeft(9, '0')); // Qtd. registros tipo 7 (o nosso)
            sb.Append("9"); // Tipo de Registro
            sb.Append("\r\n");

            return sb.ToString();
        }
    }
}