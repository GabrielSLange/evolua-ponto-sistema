using EvoluaPonto.Api.Dtos;
using QuestPDF.Fluent;

namespace EvoluaPonto.Api.Services
{
    public class EspelhoPontoService
    {
        /// <summary>
        /// Gera o documento PDF do Espelho de Ponto com base nos dados calculados.
        /// </summary>
        /// <param name="dadosEspelho">O DTO contendo todas as informações do espelho de ponto.</param>
        /// <returns>Um array de bytes representando o arquivo PDF.</returns>
        public byte[] GerarEspelhoPontoPDF(EspelhoPontoDto dadosEspelho)
        {
            // Cria uma instância do documento PDF, passando os dados necessários.
            var document = new EspelhoPontoDocument(dadosEspelho);

            // Gera o PDF em memória e retorna como um array de bytes.
            byte[] pdfBytes = document.GeneratePdf();

            return pdfBytes;
        }
    }

    // A classe que define a estrutura do PDF será criada no próximo passo.
}