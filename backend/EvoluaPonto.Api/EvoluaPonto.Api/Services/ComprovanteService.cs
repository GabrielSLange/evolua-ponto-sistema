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
        private readonly MinioService _minioService;

        public ComprovanteService(AppDbContext context, MinioService minioService)
        {
            _context = context;
            QuestPDF.Settings.License = LicenseType.Community;
            _minioService = minioService;
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
                var inicioUtc = DateTime.SpecifyKind(dataInicio.Date, DateTimeKind.Utc);
                var fimUtc = DateTime.SpecifyKind(dataFim.Date.AddDays(1).AddHours(4), DateTimeKind.Utc);

                // 1. Busca do banco (Trazemos o texto cru do banco primeiro)
                var comprovantes = await _context.RegistrosPonto
                    .AsNoTracking() // Boa prática para leitura
                    .Where(r =>
                        r.FuncionarioId == funcionarioId &&
                        r.TimestampMarcacao >= inicioUtc &&
                        r.TimestampMarcacao <= fimUtc &&
                        (r.RegistroManual == false || r.Status == StatusSolicitacao.Aprovado) &&
                        !string.IsNullOrEmpty(r.ComprovanteUrl)
                    )
                    .OrderByDescending(r => r.TimestampMarcacao)
                    .Select(r => new ComprovanteDto
                    {
                        Id = r.Id,
                        TimestampMarcacao = r.TimestampMarcacao,
                        Tipo = r.Tipo,
                        ComprovanteUrl = r.ComprovanteUrl // Aqui vem: "http://localhost:8081/..." ou "guid/arquivo.pdf"
                    })
                    .ToListAsync(); // <--- Materializa na memória aqui

                if (comprovantes == null || !comprovantes.Any())
                {
                    return new ServiceResponse<List<ComprovanteDto>> { Success = true, Data = new List<ComprovanteDto>() };
                }

                // 2. Processamento Pós-Busca (Assinatura das URLs)
                foreach (var item in comprovantes)
                {
                    // Verificação de Segurança: Se for link antigo do Supabase, mantém
                    if (item.ComprovanteUrl.Contains("supabase.co"))
                        continue;

                    // Limpeza: Se o banco tiver "http://localhost:8081/comprovantes/guid.pdf",
                    // precisamos extrair só "guid.pdf" ou "pasta/guid.pdf" para o MinIO achar.
                    string objectKey = item.ComprovanteUrl;

                    // Remove prefixos locais antigos se existirem
                    // Ajuste essa string conforme o que exatamente está salvo no seu banco
                    if (objectKey.Contains("localhost:8081/"))
                    {
                        // Remove tudo até o localhost e a barra, pegando só o final
                        objectKey = objectKey.Replace("http://localhost:8081/", "").Replace("https://localhost:8081/", "");

                        // Se o seu MinIO espera "guid/arquivo.pdf" e o localhost tinha prefixo extra, limpe aqui.
                    }

                    // GERA A URL ASSINADA (Válida por 2 horas, por exemplo)
                    // Isso vai retornar: https://minio-seu-dominio.com/bucket/arquivo.pdf?token=XYZ...
                    item.ComprovanteUrl = await _minioService.GetPresignedUrlAsync(objectKey);
                }

                return new ServiceResponse<List<ComprovanteDto>> { Success = true, Data = comprovantes };
            }
            catch (Exception ex)
            {
                return new ServiceResponse<List<ComprovanteDto>> { Success = false, ErrorMessage = $"Erro ao recuperar comprovantes: {ex.Message}" };
            }
        }
    }
}