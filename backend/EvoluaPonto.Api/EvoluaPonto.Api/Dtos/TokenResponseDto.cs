using EvoluaPonto.Api.Services;
using System.Text.Json.Serialization;

namespace EvoluaPonto.Api.Dtos
{
    // Este DTO mapeia a resposta de sucesso da API de token do Supabase
    public class TokenResponseDto
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; }

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; set; }

        [JsonPropertyName("user")]
        public SupabaseUserResponse User { get; set; }
    }
}