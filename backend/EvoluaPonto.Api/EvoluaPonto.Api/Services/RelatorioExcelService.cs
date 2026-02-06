using ClosedXML.Excel;
using EvoluaPonto.Api.Dtos;

namespace EvoluaPonto.Api.Services
{
    public class RelatorioExcelService
    {
        private readonly JornadaService _jornadaService;

        public RelatorioExcelService(JornadaService jornadaService)
        {
            _jornadaService = jornadaService;
        }

        public async Task<byte[]> GerarRelatorioEspelhoPontoExcelAsync(List<Guid> funcionariosIds, int ano, int mesInicio, int mesFim)
        {
            using (var workbook = new XLWorkbook())
            {
                foreach (var funcionarioId in funcionariosIds)
                {
                    // 1. Busca o período COMPLETO agora
                    var response = await _jornadaService.CalcularEspelhoPontoAgrupadoAsync(funcionarioId, ano, mesInicio, mesFim);

                    if (!response.Success || response.Data == null) continue;

                    var dados = response.Data;

                    // Tratamento do nome da aba (como fizemos antes)
                    string nomeLimpo = System.Text.RegularExpressions.Regex.Replace(dados.Funcionario.Nome, @"[:\\/?*\[\]]", "");
                    string nomeBase = nomeLimpo.Length > 28 ? nomeLimpo.Substring(0, 28) : nomeLimpo;
                    string nomeAba = nomeBase;
                    int contador = 1;
                    while (workbook.Worksheets.Any(w => w.Name == nomeAba)) { nomeAba = $"{nomeBase} ({contador++})"; }

                    var worksheet = workbook.Worksheets.Add(nomeAba);

                    // Cabeçalho Geral (Dados fixos do funcionário)
                    MontarCabecalho(worksheet, dados, ano, mesInicio, mesFim);

                    int linhaAtual = 7;

                    // --- O PULO DO GATO PARA MÚLTIPLOS MESES ---
                    // O JornadaService já retorna uma lista de "Meses". Vamos iterar sobre ela.
                    foreach (var mesDados in dados.Meses)
                    {
                        // Escreve o Título do Mês (Ex: JANEIRO/2026)
                        var tituloMes = worksheet.Range(linhaAtual, 1, linhaAtual, 10);
                        tituloMes.Merge().Value = $"{new DateTime(ano, mesDados.Mes, 1).ToString("MMMM/yyyy", new System.Globalization.CultureInfo("pt-BR")).ToUpper()}";
                        tituloMes.Style.Font.Bold = true;
                        tituloMes.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                        tituloMes.Style.Fill.BackgroundColor = XLColor.LightBlue; // Destaque visual

                        linhaAtual++; // Pula linha do título

                        // Desenha a tabela daquele mês
                        MontarTabelaPonto(worksheet, mesDados, ref linhaAtual);

                        // Dá um espaço antes do próximo mês
                        linhaAtual += 3;
                    }
                }

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    return stream.ToArray();
                }
            }
        }

        private void MontarCabecalho(IXLWorksheet ws, EspelhoPontoAgrupadoDto dados, int ano, int mesInicio, int mesFim)
        {
            // Estilo do Título
            var tituloStyle = ws.Range("A1:J1");
            tituloStyle.Merge().Value = "ESPELHO DE PONTO MENSAL";
            tituloStyle.Style.Font.Bold = true;
            tituloStyle.Style.Font.FontSize = 14;
            tituloStyle.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Dados da Empresa
            ws.Cell("A2").Value = "EMPRESA:";
            ws.Cell("B2").Value = dados.Empresa.RazaoSocial;
            ws.Cell("H2").Value = "CNPJ:";
            ws.Cell("I2").Value = dados.Empresa.Cnpj;

            // Dados do Funcionário
            ws.Cell("A3").Value = "FUNCIONÁRIO:";
            ws.Cell("B3").Value = dados.Funcionario.Nome;
            ws.Cell("H3").Value = "CPF:";
            ws.Cell("I3").Value = dados.Funcionario.Cpf;

            ws.Cell("A4").Value = "CARGO:";
            ws.Cell("B4").Value = dados.Funcionario.Cargo;
            ws.Cell("H4").Value = "PERÍODO:";
            ws.Cell("I4").Value = $"{mesInicio:D2}/{ano} a {mesFim:D2}/{ano}";

            // Formatação Labels em Negrito
            ws.Range("A2:A4").Style.Font.Bold = true;
            ws.Range("H2:H4").Style.Font.Bold = true;
        }

