using ClosedXML.Excel;
using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace EvoluaPonto.Api.Services
{
    public class EventosService
    {
        private readonly AppDbContext _context;

        public EventosService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<EventoResponseDto>> ListarEventosDaEmpresaAsync(Guid empresaId)
        {
            return await _context.EventosProva
                .Where(e => e.EmpresaId == empresaId)
                .Select(e => new EventoResponseDto
                {
                    Id = e.Id,
                    NomeAplicacao = e.NomeAplicacao,
                    PeriodoAplicacao = e.PeriodoAplicacao,
                    TotalInscritos = e.Inscricoes.Count
                })
                .ToListAsync();
        }

        public async Task<List<AlunoResponseDto>> ListarAlunosDoEventoAsync(Guid eventoId, string? sala = null)
        {
            var query = _context.InscricoesAlunos
                .Include(i => i.Sala)
                .ThenInclude(s => s.Local)
                .Where(i => i.EventoProvaId == eventoId);

            if (!string.IsNullOrEmpty(sala))
            {
                query = query.Where(i => i.Sala.NomeSala.Contains(sala));
            }

            return await query
                .OrderBy(i => i.NomeAluno)
                .Select(i => new AlunoResponseDto
                {
                    Id = i.Id,
                    NomeAluno = i.NomeAluno,
                    NumeroCarteira = i.NumeroCarteira,
                    Curso = i.Curso,
                    Modalidade = i.Modalidade,
                    Sala = i.Sala.NomeSala,
                    Local = i.Sala.Local.Campus,
                    Bloco = i.Sala.Local.Bloco,
                    Presente = i.Presente,
                    DataHoraCheckin = i.DataHoraCheckin
                })
                .ToListAsync();
        }

        public async Task<object> RegistrarPresencaAsync(Guid inscricaoId)
        {
            var inscricao = await _context.InscricoesAlunos.FindAsync(inscricaoId);

            if (inscricao == null)
            {
                throw new KeyNotFoundException("Inscrição não encontrada.");
            }

            if (inscricao.Presente)
            {
                throw new InvalidOperationException("Presença já registrada para este aluno.");
            }

            inscricao.Presente = true;
            inscricao.DataHoraCheckin = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new
            {
                mensagem = "Presença registrada com sucesso.",
                horario = inscricao.DataHoraCheckin
            };
        }

        public async Task<object> ListarEventosDaEmpresaPaginadoAsync(Guid empresaId, int page, int pageSize, string search)
        {
            var query = _context.EventosProva.Where(e => e.EmpresaId == empresaId);

            if (!string.IsNullOrEmpty(search))
            {
                // Filtra pelo nome da aplicação ou pela string do período
                query = query.Where(e => e.NomeAplicacao.Contains(search) || e.PeriodoAplicacao.Contains(search));
            }

            var totalRecords = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

            var eventos = await query
                .OrderByDescending(e => e.PeriodoAplicacao) // Ordena para os mais recentes/alfabéticos
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EventoResponseDto
                {
                    Id = e.Id,
                    NomeAplicacao = e.NomeAplicacao,
                    PeriodoAplicacao = e.PeriodoAplicacao,
                    TotalInscritos = e.Inscricoes.Count
                })
                .ToListAsync();

            return new
            {
                data = eventos,
                totalPages = totalPages,
                currentPage = page
            };
        }
        public async Task<bool> ExcluirEventoCompletoAsync(Guid eventoId)
        {
            // Verifica se o evento existe antes de iniciar o processo
            var eventoExiste = await _context.EventosProva.AnyAsync(e => e.Id == eventoId);
            if (!eventoExiste) return false;

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. DESCOBRIR OS IDs: Vamos achar quais Salas e Locais estão vinculados a este evento
                var salasIds = await _context.InscricoesAlunos
                    .Where(i => i.EventoProvaId == eventoId)
                    .Select(i => i.SalaProvaId)
                    .Distinct()
                    .ToListAsync();

                var locaisIds = await _context.SalasProva
                    .Where(s => salasIds.Contains(s.Id))
                    .Select(s => s.LocalProvaId)
                    .Distinct()
                    .ToListAsync();

                // 2. EXECUTAR A LIMPEZA (Sempre de baixo para cima na hierarquia)

                // A. Limpa as Inscrições
                await _context.InscricoesAlunos
                    .Where(i => i.EventoProvaId == eventoId)
                    .ExecuteDeleteAsync();

                // B. Limpa as Salas vinculadas
                if (salasIds.Any())
                {
                    await _context.SalasProva
                        .Where(s => salasIds.Contains(s.Id))
                        .ExecuteDeleteAsync();
                }

                // C. Limpa os Locais vinculados
                if (locaisIds.Any())
                {
                    await _context.LocaisProva
                        .Where(l => locaisIds.Contains(l.Id))
                        .ExecuteDeleteAsync();
                }

                // D. Limpa o Evento
                await _context.EventosProva
                    .Where(e => e.Id == eventoId)
                    .ExecuteDeleteAsync();

                // Confirma a transação no banco
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                // Se der qualquer erro, desfaz tudo para não deixar o banco corrompido
                await transaction.RollbackAsync();
                throw new Exception("Erro crítico ao excluir o evento e suas dependências.", ex);
            }
        }


        public async Task<List<RelatorioPresencaDto>> GerarRelatorioPresencaAsync(Guid eventoId)
        {
            var relatorio = await _context.InscricoesAlunos
                .Where(i => i.EventoProvaId == eventoId && i.Presente == true)
                .Select(i => new RelatorioPresencaDto
                {
                    NomeAluno = i.NomeAluno,
                    Sala = i.Sala.NomeSala,
                    Bloco = i.Sala.Local.Bloco,
                    HorarioCheckin = i.DataHoraCheckin
                })
                .OrderBy(dto => dto.Sala)
                .ThenBy(dto => dto.NomeAluno)
                .ToListAsync();

            // A MÁGICA INFALÍVEL AQUI:
            foreach (var item in relatorio)
            {
                if (item.HorarioCheckin.HasValue)
                {
                    // 1. Pega a data pura do banco (19:31)
                    var dataDoBanco = item.HorarioCheckin.Value;
                    Console.WriteLine($"🔍 DADO ORIGINAL DO BANCO (UTC): {dataDoBanco:dd/MM/yyyy HH:mm} (Kind: {dataDoBanco.Kind})");

                    // 2. Força o C# a entender que isso é UTC (Londres), parando qualquer conversão automática
                    var dataUtc = DateTime.SpecifyKind(dataDoBanco, DateTimeKind.Utc);

                    // 3. Faz a matemática simples (-3 horas)
                    var dataBrasilia = dataUtc.AddHours(-3);

                    // 4. Salva como texto blindado
                    item.CheckinFormatado = dataBrasilia.ToString("dd/MM/yyyy HH:mm:ss");
                }
                else
                {
                    item.CheckinFormatado = "Sem Registro";
                }
            }

            return relatorio;
        }

        public async Task<byte[]> GerarExcelPresencaAsync(Guid eventoId)
        {
            var dadosRelatorio = await GerarRelatorioPresencaAsync(eventoId);

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Lista de Presença");

            worksheet.Cell(1, 1).Value = "Nome do Aluno";
            worksheet.Cell(1, 2).Value = "Documento";
            worksheet.Cell(1, 3).Value = "Sala";
            worksheet.Cell(1, 4).Value = "Bloco";
            worksheet.Cell(1, 5).Value = "Horário Check-in";

            var headerRow = worksheet.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

            int row = 2;
            foreach (var item in dadosRelatorio)
            {
                worksheet.Cell(row, 1).Value = item.NomeAluno;
                worksheet.Cell(row, 2).Value = item.Documento;
                worksheet.Cell(row, 3).Value = item.Sala;
                worksheet.Cell(row, 4).Value = item.Bloco;
                worksheet.Cell(row, 5).Value = item.CheckinFormatado;

                row++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);

            return stream.ToArray();
        }

        public async Task<byte[]> GerarPdfPresencaAsync(Guid eventoId)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var dadosRelatorio = await GerarRelatorioPresencaAsync(eventoId);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("Lista de Presença").FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                            col.Item().Text($"Gerado em: {DateTime.Now:dd/MM/yyyy HH:mm}");
                        });
                    });

                    page.Content().PaddingVertical(1, Unit.Centimetre).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                        });

                        table.Header(header =>
                        {
                            header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text("Nome").SemiBold();
                            header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text("Documento").SemiBold();
                            header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text("Sala").SemiBold();
                            header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text("Bloco").SemiBold();
                            header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text("Check-in").SemiBold();
                        });

                        foreach (var item in dadosRelatorio)
                        {
                            table.Cell().PaddingVertical(3).BorderBottom(1).BorderColor(Colors.Grey.Lighten4).Text(item.NomeAluno);
                            table.Cell().PaddingVertical(3).BorderBottom(1).BorderColor(Colors.Grey.Lighten4).Text(item.Documento);
                            table.Cell().PaddingVertical(3).BorderBottom(1).BorderColor(Colors.Grey.Lighten4).Text(item.Sala);
                            table.Cell().PaddingVertical(3).BorderBottom(1).BorderColor(Colors.Grey.Lighten4).Text(item.Bloco);
                            table.Cell().PaddingVertical(3).BorderBottom(1).BorderColor(Colors.Grey.Lighten4).Text(item.CheckinFormatado);
                        }
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Página ");
                        x.CurrentPageNumber();
                        x.Span(" de ");
                        x.TotalPages();
                    });
                });
            });

            return document.GeneratePdf();
        }
    }
}