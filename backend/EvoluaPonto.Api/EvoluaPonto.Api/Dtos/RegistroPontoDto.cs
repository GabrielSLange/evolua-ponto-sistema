using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EvoluaPonto.Api.Dtos
{
    public class RegistroPontoDto
    {
        [Required(ErrorMessage = "O tipo de registro é obrigatório.")]
        public string Tipo { get; set; }

        [Required(ErrorMessage = "O ID do funcionário é obrigatório para bater o ponto")]
        public Guid FuncionarioId { get; set; }

        public decimal? Latitude { get; set; }

        public decimal? Longitude { get; set; }

        // Precisão do GPS em metros (Ex: 10.5 metros)
        public decimal? PrecisaoMetros { get; set; }

        public decimal? LatitudeEstabelecimento { get; set; }

        public decimal? LongitudeEstabelecimento { get; set; }

        public decimal? RaioEstabelecimento { get; set; }

        public IFormFile? Foto { get; set; }
    }
}
