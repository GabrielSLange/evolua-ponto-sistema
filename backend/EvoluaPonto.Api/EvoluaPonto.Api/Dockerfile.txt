# Estágio 1: Build - Pega o ambiente .NET 8 com as ferramentas de compilação
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia o arquivo de projeto e restaura as dependências (pacotes NuGet)
COPY ["EvoluaPonto.Api.csproj", "."]
RUN dotnet restore "./EvoluaPonto.Api.csproj"

# Copia todo o resto do código-fonte e compila o projeto
COPY . .
RUN dotnet build "EvoluaPonto.Api.csproj" -c Release -o /app/build

# Estágio 2: Publicação - Gera os arquivos otimizados para produção
FROM build AS publish
RUN dotnet publish "EvoluaPonto.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Estágio 3: Imagem Final - Pega um ambiente .NET 8 leve, apenas para rodar a API
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EvoluaPonto.Api.dll"]