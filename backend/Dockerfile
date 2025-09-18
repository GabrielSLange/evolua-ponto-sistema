# Estágio 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copia a pasta local 'backend' inteira para o diretório de trabalho '/src' no contêiner
COPY backend/ .

# --- COMANDO DE DEPURAÇÃO 1 ---
# Vamos listar de forma recursiva TUDO que foi copiado para a pasta /src.
# Isso vai nos mostrar a estrutura exata de pastas que o Docker está vendo.
RUN echo "--- Listando arquivos em /src ---" && ls -R

# Entramos na pasta que (supostamente) contém o arquivo .sln
WORKDIR /src/EvoluaPonto.Api

# --- COMANDO DE DEPURAÇÃO 2 ---
# Vamos listar o conteúdo da pasta atual para confirmar se o .sln está aqui.
RUN echo "--- Listando arquivos no diretório de trabalho atual: $(pwd) ---" && ls -l

# O comando que está falhando. Ele vai falhar de novo, mas o log acima é o que importa.
RUN dotnet restore "EvoluaPonto.Api.sln"

# O resto do arquivo...
RUN dotnet publish "EvoluaPonto.Api/EvoluaPonto.Api.csproj" -c Release -o /app/publish


# Estágio 2: Imagem Final
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "EvoluaPonto.Api.dll"]