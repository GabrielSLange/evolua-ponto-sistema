using EvoluaPonto.Api.Dtos;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class EspelhoPontoDocument : IDocument
{
    private readonly EspelhoPontoAgrupadoDto _model;

    public EspelhoPontoDocument(EspelhoPontoAgrupadoDto model)
    {
        _model = model;
    }

    public void Compose(IDocumentContainer container)
    {
        // Aqui iteramos sobre os meses. Para cada mês, geramos uma página nova.
        foreach (var mes in _model.Meses)
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Element(header => ComposeHeader(header, mes));
                page.Content().Element(content => ComposeContent(content, mes));
                page.Footer().Element(footer => ComposeFooter(footer, mes));
            });
        }
    }

    void ComposeHeader(IContainer container, EspelhoPontoMensalDto mes)
    {
        container.Column(column =>
        {
            column.Item().Text(_model.Empresa.RazaoSocial).Bold().FontSize(14);
            column.Item().Text($"Funcionário: {_model.Funcionario.Nome}");
            column.Item().Text($"Período: {mes.PeriodoInicio:dd/MM/yyyy} a {mes.PeriodoFim:dd/MM/yyyy}").SemiBold();
            column.Item().PaddingVertical(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
        });
    }

    void ComposeContent(IContainer container, EspelhoPontoMensalDto mes)
    {
        container.PaddingVertical(5).Column(column =>
        {
            // 1. A Tabela de Pontos
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(60);
                    columns.RelativeColumn();
                    columns.ConstantColumn(45);
                    columns.ConstantColumn(45);
                    columns.ConstantColumn(45);
                    columns.ConstantColumn(45);
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderStyle).Text("Data");
                    header.Cell().Element(HeaderStyle).Text("Marcações");
                    header.Cell().Element(HeaderStyle).Text("Trab.");
                    header.Cell().Element(HeaderStyle).Text("Faltas");
                    header.Cell().Element(HeaderStyle).Text("Extras");
                    header.Cell().Element(HeaderStyle).AlignRight().Text("Saldo");
                });

                foreach (var dia in mes.Jornadas)
                {
                    table.Cell().Element(CellStyle).Text($"{dia.Dia:dd/MM (ddd)}");

                    var horarios = string.Join("  ", dia.Marcacoes.Select(m => m.TimestampMarcacao.ToString("HH:mm")));
                    if (dia.Observacoes.Any()) horarios += $" ({string.Join(", ", dia.Observacoes)})";

                    table.Cell().Element(CellStyle).Text(horarios);
                    table.Cell().Element(CellStyle).Text(FormatTime(dia.TotalTrabalhado));
                    table.Cell().Element(CellStyle).Text(FormatTime(dia.HorasFaltas));
                    table.Cell().Element(CellStyle).Text(FormatTime(dia.HorasExtras));

                    table.Cell().Element(CellStyle).AlignRight().Text(text =>
                    {
                        var saldoTexto = (dia.SaldoDiario < TimeSpan.Zero ? "-" : "+") + FormatTime(dia.SaldoDiario.Duration());
                        var cor = dia.SaldoDiario < TimeSpan.Zero ? Colors.Red.Medium : Colors.Green.Darken2;
                        if (dia.SaldoDiario == TimeSpan.Zero) cor = Colors.Black;
                        text.Span(saldoTexto).FontColor(cor).Bold();
                    });
                }
            });

            // 2. O Bloco de Assinatura (Adicionado aqui)
            // O EnsureSpace garante que a assinatura não fique "quebrada" ou colada demais se a página estiver acabando
            column.Item().PaddingTop(30).ShowEntire().Column(sig =>
            {
                sig.Item().AlignCenter().Text("_________________________________________________________");
                sig.Item().AlignCenter().Text($"Assinatura - {mes.PeriodoInicio:MMMM/yyyy}").FontSize(9);
            });
        });

        static IContainer HeaderStyle(IContainer container) => container.BorderBottom(1).BorderColor(Colors.Grey.Darken2).PaddingVertical(2).DefaultTextStyle(x => x.Bold().FontSize(9));
        static IContainer CellStyle(IContainer container) => container.BorderBottom(1).BorderColor(Colors.Grey.Lighten3).PaddingVertical(2).DefaultTextStyle(x => x.FontSize(9));
    }

    // Método auxiliar (mantenha este se já não tiver)
    private string FormatTime(TimeSpan time)
    {
        return $"{(int)time.TotalHours:D2}:{time.Minutes:D2}";
    }

    void ComposeFooter(IContainer container, EspelhoPontoMensalDto mes)
    {
        container.Column(col =>
        {
            col.Item().LineHorizontal(1);
            col.Item().PaddingTop(5).Row(row =>
            {
                // --- LADO ESQUERDO: SALDO ---
                row.RelativeItem().Text(text =>
                {
                    text.Span("Saldo do Mês: ").FontSize(10);

                    var sinal = mes.Saldo < TimeSpan.Zero ? "-" : "+";
                    var cor = mes.Saldo < TimeSpan.Zero ? Colors.Red.Medium : Colors.Green.Darken2;

                    if (mes.Saldo == TimeSpan.Zero)
                    {
                        sinal = "";
                        cor = Colors.Black;
                    }

                    var valorFormatado = $"{sinal}{(int)mes.Saldo.Duration().TotalHours:D2}:{mes.Saldo.Duration().Minutes:D2}";
                    text.Span(valorFormatado).FontColor(cor).Bold().FontSize(10);
                });

                // --- LADO DIREITO: PAGINAÇÃO (CORRIGIDO) ---
                // Usamos 't' (TextDescriptor) para montar o texto por partes.
                // O t.CurrentPageNumber() é o jeito oficial do QuestPDF de injetar o número.

                row.AutoItem().Text(t =>
                {
                    // 1. Aplica o estilo padrão para todo esse bloco de texto
                    t.DefaultTextStyle(x => x.FontSize(9));

                    // 2. Escreve o prefixo
                    t.Span("Pág. ");

                    // 3. Insere o número da página atual automaticamente
                    t.CurrentPageNumber();
                });
            });
        });
    }
}