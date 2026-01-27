using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class RegistroPontoDto
    {
        [Required(ErrorMessage = "O tipo de registro é obrigatório.")]
        public string Tipo { get; set; }

        [Required(ErrorMessage = "O ID do funcionário é obrigatório para bater o ponto")]
        public Guid FuncionarioId { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        // Precisão do GPS em metros (Ex: 10.5 metros)
        public double? PrecisaoMetros { get; set; }

        public IFormFile? Foto { get; set; }
    }
}
