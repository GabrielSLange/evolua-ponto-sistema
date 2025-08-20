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

        public RegistroPontoService(AppDbContext context, IHttpContextAccessor httpContextAcessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAcessor;
        }

        public async Task<ServiceResponse<ModelRegistroPonto>> RegistrarPontoAsync(RegistroPontoDto pontoDto, Guid funcionarioId)
        {
            ModelFuncionario? funcionarionBanco = await _context.Funcionarios.AsNoTracking().FirstOrDefaultAsync(tb => tb.Id == funcionarioId);

            if (funcionarionBanco is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Funcionário não encontrado com o ID informado" };

            ModelEmpresa? empresaBanco = await _context.Empresas.AsNoTracking().FirstOrDefaultAsync(tb => tb.Id == funcionarionBanco.EmpresaId);

            if (empresaBanco is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Empresa associada ao funcionário não encontrada" };

            string? fotoUrl = null;

            if (pontoDto.Foto != null)
            {
                fotoUrl = $"https://simulacao.storage.com/{funcionarioId}/{DateTime.UtcNow.Ticks}.jpg";
            }

            DateTime timestamp = DateTime.UtcNow;
            string? ipAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

            long ultimoNsr = await _context.RegistrosPonto
                                  .Where(p => p.Funcionario.EmpresaId == funcionarionBanco.EmpresaId)
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
