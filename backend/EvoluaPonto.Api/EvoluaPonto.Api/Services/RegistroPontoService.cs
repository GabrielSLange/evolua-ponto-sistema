using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Enums;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
namespace EvoluaPonto.Api.Services
{
    public class RegistroPontoService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly SupabaseStorageService _storageService;
        private readonly ComprovanteService _comprovanteService;
        private readonly DigitalSignatureService _signatureService;

        public RegistroPontoService(AppDbContext context, IHttpContextAccessor httpContextAcessor, SupabaseStorageService storageService,
            ComprovanteService comprovanteService, DigitalSignatureService signatureService)
        {
            _context = context;
            _httpContextAccessor = httpContextAcessor;
            _storageService = storageService;
            _comprovanteService = comprovanteService;
            _signatureService = signatureService;

        }

        public async Task<ServiceResponse<ModelRegistroPonto>> RegistrarPontoAsync(RegistroPontoDto pontoDto)
        {
            ModelFuncionario? funcionarioBanco = await _context.Funcionarios
                                                                .Include(f => f.Estabelecimento)
                                                                .ThenInclude(est => est.Empresa)
                                                                .FirstOrDefaultAsync(tb => tb.Id == pontoDto.FuncionarioId);

            if (funcionarioBanco is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Funcionário não encontrado com o ID informado" };

            ModelEstabelecimento? estabelecimentoBanco = funcionarioBanco.Estabelecimento;
            ModelEmpresa? empresaBanco = estabelecimentoBanco?.Empresa;

            if (estabelecimentoBanco is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Estabelecimento associado ao funcionário não encontrada" };

            if (empresaBanco is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Empresa associada ao funcionário não encontrada" };

            string? fotoUrl = null;

            if (pontoDto.Foto != null)
            {
                fotoUrl = await _storageService.UploadAsync(pontoDto.Foto, pontoDto.FuncionarioId);
            }

            DateTime timestamp = DateTime.UtcNow;
            string? ipAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

            long ultimoNsr = await _context.RegistrosPonto
                                  .Where(p => p.Funcionario.Estabelecimento.EmpresaId == funcionarioBanco.Estabelecimento.EmpresaId)
                                  .MaxAsync(p => (long?)p.Nsr) ?? 0;
            long novoNsr = ultimoNsr + 1;

            string dadosParaHash = $"{novoNsr}{funcionarioBanco.Cpf}{timestamp:yyyyMMddHHmmss}{empresaBanco.Cnpj}";
            string hash = GerarHashSha256(dadosParaHash);

            ModelRegistroPonto novoRegistro = new ModelRegistroPonto
            {
                FuncionarioId = pontoDto.FuncionarioId,
                TimestampMarcacao = timestamp,
                Tipo = pontoDto.Tipo,
                FotoUrl = fotoUrl,
                GeolocalizacaoIp = ipAddress,
                Nsr = novoNsr,
                HashSha256 = hash,
                CreatedAt = DateTime.UtcNow
            };

            byte[]? pdfBytes = _comprovanteService.GerarComprovante(novoRegistro, funcionarioBanco, empresaBanco, estabelecimentoBanco);

            byte[]? pdfAssinadoBytes = _signatureService.SignPdf(pdfBytes);

            if(pdfAssinadoBytes is null)
            {
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Erro ao assinar PDF" };
            }

            // 9. Salvar o PDF no Storage
            var nomeArquivoPdf = $"comprovante_{novoRegistro.Nsr}.pdf";
            var comprovanteUrl = await _storageService.UploadBytesAsync(pdfAssinadoBytes, pontoDto.FuncionarioId, nomeArquivoPdf, "application/pdf");

            // 10. Atualizar o registro de ponto com a URL do comprovante
            novoRegistro.ComprovanteUrl = comprovanteUrl;


            await _context.RegistrosPonto.AddAsync(novoRegistro);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelRegistroPonto> { Data = novoRegistro };
        }

        private static string GerarHashSha256(string input)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
                var builder = new StringBuilder();
                foreach (var b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString();
            }
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
                var fimUtc = DateTime.SpecifyKind(dataFim.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

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
