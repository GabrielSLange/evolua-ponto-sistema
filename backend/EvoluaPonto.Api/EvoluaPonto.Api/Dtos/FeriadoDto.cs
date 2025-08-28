using System.Text.Json.Serialization;

namespace EvoluaPonto.Api.Dtos
{
    // Este DTO representa a estrutura de um feriado, conforme retornado pela BrasilAPI.
    public class FeriadoDto
    {
        [JsonPropertyName("date")]
        public string Data { get; set; } // Formato "YYYY-MM-DD"

        [JsonPropertyName("name")]
        public string Nome { get; set; }

        [JsonPropertyName("type")]
        public string Tipo { get; set; }
    }
}