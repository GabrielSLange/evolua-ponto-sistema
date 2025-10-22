using System.ComponentModel.DataAnnotations;

namespace EvoluaPonto.Api.Dtos
{
    public class RegistroPontoDto
    {
        [Required(ErrorMessage = "O tipo de registro é obrigatório.")]
        public string Tipo { get; set; }

        [Required(ErrorMessage = "O ID do funcionário é obrigatório para bater o ponto")]
        public Guid FuncionarioId { get; set; }

        public IFormFile? Foto { get; set; }
    }
}
