using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;

namespace EvoluaPonto.Api.Services
{
    public class SupabaseStorageService
    {
        private readonly HttpClient _httpClient;
        private readonly string _supabaseUrl;
        private readonly string _supabaseServiceKey;

        public SupabaseStorageService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _supabaseUrl = configuration["Supabase:Url"] ?? throw new ArgumentNullException("Supabase:Url");
            _supabaseServiceKey = configuration["Supabase:ServiceRoleKey"] ?? throw new ArgumentNullException("Supabase:ServiceRoleKey");

            _httpClient = httpClientFactory.CreateClient("SupabaseStorage");
        }

        public async Task<string?> UploadAsync(IFormFile file, Guid funcionarioId)
        {
            try
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                string originalFileName = Path.GetFileNameWithoutExtension(file.FileName);
                string fileExtension = Path.GetExtension(file.FileName);
                string sanitizedFileName = SanitizeFileName(originalFileName);

                if (string.IsNullOrWhiteSpace(sanitizedFileName))
                {
                    sanitizedFileName = "foto_ponto";
                }

                string folderName = funcionarioId.ToString("N"); // Guid sem hifens
                string filePath = $"{folderName}/{sanitizedFileName}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{fileExtension}";
                string bucketName = "fotos-ponto";

                // --- A LÓGICA DE UPLOAD MANUAL ---
                var requestUrl = $"{_supabaseUrl}/storage/v1/object/{bucketName}/{filePath}";

                var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);

                // Configura os cabeçalhos obrigatórios
                request.Headers.Add("apikey", _supabaseServiceKey);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseServiceKey);

                // Configura o conteúdo do arquivo
                var content = new ByteArrayContent(fileBytes);
                content.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
                request.Content = content;

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    // Se falhar, podemos logar o erro para depuração futura
                    var error = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Erro no upload para o Supabase: {error}");
                    return null;
                }

                // Monta a URL pública manualmente
                var publicUrl = $"{_supabaseUrl}/storage/v1/object/public/{bucketName}/{filePath}";

                return publicUrl;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exceção no serviço de storage: {ex.Message}");
                return null;
            }
        }

        // A função de limpeza continua a mesma
        private static string SanitizeFileName(string fileName)
        {
            var normalizedString = fileName.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            fileName = stringBuilder.ToString().Normalize(NormalizationForm.FormC);
            fileName = fileName.ToLowerInvariant();
            fileName = Regex.Replace(fileName, @"\s+", "_", RegexOptions.Compiled);
            fileName = Regex.Replace(fileName, @"[^a-z0-9_\-\.]", "", RegexOptions.Compiled);

            return fileName;
        }
    }
}