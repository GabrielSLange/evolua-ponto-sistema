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

        public async Task<ServiceResponse<ModelRegistroPonto>> SolicitarPontoAsync(SolicitacaoRegistroDto solicitacaoDto)
        {
            ModelFuncionario? funcionarioBanco = await _context.Funcionarios
                                                                .Include(f => f.Estabelecimento)
                                                                .ThenInclude(est => est.Empresa)
                                                                .FirstOrDefaultAsync(tb => tb.Id == solicitacaoDto.FuncionarioId);

            if (funcionarioBanco is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Funcionário não encontrado." };

            if (funcionarioBanco.Estabelecimento is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Estabelecimento não encontrado." };
            
            if (funcionarioBanco.Estabelecimento.Empresa is null)
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Empresa não encontrada." };

            // Tratamento de Data (Segurança para o PostgreSQL)
            // Garante que o horário enviado seja gravado como UTC no banco
            var horarioUtc = DateTime.SpecifyKind(solicitacaoDto.Horario, DateTimeKind.Utc);

            // Criação do Objeto (Sem NSR, Sem Hash, Sem Foto)
            ModelRegistroPonto novaSolicitacao = new ModelRegistroPonto
            {
                FuncionarioId = solicitacaoDto.FuncionarioId,
                TimestampMarcacao = horarioUtc,
                Tipo = solicitacaoDto.Tipo,
                
                // Configuração de Solicitação Manual
                RegistroManual = true, 
                Status = StatusSolicitacao.Pendente,
                JustificativaFuncionario = solicitacaoDto.Justificativa,
                
                // Campos de Controle
                FotoUrl = null,
                CreatedAt = DateTime.UtcNow
            };

            await _context.RegistrosPonto.AddAsync(novaSolicitacao);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelRegistroPonto> { Success = true, Data = novaSolicitacao, ErrorMessage = "Solicitação enviada com sucesso." };
        }

        public async Task<ServiceResponse<List<ModelRegistroPonto>>> GetSolicitacoesPendentesAsync(Guid empresaId)
        {
            // Busca registros onde Status == Pendente e a empresa é a do Admin
            var pendentes = await _context.RegistrosPonto
                                            .Include(r => r.Funcionario) // Para mostrar o nome de quem pediu
                                            .Where(r =>
                                                r.Status == StatusSolicitacao.Pendente &&
                                                r.Funcionario.Estabelecimento.EmpresaId == empresaId
                                            )
                                            .OrderByDescending(r => r.CreatedAt)
                                            .ToListAsync();

            return new ServiceResponse<List<ModelRegistroPonto>> { Data = pendentes };
        }

        public async Task<ServiceResponse<bool>> AvaliarSolicitacaoAsync(long id, AvaliarSolicitacaoDto avaliacaoDto)
        {
            // 1. Buscar a solicitação
            // Precisamos dos Includes (Funcionario, Empresa, etc) para gerar o PDF se for aprovado
            var registro = await _context.RegistrosPonto
                                            .Include(r => r.Funcionario)
                                            .ThenInclude(f => f.Estabelecimento)
                                            .ThenInclude(e => e.Empresa)
                                            .FirstOrDefaultAsync(r => r.Id == id);

            if (registro is null)
                return new ServiceResponse<bool> { Success = false, ErrorMessage = "Solicitação não encontrada." };

            if (registro.Status != StatusSolicitacao.Pendente)
                return new ServiceResponse<bool> { Success = false, ErrorMessage = "Esta solicitação já foi avaliada." };

            // 2. Caminho da Rejeição
            if (!avaliacaoDto.Aprovado)
            {
                registro.Status = StatusSolicitacao.Rejeitado;
                registro.JustificativaAdmin = avaliacaoDto.JustificativaAdmin;

                await _context.SaveChangesAsync();
                return new ServiceResponse<bool> { Success = true, Data = true, ErrorMessage = "Solicitação rejeitada com sucesso." };
            }

            // 3. Caminho da Aprovação (Transformar em Ponto Oficial)
            try
            {
                registro.Status = StatusSolicitacao.Aprovado;
                registro.JustificativaAdmin = avaliacaoDto.JustificativaAdmin;

                // --- Geração de Dados Fiscais (Cópia da lógica de RegistrarPontoAsync) ---

                // A. Gerar NSR (Número Sequencial de Registro)
                long ultimoNsr = await _context.RegistrosPonto
                                                  .Where(p => p.Funcionario.Estabelecimento.EmpresaId == registro.Funcionario.Estabelecimento.EmpresaId)
                                                  .MaxAsync(p => (long?)p.Nsr) ?? 0;

                registro.Nsr = ultimoNsr + 1;

                // B. Gerar Hash SHA256
                // Padrão: NSR + CPF + DATAHORA + CNPJ
                string dadosParaHash = $"{registro.Nsr}{registro.Funcionario.Cpf}{registro.TimestampMarcacao:yyyyMMddHHmmss}{registro.Funcionario.Estabelecimento.Empresa.Cnpj}";
                registro.HashSha256 = GerarHashSha256(dadosParaHash); // Reutiliza seu método privado existente

                // C. Gerar e Assinar PDF
                byte[]? pdfBytes = _comprovanteService.GerarComprovante(registro, registro.Funcionario, registro.Funcionario.Estabelecimento.Empresa, registro.Funcionario.Estabelecimento);
                byte[]? pdfAssinadoBytes = _signatureService.SignPdf(pdfBytes);

                if (pdfAssinadoBytes is null)
                    return new ServiceResponse<bool> { Success = false, ErrorMessage = "Erro ao assinar o comprovante na aprovação." };

                // D. Salvar PDF no Storage
                var nomeArquivoPdf = $"comprovante_{registro.Nsr}.pdf";
                var comprovanteUrl = await _storageService.UploadBytesAsync(pdfAssinadoBytes, registro.FuncionarioId, nomeArquivoPdf, "application/pdf");

                registro.ComprovanteUrl = comprovanteUrl;

                // 4. Salvar tudo
                await _context.SaveChangesAsync();

                return new ServiceResponse<bool> { Success = true, Data = true, ErrorMessage = "Solicitação aprovada e comprovante gerado com sucesso." };
            }
            catch (Exception ex)
            {
                return new ServiceResponse<bool> { Success = false, ErrorMessage = $"Erro ao processar aprovação: {ex.Message}" };
            }
        }
    }
}
