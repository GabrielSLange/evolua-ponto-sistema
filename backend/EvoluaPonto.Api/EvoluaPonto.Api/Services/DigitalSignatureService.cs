using iText.Bouncycastle.Crypto;
using iText.Bouncycastle.X509;
using iText.Commons.Bouncycastle.Cert;
using iText.Kernel.Pdf;
using iText.Signatures;
using Org.BouncyCastle.Pkcs;

using System.Security.Cryptography.Pkcs;
using System.Security.Cryptography.X509Certificates;

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

                    var bouncyCastlePrivateKey = new PrivateKeyBC(privateKey);
                    var externalSignature = new PrivateKeySignature(bouncyCastlePrivateKey, DigestAlgorithms.SHA256);

                    IX509Certificate[] chain = certificateChain.Select(c => new X509CertificateBC(c)).Cast<IX509Certificate>().ToArray();

                    pdfSigner.SignDetached(externalSignature, chain, null, null, null, 0, PdfSigner.CryptoStandard.CMS);

                    return memoryStream.ToArray();
                }
            }
        }

        public byte[] SignBytesCadesDetached(byte[] dataToSign)
        {
            // 1. Carrega o certificado em um objeto nativo do .NET
            var certificate = new X509Certificate2(_certificateBytes, _certificatePassword);

            // 2. Prepara o conteúdo a ser assinado
            var contentInfo = new ContentInfo(dataToSign);

            // 3. Cria o objeto SignedCms para a assinatura destacada
            var signedCms = new SignedCms(contentInfo, true); // O 'true' significa "detached"

            // 4. Cria o "assinador" usando nosso certificado
            var signer = new CmsSigner(certificate);

            // 5. Calcula a assinatura
            signedCms.ComputeSignature(signer);

            // 6. Codifica a assinatura no formato PKCS#7 (que é o .p7s)
            return signedCms.Encode();
        }
    }
}