        private void MontarTabelaPonto(IXLWorksheet ws, EspelhoPontoMensalDto dadosMensais, ref int linha)
        {
            // --- Cabeçalho da Tabela ---
            var colunas = new string[] { "DATA", "DIA", "ENTRADA 1", "SAÍDA 1", "ENTRADA 2", "SAÍDA 2", "TRABALHADO", "EXTRA", "FALTA", "OBSERVAÇÕES" };

            for (int i = 0; i < colunas.Length; i++)
            {
                ws.Cell(linha, i + 1).Value = colunas[i];
            }

            // Estiliza cabeçalho da tabela
            var rangeHeader = ws.Range(linha, 1, linha, colunas.Length);
            rangeHeader.Style.Font.Bold = true;
            rangeHeader.Style.Fill.BackgroundColor = XLColor.LightGray;
            rangeHeader.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

            linha++;

            var fusoBr = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

            // --- Linhas dos Dias ---
            foreach (var jornada in dadosMensais.Jornadas)
            {
                ws.Cell(linha, 1).Value = jornada.Dia.ToString("dd/MM/yyyy");
                ws.Cell(linha, 2).Value = jornada.Dia.ToString("ddd", new System.Globalization.CultureInfo("pt-BR")).ToUpper();

                var marcacoes = jornada.Marcacoes;

                // Exibe batidas (Apenas visualização)

                if (marcacoes.Count > 0) ws.Cell(linha, 3).Value = marcacoes[0].TimestampMarcacao.ToString("HH:mm");
                if (marcacoes.Count > 1) ws.Cell(linha, 4).Value = marcacoes[1].TimestampMarcacao.ToString("HH:mm");
                if (marcacoes.Count > 2) ws.Cell(linha, 5).Value = marcacoes[2].TimestampMarcacao.ToString("HH:mm");
                if (marcacoes.Count > 3) ws.Cell(linha, 6).Value = marcacoes[3].TimestampMarcacao.ToString("HH:mm");

                // --- AQUI ESTAVA O PROBLEMA POTENCIAL EM DIAS > 24h (Raro, mas seguro corrigir) ---
                ws.Cell(linha, 7).Value = FormatarHoraTotal(jornada.TotalTrabalhado);
                ws.Cell(linha, 8).Value = FormatarHoraTotal(jornada.HorasExtras);

                var cellFalta = ws.Cell(linha, 9);
                cellFalta.Value = FormatarHoraTotal(jornada.HorasFaltas);
                if (jornada.HorasFaltas > TimeSpan.Zero) cellFalta.Style.Font.FontColor = XLColor.Red;

                if (jornada.Observacoes.Any())
                {
                    ws.Cell(linha, 10).Value = string.Join(", ", jornada.Observacoes);
                }

                if (jornada.Observacoes.Contains("Folga DSR") || jornada.Observacoes.Contains("Feriado"))
                {
                    ws.Range(linha, 1, linha, 10).Style.Fill.BackgroundColor = XLColor.AliceBlue;
                }

                linha++;
            }

            // --- Rodapé (Totais) ---
            linha++;
            ws.Cell(linha, 6).Value = "TOTAIS:";
            ws.Cell(linha, 6).Style.Font.Bold = true;

            // --- CORREÇÃO DO ERRO FATAL AQUI ---
            // Substituímos o .ToString("hhh:mm") pelo método auxiliar
            ws.Cell(linha, 7).Value = FormatarHoraTotal(dadosMensais.TotalHorasTrabalhadas);
            ws.Cell(linha, 8).Value = FormatarHoraTotal(dadosMensais.TotalHorasExtras);
            ws.Cell(linha, 9).Value = FormatarHoraTotal(dadosMensais.TotalAtrasos);

            ws.Range(linha, 7, linha, 9).Style.Font.Bold = true;

            ws.Columns().AdjustToContents();
        }

        // --- NOVO MÉTODO AUXILIAR ---
        // Resolve o problema de formatar horas acima de 24h (ex: 100:00)
        private string FormatarHoraTotal(TimeSpan tempo)
        {
            // (int)tempo.TotalHours pega as horas totais (ex: 2 dias = 48 horas)
            int totalHoras = (int)tempo.TotalHours;
            int minutos = Math.Abs(tempo.Minutes); // Garante minutos positivos

            // Retorna formato "00:00" ou "123:00"
            return $"{totalHoras:00}:{minutos:00}";
        }
    }
}