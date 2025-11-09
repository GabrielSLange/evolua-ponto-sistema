using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EvoluaPonto.Api.Models.Enums;

namespace EvoluaPonto.Api.Models
{
    [Table("registros_ponto")]
    public class ModelRegistroPonto
    {
        [Key]
        [Column("id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        // Tornamos Nulo (long?) e removemos [Required]
        // Ele só será preenchido quando for uma batida original ou uma solicitação APROVADA.
        [Column("nsr")]
        public long? Nsr { get; set; }

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

        // Tornamos Nulo (string?) e removemos [Required]
        // Só será preenchido quando for uma batida original ou uma solicitação APROVADA.
        [Column("hash_sha256")]
        public string? HashSha256 { get; set; }

        [Column("comprovante_url")]
        public string? ComprovanteUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        //Relação com funcionario

        [Required]
        [Column("funcionario_id")]
        public Guid FuncionarioId { get; set; }

        public ModelFuncionario Funcionario { get; set; }

        // Relação com Solicitação de Registro de Ponto

        /// Identifica se é uma batida original (false) ou uma solicitação manual (true).
        [Required]
        [Column("registro_manual")]
        public bool RegistroManual { get; set; } = false; // Valor padrão é 'false'

        /// Status da solicitação (Pendente, Aprovado, Rejeitado).
        /// Será nulo se 'RegistroManual' for 'false'.
        [Column("status_solicitacao")]
        public StatusSolicitacao? Status { get; set; }

        /// Justificativa escrita pelo funcionário ao solicitar o ajuste.
        [Column("justificativa_funcionario")]
        public string? JustificativaFuncionario { get; set; }

        /// Justificativa do admin (obrigatória em caso de rejeição).
        [Column("justificativa_admin")]
        public string? JustificativaAdmin { get; set; }

        /// ID do usuário (admin/gestor) que analisou a solicitação.
        [Column("admin_id_analise")]
        public Guid? AdminIdAnalise { get; set; } // Assumindo que o ID do admin é um Guid, como o do funcionário

        /// Data e hora em que a análise (aprovação/rejeição) foi feita.
        [Column("data_analise")]
        public DateTime? DataAnalise { get; set; }
    }
}
