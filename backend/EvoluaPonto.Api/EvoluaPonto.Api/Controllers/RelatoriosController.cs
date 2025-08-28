using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;
using System.Text;

namespace EvoluaPonto.Api.Controllers
{
    [Authorize] // Protege todos os endpoints de relatório
    [ApiController]
    [Route("api/relatorios")]
    public class RelatoriosController : ControllerBase
    {
        private readonly AfdService _afdService;
        private readonly DigitalSignatureService _signatureService;
        private readonly JornadaService _jornadaService;
        private readonly EspelhoPontoService _espelhoPontoService;
        private readonly AejService _aejService;

        public RelatoriosController(
           AfdService afdService,
           DigitalSignatureService signatureService,
           JornadaService jornadaService,
           EspelhoPontoService espelhoPontoService,
           AejService aejService) // Adiciona o novo serviço
        {
            _afdService = afdService;
            _signatureService = signatureService;
            _jornadaService = jornadaService;
            _espelhoPontoService = espelhoPontoService;
            _aejService = aejService; // Atribui o novo serviço
        }

        // GET: api/relatorios/afd?estabelecimentoId=...&dataInicio=...&dataFim=...
        [HttpGet("afd")]
        public async Task<IActionResult> GerarAfd([FromQuery] Guid estabelecimentoId, [FromQuery] DateTime dataInicio, [FromQuery] DateTime dataFim)
        {
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

        [HttpGet("espelho-ponto")]
        public async Task<IActionResult> GerarEspelhoPonto([FromQuery] Guid funcionarioId, [FromQuery] int ano, [FromQuery] int mes)
        {
            try
            {
                // Etapa 1: Chamar o serviço de cálculo para obter os dados processados.
                var response = await _jornadaService.CalcularEspelhoPontoAsync(funcionarioId, ano, mes);

                // Etapa 2: Verificar se o cálculo foi bem-sucedido.
                if (!response.Success || response.Data == null)
                {
                    return BadRequest(response.ErrorMessage ?? "Ocorreu um erro ao calcular os dados da jornada.");
                }

                // Etapa 3: Passar os dados calculados para o serviço de geração de PDF.
                var pdfBytes = _espelhoPontoService.GerarEspelhoPontoPDF(response.Data);

                // Etapa 4: Retornar o PDF como um arquivo para download.
                var nomeArquivo = $"EspelhoPonto_{response.Data.Funcionario.Nome.Replace(" ", "_")}_{ano}-{mes:00}.pdf";

                return File(pdfBytes, "application/pdf", nomeArquivo);
            }
            catch (Exception ex)
            {
                // Captura exceções inesperadas durante o processo.
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
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
    }
}