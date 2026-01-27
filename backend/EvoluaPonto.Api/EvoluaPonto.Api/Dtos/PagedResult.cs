namespace EvoluaPonto.Api.Dtos
{
    public class PagedResult<T>
    {
        public List<T> Data { get; set; }
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
    }
}
