using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Services;
using EvoluaPonto.Api.Services.External;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using System.Text;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

QuestPDF.Settings.License = LicenseType.Community;

builder.Services.AddControllers();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

    // IMPORTANTE: Diga ao .NET para confiar no seu proxy.
    // Como sua API (Kestrel) não está exposta publicamente 
    // (só o Nginx está), é seguro limpar as redes conhecidas.
    // Isso diz: "Qualquer IP que me enviar esses headers, eu confio".
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:8081", // Para o nosso futuro frontend Next.js
                                             "https://localhost:7080",
                                             "http://localhost:8080",
                                             "http://localhost:80",
                                             "https://evolua-ponto-sistema.vercel.app") // Para o Swagger local
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true, // Valida a assinatura do token
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"] ?? throw new ArgumentNullException("Jwt:Secret"))), // Usa a chave secreta

            ValidateIssuer = true, // Valida quem emitiu o token
            ValidIssuer = builder.Configuration["Jwt:Issuer"],

            ValidateAudience = true, // Valida para quem o token foi emitido
            ValidAudience = builder.Configuration["Jwt:Audience"],

            ClockSkew = TimeSpan.Zero // Remove a toler�ncia de tempo na expira��o do token
        };
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddServer(new Microsoft.OpenApi.Models.OpenApiServer() { Url = "/api" });
    // Define o T�tulo e a Vers�o da sua API
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Evolua Ponto API", Version = "v1" });

    // Adiciona a defini��o de seguran�a "Bearer" que o Swagger UI usar�.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Por favor, insira 'Bearer ' seguido do seu token JWT",
        Name = "Authorization",
        Type = SecuritySchemeType.Http, // Usar Http � mais semanticamente correto para Bearer
        BearerFormat = "JWT",
        Scheme = "bearer"
    });

    // Adiciona o requisito de seguran�a global que aplica a defini��o "Bearer" aos endpoints.
    // Isso far� com que o cadeado apare�a em todos os endpoints que exigem autoriza��o.
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<EmpresaService>();
builder.Services.AddScoped<FuncionarioService>();
builder.Services.AddScoped<RegistroPontoService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<SupabaseAdminService>();
builder.Services.AddScoped<SupabaseStorageService>();
builder.Services.AddScoped<ComprovanteService>();
builder.Services.AddScoped<EstabelecimentoService>();
builder.Services.AddScoped<DigitalSignatureService>();
builder.Services.AddScoped<AfdService>();
builder.Services.AddScoped<JornadaService>();
builder.Services.AddScoped<EspelhoPontoService>();
builder.Services.AddHttpClient<FeriadoService>();
builder.Services.AddScoped<FeriadoPersonalizadoService>();
builder.Services.AddScoped<AejService>();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

app.UseForwardedHeaders();

app.UsePathBase("/api");
// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
app.UseSwagger();
app.UseSwaggerUI();
//}

app.UseHttpsRedirection();

app.UseCors(MyAllowSpecificOrigins);

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
