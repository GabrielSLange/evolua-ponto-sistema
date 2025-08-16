using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Diagnostics;

namespace EvoluaPonto.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // A URL será /api/healthcheck
    public class HealthCheckController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public HealthCheckController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("test-db")] // A URL final será /api/healthcheck/test-db
        public async Task<IActionResult> TestDatabaseConnection()
        {
            var stopwatch = new Stopwatch();
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                await using var conn = new NpgsqlConnection(connectionString);

                stopwatch.Start();
                await conn.OpenAsync(); // Tenta abrir a conexão
                stopwatch.Stop();

                await conn.CloseAsync();

                return Ok($"Conexão com o banco de dados bem-sucedida em {stopwatch.ElapsedMilliseconds}ms.");
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                return Problem($"Erro ao conectar com o banco após {stopwatch.ElapsedMilliseconds}ms. Detalhes: {ex.Message}");
            }
        }
    }
}