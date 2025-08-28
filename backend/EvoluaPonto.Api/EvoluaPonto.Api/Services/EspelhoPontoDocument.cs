using EvoluaPonto.Api.Dtos;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
// Importamos a infraestrutura do QuestPDF para usar seus tipos
using QuestPDF.Infrastructure;
using System;
using System.Linq;

// Usamos um alias para evitar a ambiguidade com System.ComponentModel.IContainer
using IContainer = QuestPDF.Infrastructure.IContainer;

namespace EvoluaPonto.Api.Services
{
    public class EspelhoPontoDocument : IDocument
    {
        private readonly EspelhoPontoDto _dadosEspelho;

        public EspelhoPontoDocument(EspelhoPontoDto dadosEspelho)
        {
            _dadosEspelho = dadosEspelho;
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Calibri));

                page.Header().Element(ComposeHeader);
                page.Content().Element(ComposeContent);
                page.Footer().Element(ComposeFooter);
            });
        }

        void ComposeHeader(IContainer container)
        {
            // ... (código do cabeçalho inalterado) ...
            var titleStyle = TextStyle.Default.FontSize(16).SemiBold();
            container.Column(column =>
            {
                column.Item().Row(row =>
                {
                    row.RelativeItem().Column(column =>
                    {
                        column.Item().Text("Espelho de Ponto Eletrônico").Style(titleStyle);
                        column.Item().Text($"Período: {_dadosEspelho.PeriodoInicio:dd/MM/yyyy} a {_dadosEspelho.PeriodoFim:dd/MM/yyyy}");
                        column.Item().Text($"Data de Emissão: {DateTime.Now:dd/MM/yyyy}");
                    });
                });
                column.Item().PaddingTop(20).Column(innerColumn => {
                    innerColumn.Item().Text("DADOS DO EMPREGADOR").SemiBold();
                    innerColumn.Item().Text($"Razão Social: {_dadosEspelho.Empresa.RazaoSocial}");
                    innerColumn.Item().Text($"CNPJ: {_dadosEspelho.Empresa.Cnpj}");
                    string enderecoCompleto = $"{_dadosEspelho.Estabelecimento.Logradouro}, {_dadosEspelho.Estabelecimento.Numero} - {_dadosEspelho.Estabelecimento.Bairro}, {_dadosEspelho.Estabelecimento.Cidade}/{_dadosEspelho.Estabelecimento.Estado}";
                    innerColumn.Item().Text($"Endereço: {enderecoCompleto}");
                });
                column.Item().PaddingTop(10).Column(innerColumn => {
                    innerColumn.Item().Text("DADOS DO FUNCIONÁRIO").SemiBold();
                    innerColumn.Item().Text($"Nome: {_dadosEspelho.Funcionario.Nome}");
                    innerColumn.Item().Text($"CPF: {_dadosEspelho.Funcionario.Cpf}");
                    innerColumn.Item().Text($"Horário Contratual: {_dadosEspelho.Funcionario.HorarioContratual}");
                });
            });
        }

        // **MUDANÇA:** A assinatura agora será adicionada no final deste método.
        void ComposeContent(IContainer container)
        {
            container.Column(column =>
            {
                // ITEM 1: Tabela de jornadas
                column.Item().Table(table =>
                {
                    // ... (código da tabela inalterado) ...
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(70);
                        columns.RelativeColumn(3);
                        columns.ConstantColumn(70);
                        columns.ConstantColumn(60);
                        columns.ConstantColumn(60);
                        columns.RelativeColumn(2);
                    });
                    table.Header(header =>
                    {
                        header.Cell().Background("#f0f0f0").Padding(5).Text("Dia").SemiBold();
                        header.Cell().Background("#f0f0f0").Padding(5).Text("Marcações (Entrada/Saída)").SemiBold();
                        header.Cell().Background("#f0f0f0").Padding(5).Text("Total Trab.").SemiBold();
                        header.Cell().Background("#f0f0f0").Padding(5).Text("Atrasos").SemiBold();
                        header.Cell().Background("#f0f0f0").Padding(5).Text("Extras").SemiBold();
                        header.Cell().Background("#f0f0f0").Padding(5).Text("Observações").SemiBold();
                    });
                    foreach (var jornada in _dadosEspelho.Jornadas.OrderBy(j => j.Dia))
                    {
                        table.Cell().BorderBottom(1).BorderColor("#ccc").Padding(5).Text($"{jornada.Dia:dd/MM/yyyy} ({jornada.Dia.ToString("ddd")})");
                        string marcacoesStr = string.Join(" | ", jornada.Marcacoes.Select(m => m.Saida.HasValue ? $"{m.Entrada:HH:mm} - {m.Saida:HH:mm}" : $"{m.Entrada:HH:mm} - ???"));
                        table.Cell().BorderBottom(1).BorderColor("#ccc").Padding(5).Text(marcacoesStr);
                        table.Cell().BorderBottom(1).BorderColor("#ccc").Padding(5).Text($"{jornada.TotalTrabalhado:hh\\:mm}");
                        table.Cell().BorderBottom(1).BorderColor("#ccc").Padding(5).Text($"{jornada.Atrasos:hh\\:mm}").FontColor(jornada.Atrasos > TimeSpan.Zero ? Colors.Red.Medium : Colors.Black);
                        table.Cell().BorderBottom(1).BorderColor("#ccc").Padding(5).Text($"{jornada.HorasExtras:hh\\:mm}").FontColor(jornada.HorasExtras > TimeSpan.Zero ? Colors.Green.Medium : Colors.Black);
                        table.Cell().BorderBottom(1).BorderColor("#ccc").Padding(5).Text(string.Join(", ", jornada.Observacoes));
                    }
                });

                // **NOVO:** Adiciona o campo de assinatura ao final do conteúdo principal.
                // Ele aparecerá apenas uma vez, após a tabela.
                column.Item().PaddingTop(50).AlignCenter().Text("_________________________________________");
                column.Item().PaddingTop(5).AlignCenter().Text($"Assinatura do Funcionário - {_dadosEspelho.Funcionario.Nome}");
            });
        }

        // **MUDANÇA:** O rodapé agora contém APENAS o resumo mensal e a numeração.
        void ComposeFooter(IContainer container)
        {
            container.Column(column =>
            {
                column.Item().PaddingTop(10).Column(innerColumn =>
                {
                    innerColumn.Item().Text("RESUMO MENSAL").SemiBold();
                    innerColumn.Item().LineHorizontal(1).LineColor("#ccc");

                    innerColumn.Item().Row(row =>
                    {
                        row.RelativeItem().Text("Total Horas Trabalhadas:");
                        row.ConstantItem(100).Text($"{Math.Floor(_dadosEspelho.TotalHorasTrabalhadasMes.TotalHours):00}:{_dadosEspelho.TotalHorasTrabalhadasMes.Minutes:00}");
                    });
                    innerColumn.Item().Row(row =>
                    {
                        row.RelativeItem().Text("Total Atrasos/Faltas:");
                        row.ConstantItem(100).Text($"{Math.Floor(_dadosEspelho.TotalAtrasosMes.TotalHours):00}:{_dadosEspelho.TotalAtrasosMes.Minutes:00}");
                    });
                    innerColumn.Item().Row(row =>
                    {
                        row.RelativeItem().Text("Total Horas Extras:");
                        row.ConstantItem(100).Text($"{Math.Floor(_dadosEspelho.TotalHorasExtrasMes.TotalHours):00}:{_dadosEspelho.TotalHorasExtrasMes.Minutes:00}");
                    });
                    innerColumn.Item().LineHorizontal(1).LineColor("#ccc");
                    innerColumn.Item().Row(row =>
                    {
                        row.RelativeItem().Text("SALDO DO MÊS:").SemiBold();
                        row.ConstantItem(100).Text($"{(_dadosEspelho.SaldoMes < TimeSpan.Zero ? "-" : "")}{Math.Floor(Math.Abs(_dadosEspelho.SaldoMes.TotalHours)):00}:{Math.Abs(_dadosEspelho.SaldoMes.Minutes):00}").SemiBold();
                    });
                });

                column.Item().PaddingTop(15).AlignCenter().Text(text =>
                {
                    text.Span("Página ");
                    text.CurrentPageNumber();
                    text.Span(" de ");
                    text.TotalPages();
                });
            });
        }
    }
}