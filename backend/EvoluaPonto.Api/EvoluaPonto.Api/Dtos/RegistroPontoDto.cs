using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class RegistroPontoDto
    {
        [Required(ErrorMessage = "O tipo de registro é obrigatório.")]
        public string Tipo { get; set; }

        public IFormFile? Foto { get; set; }
    }
}
