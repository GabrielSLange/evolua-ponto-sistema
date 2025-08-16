namespace EvoluaPonto.Api.Models.Shared
{
    public class ServiceResponse<T>
    {
        public bool Success { get; set; } = true;
        public string? ErrorMessage { get; set; }
        public T? Data { get; set; }
    }
}
