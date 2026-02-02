using EvoluaPonto.Api.Dtos;
using System.Text.Json;

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
                var url = $"https://date.nager.at/api/v3/PublicHolidays/{ano}/br";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return [];
                }

                var json = await response.Content.ReadAsStringAsync();

                // Configura para ler camelCase
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var feriadosExternos = JsonSerializer.Deserialize<List<FeriadoDto>>(json, options);

                if (feriadosExternos == null) return [];

                // Filtro
                var feriadosFiltrados = feriadosExternos
                    .Where(f =>
                        // 1. Filtra se é feriado público ou facultativo
                        (f.Tipo.Contains("Public") || f.Tipo.Contains("Optional"))

                        // 2. Verifica se é nacional e não somente estatual
                        && f.Global
                    )
                    .Select(f => new FeriadoDto
                    {
                        Data = f.Data,
                        Nome = f.Nome,
                        Tipo = f.Tipo.Contains("Optional") ? [ "Facultativo" ] : [ "Nacional" ],
                    })
                    .ToList();

                return feriadosFiltrados;
            }
            catch (HttpRequestException ex)
            {
                // Aqui você pode adicionar um log do erro, se desejar.
                return [];
            }
        }
    }
}