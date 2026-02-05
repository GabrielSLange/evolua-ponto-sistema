using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using System.Text;
using Microsoft.AspNetCore.HttpOverrides;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<MinioService>();

var key = Encoding.ASCII.GetBytes(builder.Configuration["JwtSettings:SecretKey"]);
builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false; // Mude para true em Produção
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        ValidateLifetime = true
    };
});

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
                                             "https://evoluaponto-frontend.d63v0v.easypanel.host",
                                             "https://evolua-ponto-frontend.ukttjf.easypanel.host/",
                                             "https://app.novacontabilidadedigital.com",
                                             "https://evolua-ponto-sistema.vercel.app") // Para o Swagger local
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
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
builder.Services.AddScoped<RelatorioExcelService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<EscalaService>();

var app = builder.Build();

//Lógica para atualizar o banco de acordo com as migrations toda vez que a API iniciar
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocorreu um erro ao aplicar as migrations no banco de dados.");
    }
}

app.UseForwardedHeaders();

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
