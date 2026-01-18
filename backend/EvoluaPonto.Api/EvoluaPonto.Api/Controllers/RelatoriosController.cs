using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using System.IO.Compression;
using System.Text;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("relatorios")]
    public class RelatoriosController : ControllerBase
    {
        private readonly AfdService _afdService;
        private readonly DigitalSignatureService _signatureService;
        private readonly JornadaService _jornadaService;
        private readonly EspelhoPontoService _espelhoPontoService;
        private readonly AejService _aejService;
        private readonly RelatorioExcelService _relatorioExcelService;

        public RelatoriosController(
           AfdService afdService,
           DigitalSignatureService signatureService,
           JornadaService jornadaService,
           EspelhoPontoService espelhoPontoService,
           AejService aejService,
           RelatorioExcelService relatorioExcelService) // Adiciona o novo serviço
        {
            _afdService = afdService;
            _signatureService = signatureService;
            _jornadaService = jornadaService;
            _espelhoPontoService = espelhoPontoService;
            _aejService = aejService; // Atribui o novo serviço
            _relatorioExcelService = relatorioExcelService;
        }

        // GET: api/relatorios/afd?estabelecimentoId=...&dataInicio=...&dataFim=...
        [HttpGet("afd")]
        public async Task<IActionResult> GerarAfd([FromQuery] Guid estabelecimentoId, [FromQuery] DateTime dataInicio, [FromQuery] DateTime dataFim)
        {
            dataInicio = dataInicio.Date;
            dataFim = dataFim.Date.AddDays(1).AddTicks(-1);
            try
            {
                // Etapa 1: Gerar o conteúdo do arquivo AFD (.txt)
                string afdContent = await _afdService.GerarAfdAsync(estabelecimentoId, dataInicio, dataFim);
                var afdBytes = Encoding.ASCII.GetBytes(afdContent);
                var baseFileName = $"AFD_{dataInicio:yyyyMMdd}_{dataFim:yyyyMMdd}";

                // Etapa 2: Assinar os bytes do AFD para gerar o conteúdo do arquivo .p7s
                var signatureBytes = _signatureService.SignBytesCadesDetached(afdBytes);

                // Etapa 3: Criar um arquivo .zip em memória
                using (var memoryStream = new MemoryStream())
                {
                    // Abre o arquivo .zip para escrita
                    using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                    {
                        // Adiciona o arquivo AFD.txt ao zip
                        var afdEntry = archive.CreateEntry($"{baseFileName}.txt", CompressionLevel.Fastest);
                        using (var entryStream = afdEntry.Open())
                        {
                            await entryStream.WriteAsync(afdBytes, 0, afdBytes.Length);
                        }

                        // Adiciona o arquivo de assinatura AFD.p7s ao zip
                        var sigEntry = archive.CreateEntry($"{baseFileName}.p7s", CompressionLevel.Fastest);
                        using (var entryStream = sigEntry.Open())
                        {
                            await entryStream.WriteAsync(signatureBytes, 0, signatureBytes.Length);
                        }
                    }

                    // Etapa 4: Retorna o arquivo .zip completo para download
                    return File(memoryStream.ToArray(), "application/zip", $"{baseFileName}.zip");
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("espelho-ponto/{funcionarioId}")]
        public async Task<IActionResult> GetEspelhoIndividual(Guid funcionarioId, [FromQuery] int ano, [FromQuery] int mesInicio, [FromQuery] int mesFim)
        {
            var response = await _jornadaService.CalcularEspelhoPontoAgrupadoAsync(funcionarioId, ano, mesInicio, mesFim);

            if (!response.Success) return BadRequest(response.ErrorMessage);

            // Gera o PDF (QuestPDF)
            var document = new EspelhoPontoDocument(response.Data);
            var pdfBytes = document.GeneratePdf();

            // Assina (opcional)
            var pdfAssinado = _signatureService.SignPdf(pdfBytes);

            var nomeArquivo = $"{response.Data.Funcionario.Nome}_Espelho.pdf";
            return File(pdfAssinado, "application/pdf", nomeArquivo);
        }

        [HttpPost("espelho-ponto/lote")]
        public async Task<IActionResult> GetEspelhoLote([FromBody] FiltroDownloadLoteDto filtro)
        {
            using var memoryStream = new MemoryStream();

            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                foreach (var funcionarioId in filtro.FuncionariosIds)
                {
                    try
                    {
                        // Busca dados
                        var response = await _jornadaService.CalcularEspelhoPontoAgrupadoAsync(funcionarioId, filtro.Ano, filtro.MesInicio, filtro.MesFim);

                        if (response.Success)
                        {
                            // Gera PDF
                            var document = new EspelhoPontoDocument(response.Data);
                            var pdfBytes = document.GeneratePdf();

                            // Assina
                            var pdfAssinado = _signatureService.SignPdf(pdfBytes);

                            // Adiciona ao ZIP
                            var nomeLimpo = response.Data.Funcionario.Nome.Trim().Replace(" ", "_");
                            var entry = archive.CreateEntry($"{nomeLimpo}.pdf");

                            using var entryStream = entry.Open();
                            await entryStream.WriteAsync(pdfAssinado, 0, pdfAssinado.Length);
                        }
                    }
                    catch (Exception ex)
                    {
                        // Loga erro mas não para o loop, cria um TXT de erro dentro do zip
                        var errorEntry = archive.CreateEntry($"ERRO_{funcionarioId}.txt");
                        using var writer = new StreamWriter(errorEntry.Open());
                        writer.Write(ex.Message);
                    }
                }
            }

            memoryStream.Position = 0;
            return File(memoryStream.ToArray(), "application/zip", $"Fechamento_{filtro.MesInicio}-{filtro.MesFim}_{filtro.Ano}.zip");
        }

        [HttpGet("aej")]
        public async Task<IActionResult> GerarAej([FromQuery] Guid estabelecimentoId, [FromQuery] DateTime dataInicio, [FromQuery] DateTime dataFim)
        {
            try
            {
                // Etapa 1: Gerar o conteúdo do arquivo AEJ (.txt)
                string aejContent = await _aejService.GerarAejAsync(estabelecimentoId, dataInicio, dataFim);
                var aejBytes = Encoding.ASCII.GetBytes(aejContent);
                var baseFileName = $"AEJ_{dataInicio:yyyyMMdd}_{dataFim:yyyyMMdd}";

                // Etapa 2: Assinar os bytes do AEJ para gerar o conteúdo do arquivo .p7s
                var signatureBytes = _signatureService.SignBytesCadesDetached(aejBytes);

                // Etapa 3: Criar um arquivo .zip em memória
                using (var memoryStream = new MemoryStream())
                {
                    using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                    {
                        // Adiciona o arquivo AEJ.txt ao zip
                        var aejEntry = archive.CreateEntry($"{baseFileName}.txt", CompressionLevel.Fastest);
                        using (var entryStream = aejEntry.Open())
                        {
                            await entryStream.WriteAsync(aejBytes, 0, aejBytes.Length);
                        }

                        // Adiciona o arquivo de assinatura AEJ.p7s ao zip
                        var sigEntry = archive.CreateEntry($"{baseFileName}.p7s", CompressionLevel.Fastest);
                        using (var entryStream = sigEntry.Open())
                        {
                            await entryStream.WriteAsync(signatureBytes, 0, signatureBytes.Length);
                        }
                    }

                    // Etapa 4: Retorna o arquivo .zip completo para download
                    return File(memoryStream.ToArray(), "application/zip", $"{baseFileName}.zip");
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("excel-em-lote")]
        public async Task<IActionResult> GerarRelatorioExcelLote([FromBody] RelatorioLoteRequest request)
        {
            if (request.FuncionariosIds == null || !request.FuncionariosIds.Any())
                return BadRequest("Selecione ao menos um funcionário.");

            try
            {
                // MUDANÇA: Passamos Inicio e Fim agora
                var arquivoBytes = await _relatorioExcelService.GerarRelatorioEspelhoPontoExcelAsync(
                    request.FuncionariosIds,
                    request.Ano,
                    request.MesInicio,
                    request.MesFim
                );

                var nomeArquivo = $"Espelhos_Ponto_{request.MesInicio:D2}_a_{request.MesFim:D2}_{request.Ano}.xlsx";

                return File(arquivoBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nomeArquivo);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERRO FATAL EXCEL: {ex.Message} \n {ex.StackTrace}");
                return StatusCode(500, "Erro ao gerar Excel: " + ex.Message);
            }
        }
    }
}