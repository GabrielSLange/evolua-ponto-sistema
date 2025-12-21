using EvoluaPonto.Api.Dtos;
using QuestPDF.Fluent;

namespace EvoluaPonto.Api.Services
{
    public class EspelhoPontoService
    {
        // MUDANÇA: O parâmetro agora é EspelhoPontoAgrupadoDto
        public byte[] GerarEspelhoPontoPDF(EspelhoPontoAgrupadoDto dadosEspelho)
        {
            // O EspelhoPontoDocument que criamos anteriormente já espera esse tipo novo
            var document = new EspelhoPontoDocument(dadosEspelho);

            return document.GeneratePdf();
        }
    }
}