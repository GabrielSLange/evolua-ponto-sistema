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

        public RelatoriosController(AfdService afdService, DigitalSignatureService signatureService)
        {
            _afdService = afdService;
            _signatureService = signatureService;
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
    }
}