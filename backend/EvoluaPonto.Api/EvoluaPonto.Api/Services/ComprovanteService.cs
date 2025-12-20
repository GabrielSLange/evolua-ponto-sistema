using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Enums;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EvoluaPonto.Api.Services
{
    public class ComprovanteService
    {
        private readonly AppDbContext _context;

        public ComprovanteService(AppDbContext context)
        {
            _context = context;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GerarComprovante(ModelRegistroPonto registro, ModelFuncionario funcionario, ModelEmpresa empresa, ModelEstabelecimento estabelecimento)
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

            string enderecoFormatado = $"{estabelecimento.Logradouro}, {estabelecimento.Numero} - {estabelecimento.Bairro}, {estabelecimento.Cidade}/{estabelecimento.Estado}";

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
                            col.Item().Text($"Local: {enderecoFormatado}");

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

        public async Task<ServiceResponse<List<ComprovanteDto>>> GetComprovantesPorFuncionarioAsync(Guid funcionarioId, DateTime dataInicio, DateTime dataFim)
        {
            try
            {
                // 1. Pegamos a data (ex: "2025-11-01 00:00:00")
                // 2. Usamos DateTime.SpecifyKind() para *definir* o tipo dela como UTC.
                //    Isso informa ao .NET que esta data deve ser tratada como UTC.
                var inicioUtc = DateTime.SpecifyKind(dataInicio.Date, DateTimeKind.Utc);

                // Fazemos o mesmo para a data final
                // Em vez de terminar em 23:59:59 UTC, nós avançamos 4 horas no dia seguinte.
                var fimUtc = DateTime.SpecifyKind(dataFim.Date.AddDays(1).AddHours(4), DateTimeKind.Utc);

                var comprovantes = await _context.RegistrosPonto
                    .Where(r =>
                        // Filtro 1: Pertence ao funcionário
                        r.FuncionarioId == funcionarioId &&

                        // Filtro 2: Está dentro do período
                        r.TimestampMarcacao >= inicioUtc &&
                        r.TimestampMarcacao <= fimUtc &&

                        // Filtro 3: É um registro "oficial" (como definimos antes)
                        (r.RegistroManual == false || r.Status == StatusSolicitacao.Aprovado) &&

                        // Filtro 4: REALMENTE possui um comprovante
                        !string.IsNullOrEmpty(r.ComprovanteUrl)
                    )
                    .OrderByDescending(r => r.TimestampMarcacao) // Mais recentes primeiro
                    .Select(r => new ComprovanteDto
                    {
                        Id = r.Id,
                        TimestampMarcacao = r.TimestampMarcacao,
                        Tipo = r.Tipo,
                        ComprovanteUrl = r.ComprovanteUrl
                    })
                    .ToListAsync();

                if (comprovantes == null || !comprovantes.Any())
                {
                    return new ServiceResponse<List<ComprovanteDto>> { Success = true, ErrorMessage = "Nenhum comprovante encontrado para este período.", Data = new List<ComprovanteDto>() };
                }

                return new ServiceResponse<List<ComprovanteDto>> { Success = true, ErrorMessage = "Comprovantes encontrados.", Data = comprovantes };
            }
            catch (Exception ex)
            {
                return new ServiceResponse<List<ComprovanteDto>> { Success = false, ErrorMessage = $"Erro ao recuperar comprovantes: {ex.Message}" };
            }
        }
    }
}