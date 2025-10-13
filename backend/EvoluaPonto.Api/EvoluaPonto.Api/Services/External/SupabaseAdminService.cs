using EvoluaPonto.Api.Dtos;
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

        public async Task<(SupabaseUserResponse? User, string? Error)> UpdateAuthUserAsync(string userId,string email, string role)
        {
            var payload = new { email, app_metadata = new { role }, email_confirm = true };
            var response = await _httpClient.PutAsJsonAsync($"admin/users/{userId}", payload);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return (null, error);
            }

            var supabaseUser = await response.Content.ReadFromJsonAsync<SupabaseUserResponse>();
            return (supabaseUser, null);
        }

        /// <summary>
        /// Autentica um usuário na API do Supabase Auth usando email e senha.
        /// </summary>
        public async Task<(TokenResponseDto? data, string? error)> SignInUserAsync(string email, string password)
        {
            var url = $"{_supabaseUrl}/auth/v1/token?grant_type=password";
            var payload = new { email, password };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(url, payload);

                if (response.IsSuccessStatusCode)
                {
                    var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponseDto>();
                    return (tokenResponse, null);
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return (null, errorContent);
                }
            }
            catch (Exception ex)
            {
                return (null, ex.Message);
            }
        }

        /// <summary>
        /// Renova um access_token usando um refresh_token na API do Supabase Auth.
        /// </summary>
        public async Task<(TokenResponseDto? data, string? error)> RefreshTokenAsync(string refreshToken)
        {
            var url = $"{_supabaseUrl}/auth/v1/token?grant_type=refresh_token";
            var payload = new { refresh_token = refreshToken };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(url, payload);

                if (response.IsSuccessStatusCode)
                {
                    var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponseDto>();
                    return (tokenResponse, null);
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return (null, errorContent);
                }
            }
            catch (Exception ex)
            {
                return (null, ex.Message);
            }
        }
    }
}
