using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:3000", // Para o nosso futuro frontend Next.js
                                             "https://localhost:7080") // Para o Swagger local
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

Console.WriteLine("--- Verificando Configura��es do JWT ---");
Console.WriteLine($"Issuer lido: '{builder.Configuration["Jwt:Issuer"]}'");
Console.WriteLine($"Audience lido: '{builder.Configuration["Jwt:Audience"]}'");
Console.WriteLine($"Secret lido tem conte�do? {!string.IsNullOrEmpty(builder.Configuration["Jwt:Secret"])}");
Console.WriteLine("-----------------------------------------");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true, // Valida a assinatura do token
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"])), // Usa a chave secreta

            ValidateIssuer = true, // Valida quem emitiu o token
            ValidIssuer = builder.Configuration["Jwt:Issuer"],

            ValidateAudience = true, // Valida para quem o token foi emitido
            ValidAudience = builder.Configuration["Jwt:Audience"],

            ClockSkew = TimeSpan.Zero // Remove a toler�ncia de tempo na expira��o do token
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                // Este evento � disparado se a valida��o falhar por QUALQUER motivo
                Console.WriteLine("--- FALHA NA AUTENTICA��O ---");
                Console.WriteLine("Exce��o: " + context.Exception.ToString());
                Console.WriteLine("--- FIM DA FALHA ---");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                // Este evento � disparado se a valida��o for 100% bem-sucedida
                Console.WriteLine("--- SUCESSO NA VALIDA��O DO TOKEN ---");
                Console.WriteLine("Token validado para o usu�rio com ID: " + context.Principal.Identity?.Name);
                Console.WriteLine("--- FIM DO SUCESSO ---");
                return Task.CompletedTask;
            }
        };
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

var app = builder.Build();


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
