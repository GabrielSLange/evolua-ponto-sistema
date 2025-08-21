using EvoluaPonto.Api.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EvoluaPonto.Api.Services
{
    public class ComprovanteService
    {
        public ComprovanteService()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GerarComprovante(ModelRegistroPonto registro, ModelFuncionario funcionario, ModelEmpresa empresa)
        {
            TimeZoneInfo fusoHorarioBrasilia;
            try
            {
                fusoHorarioBrasilia = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                fusoHorarioBrasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
            }

            // 2. Converte o horário da marcação de UTC para o horário de Brasília
            DateTime horarioLocalMarcacao = TimeZoneInfo.ConvertTimeFromUtc(registro.TimestampMarcacao, fusoHorarioBrasilia);
            

            var pdfBytes = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(80, 120, Unit.Millimetre);
                    page.Margin(2, Unit.Millimetre);
                    page.DefaultTextStyle(x => x.FontSize(8).FontFamily(Fonts.Courier));

                    page.Header()
                        .AlignCenter()
                        .Text("Comprovante de Registro de Ponto")
                        .Bold().FontSize(10);

                    page.Content()
                        .PaddingVertical(5, Unit.Millimetre)
                        .Column(col =>
                        {
                            col.Spacing(2);

                            col.Item().Text(empresa.RazaoSocial).Bold();
                            col.Item().Text($"CNPJ: {empresa.Cnpj}");
                            col.Item().Text($"Local: [Endereço do Local de Trabalho]");

                            col.Item().LineHorizontal(0.5f);

                            col.Item().Text(funcionario.Nome).Bold();
                            col.Item().Text($"CPF: {funcionario.Cpf}");

                            col.Item().LineHorizontal(0.5f);

                            // --- CORREÇÃO APLICADA AQUI ---
                            col.Item().Row(row =>
                            {
                                row.RelativeItem().Text("Data e Hora:"); // Era RelativeColumn
                                row.RelativeItem().AlignRight().Text($"{horarioLocalMarcacao:dd/MM/yyyy HH:mm:ss}"); // Era RelativeColumn
                            });

                            col.Item().Row(row =>
                            {
                                row.RelativeItem().Text("NSR:"); // Era RelativeColumn
                                row.RelativeItem().AlignRight().Text(registro.Nsr.ToString()); // Era RelativeColumn
                            });

                            col.Item().Row(row =>
                            {
                                row.RelativeItem().Text("Tipo de Marcação:"); // Era RelativeColumn
                                row.RelativeItem().AlignRight().Text(registro.Tipo.ToUpper()).Bold(); // Era RelativeColumn
                            });

                            col.Item().LineHorizontal(0.5f);

                            col.Item().Text("Hash (SHA-256):").FontSize(6);
                            col.Item().Text(registro.HashSha256).FontSize(6);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Gerado por EvoluaPonto em ").FontSize(6);
                            x.Span(horarioLocalMarcacao.ToString("dd/MM/yyyy HH:mm:ss")).FontSize(6);
                        });
                });
            }).GeneratePdf();

            return pdfBytes;
        }
    }
}