using Supabase.Storage;

namespace EvoluaPonto.Api.Services.External
{
    public class SupabaseStorageService
    {
        private readonly Client _storageClient;
        private readonly string _supabaseUrl;

        public SupabaseStorageService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _supabaseUrl = configuration["Supabase:Url"] ?? throw new ArgumentNullException("Supabase:Url");
            var supabaseKey = configuration["Supabase:ServiceRoleKey"] ?? throw new ArgumentNullException("Supabase:Url");

            // Inicializa o cliente de Storage
            _storageClient = new Client(_supabaseUrl, new Dictionary<string, string>
            {
                { "Authorization", $"Bearer {supabaseKey}" },
                { "apikey", supabaseKey }
            });
        }

        public async Task<string> UploadAsync(IFormFile file, Guid funcionarioId)
        {
            // Lê o arquivo para um array de bytes
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();

            // Define o caminho no Storage: ex: 'fotos-ponto/f2ed2142-48ef-4f26-8d65-13026a748250/1660849382.jpg'
            string fileExtension = Path.GetExtension(file.FileName);
            string filePath = $"{funcionarioId}/{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{fileExtension}";
            string bucketName = "fotos-ponto"; // Nome do "balde" (pasta) onde guardaremos as fotos

            // Faz o upload do arquivo
            await _storageClient.From(bucketName).Upload(fileBytes, filePath);

            // Obtém a URL pública do arquivo que acabamos de subir
            var publicUrl = _storageClient.From(bucketName).GetPublicUrl(filePath);

            return publicUrl;
        }
    }
}