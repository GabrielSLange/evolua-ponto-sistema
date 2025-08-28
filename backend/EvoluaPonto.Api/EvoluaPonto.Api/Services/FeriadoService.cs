using EvoluaPonto.Api.Dtos;

namespace EvoluaPonto.Api.Services
{
    public class FeriadoService
    {
        private readonly HttpClient _httpClient;

        public FeriadoService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        /// <summary>
        /// Busca a lista de feriados nacionais de um determinado ano na BrasilAPI.
        /// </summary>
        /// <param name="ano">O ano para o qual os feriados serão buscados.</param>
        /// <returns>Uma lista de FeriadoDto ou null em caso de falha.</returns>
        public async Task<List<FeriadoDto>?> GetFeriadosNacionaisAsync(int ano)
        {
            try
            {
                var url = $"https://brasilapi.com.br/api/feriados/v1/{ano}";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    // Desserializa a resposta JSON diretamente para uma lista do nosso DTO.
                    var feriados = await response.Content.ReadFromJsonAsync<List<FeriadoDto>>();
                    return feriados;
                }

                return null;
            }
            catch (HttpRequestException ex)
            {
                // Aqui você pode adicionar um log do erro, se desejar.
                // Ex: _logger.LogError(ex, "Erro ao buscar feriados na BrasilAPI.");
                return null;
            }
        }
    }
}