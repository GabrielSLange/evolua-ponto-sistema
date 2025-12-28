using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Dtos;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Enums;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
namespace EvoluaPonto.Api.Services
{
    public class RegistroPontoService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly MinioService _minioService;
        private readonly ComprovanteService _comprovanteService;
        private readonly DigitalSignatureService _signatureService;


        public RegistroPontoService(AppDbContext context, IHttpContextAccessor httpContextAcessor, MinioService minioService,
            ComprovanteService comprovanteService, DigitalSignatureService signatureService)
        {
            _context = context;
            _httpContextAccessor = httpContextAcessor;
            _minioService = minioService;
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
                GeolocalizacaoIp = ipAddress,
                Nsr = novoNsr,
                HashSha256 = hash,
                CreatedAt = DateTime.UtcNow
            };

            byte[]? pdfBytes = _comprovanteService.GerarComprovante(novoRegistro, funcionarioBanco, empresaBanco, estabelecimentoBanco);

            byte[]? pdfAssinadoBytes = _signatureService.SignPdf(pdfBytes);

            if (pdfAssinadoBytes is null)
            {
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = "Erro ao assinar PDF" };
            }

            // 9. Salvar o PDF no Storage
            var nomeArquivoPdf = $"comprovante_{novoRegistro.Nsr}.pdf";
            string caminhoMinio = $"comprovantes/{pontoDto.FuncionarioId}/{nomeArquivoPdf}";

            try
            {
                using (var stream = new MemoryStream(pdfBytes))
                {
                    await _minioService.UploadFileAsync(stream, caminhoMinio, "application/pdf");
                }

                // 5. Atualiza o objeto com o caminho do arquivo
                // IMPORTANTE: Agora salvamos o "Key" do MinIO, não uma URL https://...
                novoRegistro.ComprovanteUrl = caminhoMinio;
            }
            catch (Exception ex)
            {
                return new ServiceResponse<ModelRegistroPonto> { Success = false, ErrorMessage = $"Erro ao fazer upload do comprovante:  {nomeArquivoPdf} \nErro: {ex.Message}" };
            }


            await _context.RegistrosPonto.AddAsync(novoRegistro);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelRegistroPonto> { Data = novoRegistro };
        }

        public async Task<ServiceResponse<string>> GetUltimoPontoAsync(Guid funcionarioId)
        {
            var ultimoRegistro = await _context.RegistrosPonto
                .AsNoTracking()
                .Where(x => x.FuncionarioId == funcionarioId)
                .OrderByDescending(x => x.TimestampMarcacao)
                .FirstOrDefaultAsync();

            if (ultimoRegistro is null)
            {
                return new ServiceResponse<string>
                {
                    Success = true,
                    Data = null,
                    ErrorMessage = "Nenhum registro encontrado."
                };
            }

            // 3. Cenário: Encontrou, retorna o Tipo (Entrada/Saida)
            return new ServiceResponse<string>
            {
                Success = true,
                Data = ultimoRegistro.Tipo
            };
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

        public async Task<ServiceResponse<List<ModelRegistroPonto>>> GetHistoricoSolicitacoesAsync(Guid funcionarioId)
        {
            var response = new ServiceResponse<List<ModelRegistroPonto>>();

            try
            {
                var registros = await _context.RegistrosPonto
                    .Where(r =>
                        r.FuncionarioId == funcionarioId &&
                        r.RegistroManual == true && // Apenas solicitações manuais
                        (r.Status == StatusSolicitacao.Pendente || r.Status == StatusSolicitacao.Rejeitado)
                    )
                    .OrderByDescending(r => r.CreatedAt) // Mais recentes primeiro
                    .ToListAsync();

                response.Data = registros;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.ErrorMessage = $"Erro ao buscar histórico: {ex.Message}";
            }

            return response;
        }

        public async Task<ServiceResponse<List<ModelRegistroPonto>>> GetSolicitacoesPendentesAsync(Guid funcionarioId)
        {
            // 1. Buscar o Funcionário para obter a EmpresaId
            var funcionario = await _context.Funcionarios
                                            .Include(f => f.Estabelecimento)
                                            .FirstOrDefaultAsync(f => f.Id == funcionarioId);
            if (funcionario is null)
                return new ServiceResponse<List<ModelRegistroPonto>> { Success = false, ErrorMessage = "Funcionário não encontrado." };

            var empresaId = funcionario.Estabelecimento?.EmpresaId;
            if (empresaId is null)
                return new ServiceResponse<List<ModelRegistroPonto>> { Success = false, ErrorMessage = "Empresa do funcionário não encontrada." };

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
                string caminhoMinio = $"comprovantes/{registro.FuncionarioId}/{nomeArquivoPdf}";

                try
                {
                    using (var stream = new MemoryStream(pdfBytes))
                    {
                        await _minioService.UploadFileAsync(stream, caminhoMinio, "application/pdf");
                    }

                        // 5. Atualiza o objeto com o caminho do arquivo
                        // IMPORTANTE: Agora salvamos o "Key" do MinIO, não uma URL https://...
                        registro.ComprovanteUrl = caminhoMinio;
                }
                catch (Exception ex)
                {
                    return new ServiceResponse<bool> { Success = false, ErrorMessage = $"Erro ao fazer upload do comprovante:  {nomeArquivoPdf} \nErro: {ex.Message}" };
                }

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
