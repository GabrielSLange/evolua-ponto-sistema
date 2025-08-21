using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
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

        public RegistroPontoService(AppDbContext context, IHttpContextAccessor httpContextAcessor, SupabaseStorageService storageService, ComprovanteService comprovanteService)
        {
            _context = context;
            _httpContextAccessor = httpContextAcessor;
            _storageService = storageService;
            _comprovanteService = comprovanteService;
        }

        public async Task<ServiceResponse<ModelRegistroPonto>> RegistrarPontoAsync(RegistroPontoDto pontoDto, Guid funcionarioId)
        {
            ModelFuncionario? funcionarionBanco = await _context.Funcionarios.AsNoTracking().FirstOrDefaultAsync(tb => tb.Id == funcionarioId);

            if (funcionarionBanco is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Funcionário não encontrado com o ID informado" };

            ModelEmpresa? empresaBanco = await _context.Empresas.AsNoTracking().FirstOrDefaultAsync(tb => tb.Id == funcionarionBanco.Estabelecimento.EmpresaId);

            if (empresaBanco is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Empresa associada ao funcionário não encontrada" };

            string? fotoUrl = null;

            if (pontoDto.Foto != null)
            {
                fotoUrl = await _storageService.UploadAsync(pontoDto.Foto, funcionarioId);
            }

            DateTime timestamp = DateTime.UtcNow;
            string? ipAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

            long ultimoNsr = await _context.RegistrosPonto
                                  .Where(p => p.Funcionario.Estabelecimento.EmpresaId == funcionarionBanco.Estabelecimento.EmpresaId)
                                  .MaxAsync(p => (long?)p.Nsr) ?? 0;
            long novoNsr = ultimoNsr + 1;

            string dadosParaHash = $"{novoNsr}{funcionarionBanco.Cpf}{timestamp:yyyyMMddHHmmss}{empresaBanco.Cnpj}";
            string hash = GerarHashSha256(dadosParaHash);

            ModelRegistroPonto novoRegistro = new ModelRegistroPonto
            {
                FuncionarioId = funcionarioId,
                TimestampMarcacao = timestamp,
                Tipo = pontoDto.Tipo,
                FotoUrl = fotoUrl,
                GeolocalizacaoIp = ipAddress,
                Nsr = novoNsr,
                HashSha256 = hash,
                CreatedAt = DateTime.UtcNow
            };

            var pdfBytes = _comprovanteService.GerarComprovante(novoRegistro, funcionarionBanco, empresaBanco);

            // 9. Salvar o PDF no Storage
            var nomeArquivoPdf = $"comprovante_{novoRegistro.Nsr}.pdf";
            var comprovanteUrl = await _storageService.UploadBytesAsync(pdfBytes, funcionarioId, nomeArquivoPdf, "application/pdf");

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
    }
}
