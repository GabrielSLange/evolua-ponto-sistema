using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Configuration;

namespace EvoluaPonto.Api.Services
{
    public class MinioService
    {
        private readonly IMinioClient _minioClient;
        private readonly string _bucketName;

        public MinioService(IConfiguration config)
        {
            _bucketName = config["MinioSettings:BucketName"];
            var endpoint = config["MinioSettings:Endpoint"];
            var accessKey = config["MinioSettings:AccessKey"];
            var secretKey = config["MinioSettings:SecretKey"];
            var useSSL = bool.Parse(config["MinioSettings:UseSSL"]);

            _minioClient = new MinioClient()
                .WithEndpoint(endpoint)
                .WithCredentials(accessKey, secretKey)
                .WithSSL(useSSL)
                .Build();
        }

        // Garante que o balde existe
        public async Task EnsureBucketExists()
        {
            var found = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(_bucketName));
            if (!found)
            {
                await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucketName));
            }
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
        {
            await EnsureBucketExists();

            // Sobe o arquivo
            await _minioClient.PutObjectAsync(new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(fileName) // Ex: "guid-funcionario/comprovantes/arquivo.pdf"
                .WithStreamData(fileStream)
                .WithObjectSize(fileStream.Length)
                .WithContentType(contentType));

            return fileName; // Retornamos o "Path" (Key) para salvar no banco
        }

        public async Task<string> GetPresignedUrlAsync(string objectName)
        {
            // Gera um link temporário (ex: válido por 1 hora) para o front baixar
            // Isso é MUITO seguro, pois o link expira.
            return await _minioClient.PresignedGetObjectAsync(new PresignedGetObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName)
                .WithExpiry(60 * 60)); // 1 hora
        }

        public async Task DeleteFileAsync(string objectName)
        {
            await _minioClient.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName));
        }
    }
}