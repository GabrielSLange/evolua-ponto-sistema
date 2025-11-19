namespace EvoluaPonto.Api.Dtos
{
    // Este DTO representa um item na lista de comprovantes
    public class ComprovanteDto
    {
        // O Id do registro, para caso o usuário queira
        // selecionar e ver mais detalhes
        public long Id { get; set; }

        // A data e hora da marcação
        public DateTime TimestampMarcacao { get; set; }

        // O tipo de batida (ex: "Entrada", "Saida")
        public string Tipo { get; set; }

        // A URL para o comprovante (o mais importante)
        public string ComprovanteUrl { get; set; }
    }
}