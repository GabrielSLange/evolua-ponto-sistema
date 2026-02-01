using System.Text.Json.Serialization;

namespace EvoluaPonto.Api.Dtos
{
    // Este DTO representa a estrutura de um feriado, conforme retornado pela BrasilAPI.
    public class FeriadoDto
    {
        [JsonPropertyName("date")]
        public string Data { get; set; } // Formato "YYYY-MM-DD"

        [JsonPropertyName("localName")]
        public string Nome { get; set; }

        [JsonPropertyName("global")]
        public bool Global { get; set; }

        [JsonPropertyName("types")]
        public List<string> Tipo { get; set; }
    }
}