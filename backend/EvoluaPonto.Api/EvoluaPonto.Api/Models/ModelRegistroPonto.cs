using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Models
{
    [Table("registros_ponto")]
    public class ModelRegistroPonto
    {
        [Key]
        [Column("id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [Required]
        [Column("nsr")]
        public long Nsr { get; set; }

        [Required]
        [Column("timestamp_marcacao")]
        public DateTime TimestampMarcacao { get; set; }

        [Required]
        [Column("tipo")]
        public string Tipo { get; set; }

        [Column("foto_url")]
        public string? FotoUrl { get; set; }

        [Column("geolocalizacao_ip")]
        public string? GeolocalizacaoIp { get; set; }

        [Required]
        [Column("hash_sha256")]
        public string HashSha256 { get; set; }

        [Column("comprovante_url")]
        public string? ComprovanteUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        //Relação com funcionario

        [Required]
        [Column("funcionario_id")]
        public Guid FuncionarioId { get; set; }

        public ModelFuncionario Funcionario { get; set; }

    }
}
