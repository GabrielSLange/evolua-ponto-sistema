// Usings para as classes corretas do adaptador
using iText.Bouncycastle.Crypto;
using iText.Commons.Bouncycastle.Cert; // Namespace correto para IX509Certificate
using iText.Kernel.Pdf;
using iText.Signatures;
using Org.BouncyCastle.Pkcs; // Para a classe X509Certificate
using iText.Bouncycastle.X509;


namespace EvoluaPonto.Api.Services
{
    public class DigitalSignatureService
    {

        private readonly byte[] _certificateBytes;
        private readonly string _certificatePassword;

        public DigitalSignatureService(IConfiguration configuration)
        {
            string certificateBase64 = configuration["Certificate:Base64"] ?? throw new InvalidOperationException("Certificado (Base64) não configurado.");
            _certificatePassword = configuration["Certificate:Password"] ?? throw new InvalidOperationException("Senha do certificado não configurada.");
            _certificateBytes = Convert.FromBase64String(certificateBase64);
        }

        public byte[] SignPdf(byte[] pdfBytes)
        {
            using (var fileStream = new MemoryStream(_certificateBytes))
            {
                var pkcs12Store = new Pkcs12StoreBuilder().Build();
                pkcs12Store.Load(fileStream, _certificatePassword.ToCharArray());

                string? alias = pkcs12Store.Aliases.Cast<string>().FirstOrDefault(pkcs12Store.IsKeyEntry);

                if (alias == null)
                {
                    throw new Exception("Não foi possível encontrar a chave privada no arquivo de certificado.");
                }

                var privateKey = pkcs12Store.GetKey(alias).Key;
                var certificateChain = pkcs12Store.GetCertificateChain(alias).Select(c => c.Certificate).ToArray();

                using (var memoryStream = new MemoryStream())
                {
                    var pdfReader = new PdfReader(new MemoryStream(pdfBytes));
                    var pdfSigner = new PdfSigner(pdfReader, memoryStream, new StampingProperties().UseAppendMode());

                    pdfSigner.SetReason("Comprovante de Ponto");
                    pdfSigner.SetLocation("Sistema EvoluaPonto");
                    pdfSigner.SetFieldName("assinatura_sistema");
                    pdfSigner.GetSignatureAppearance().SetPageRect(new iText.Kernel.Geom.Rectangle(0, 0, 0, 0));

                    // A SOLUÇÃO CORRETA:
                    // 1. Criamos a assinatura com a chave privada do BouncyCastle.
                    var bouncyCastlePrivateKey = new PrivateKeyBC(privateKey);
                    var externalSignature = new PrivateKeySignature(bouncyCastlePrivateKey, DigestAlgorithms.SHA256);

                    // 2. O iText consegue converter a cadeia de certificados do BouncyCastle diretamente.
                    IX509Certificate[] chain = certificateChain.Select(c => new X509CertificateBC(c)).Cast<IX509Certificate>().ToArray();

                    // 3. Assina o documento com os objetos corretos.
                    pdfSigner.SignDetached(externalSignature, chain, null, null, null, 0, PdfSigner.CryptoStandard.CMS);

                    return memoryStream.ToArray();
                }
            }
        }
    }
}