using System.Net.Http.Headers;

namespace EvoluaPonto.Api.Services.External
{
    public class SupabaseAdminService
    {
        private readonly HttpClient _httpClient;
        private readonly string _supabaseUrl;
        private readonly string _supabaseServiceKey;

        public SupabaseAdminService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClient = httpClientFactory.CreateClient("SupabaseAdmin");
            _supabaseUrl = configuration["Supabase:Url"] ?? throw new ArgumentNullException("Supabase:Url");
            _supabaseServiceKey = configuration["Supabase:ServiceRoleKey"] ?? throw new ArgumentNullException("Supabase:ServiceRoleKey");

            _httpClient.BaseAddress = new Uri($"{_supabaseUrl}/auth/v1/");
            _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseServiceKey);
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseServiceKey);
        }

        public async Task<(SupabaseUserResponse? User, string? Error)> CreateAuthUserAsync(string email, string password, string role)
        {
            var payload = new { email, password, app_metadata = new { role }, email_confirm = true };
            var response = await _httpClient.PostAsJsonAsync("admin/users", payload);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return (null, error);
            }

            var supabaseUser = await response.Content.ReadFromJsonAsync<SupabaseUserResponse>();
            return (supabaseUser, null);
        }
    }
}
