# 📁 Estrutura de Pastas — Evolua Ponto Sistema

> Visão geral da organização de diretórios e arquivos do projeto.

```
evolua-ponto-sistema/
│
├── 📄 .dockerignore
├── 📄 .gitignore
├── 📄 README.md
│
├── 📂 .github/
│   └── 📂 workflows/
│       └── deploy-frontend.yml            # CI/CD para deploy do frontend
│
├── 📂 docs/
│   ├── CONTRIBUTING.md                     # Guia de contribuição
│   ├── 📂 backend/
│   │   └── API_DOCUMENTATION.md            # Documentação da API REST
│   ├── 📂 database/
│   │   └── DATABASE_SCHEMA.md              # Esquema do banco de dados
│   ├── 📂 deployment/
│   │   └── DEPLOYMENT_GUIDE.md             # Guia de deploy
│   └── 📂 frontend/
│       └── FRONTEND_DOCUMENTATION.md       # Documentação do frontend
│
│
│ ═══════════════════════════════════════════
│                  BACKEND
│ ═══════════════════════════════════════════
│
├── 📂 backend/
│   ├── Dockerfile                          # Dockerfile do backend
│   └── 📂 EvoluaPonto.Api/
│       ├── EvoluaPonto.Api.sln             # Solution (.NET)
│       └── 📂 EvoluaPonto.Api/
│           ├── Program.cs                  # Entry point da aplicação
│           ├── EvoluaPonto.Api.csproj       # Projeto .NET
│           ├── appsettings.json            # Configurações gerais
│           ├── appsettings.Development.json # Configurações de dev
│           ├── nixpacks.toml               # Config Nixpacks (deploy)
│           ├── Dockerfile                  # Dockerfile do projeto API
│           │
│           ├── 📂 Controllers/              # Controladores da API
│           │   ├── AuthController.cs
│           │   ├── ComprovanteController.cs
│           │   ├── EmpresasController.cs
│           │   ├── EscalasController.cs
│           │   ├── EspelhoPontoController.cs
│           │   ├── EstabelecimentoController.cs
│           │   ├── EventosController.cs
│           │   ├── FeriadosController.cs
│           │   ├── FuncionarioController.cs
│           │   ├── RegistroPontoController.cs
│           │   └── RelatoriosController.cs
│           │
│           ├── 📂 Data/                     # Contexto do banco de dados
│           │   └── AppDbContext.cs
│           │
│           ├── 📂 Dtos/                     # Data Transfer Objects
│           │   ├── AdicionarAlunoAvulsoDto.cs
│           │   ├── AlunoResponseDto.cs
│           │   ├── AuthDtos.cs
│           │   ├── AvaliarSolicitacaoDto.cs
│           │   ├── ComprovanteDto.cs
│           │   ├── CriarEventoVazioDto.cs
│           │   ├── EscalaDtos.cs
│           │   ├── EspelhoHomeDto.cs
│           │   ├── EspelhoPontoAgrupadoDto.cs
│           │   ├── EspelhoPontoDto.cs
│           │   ├── EventoResponseDto.cs
│           │   ├── FeriadoDto.cs
│           │   ├── FeriadoPersonalizadoCreateDto.cs
│           │   ├── FuncionarioDto.cs
│           │   ├── HistoricoPontoDto.cs
│           │   ├── ImportacaoProvaCsvDto.cs
│           │   ├── PagedResult.cs
│           │   ├── RefreshTokenDto.cs
│           │   ├── RegistroPontoDto.cs
│           │   ├── RelatorioLoteRequest.cs
│           │   ├── RelatorioPresencaDto.cs
│           │   └── SolicitacaoRegistroPontoDto.cs
│           │
│           ├── 📂 Mappings/                 # Mapeamentos (CsvHelper, etc.)
│           │   └── ImportacaoProvaCsvMap.cs
│           │
│           ├── 📂 Models/                   # Modelos de domínio
│           │   ├── JornadaDeTrabalho.cs
│           │   ├── ModelEmpresa.cs
│           │   ├── ModelEscala.cs
│           │   ├── ModelEscalaDia.cs
│           │   ├── ModelEstabelecimento.cs
│           │   ├── ModelEventoProva.cs
│           │   ├── ModelFeriadoPersonalizado.cs
│           │   ├── ModelFuncionario.cs
│           │   ├── ModelInscricaoAluno.cs
│           │   ├── ModelLocalProva.cs
│           │   ├── ModelRegistroPonto.cs
│           │   ├── ModelSalaProva.cs
│           │   ├── ModelUsuario.cs
│           │   ├── 📂 Enums/
│           │   │   └── StatusSolicitacao.cs
│           │   └── 📂 Shared/
│           │       └── ServiceResponse.cs.cs
│           │
│           ├── 📂 Migrations/               # Migrations do Entity Framework
│           │
│           ├── 📂 Services/                 # Camada de serviços (lógica de negócio)
│           │   ├── AejService.cs
│           │   ├── AfdService.cs
│           │   ├── AuthService.cs
│           │   ├── ComprovanteService.cs
│           │   ├── DigitalSignatureService.cs
│           │   ├── EmpresaService.cs
│           │   ├── EscalaService.cs
│           │   ├── EspelhoPontoDocument.cs
│           │   ├── EspelhoPontoService.cs
│           │   ├── EstabelecimentoService.cs
│           │   ├── EventosService.cs
│           │   ├── FeriadoPersonalizadoService.cs
│           │   ├── FeriadoService.cs
│           │   ├── FuncionarioService.cs
│           │   ├── ImportacaoService.cs
│           │   ├── JornadaService.cs
│           │   ├── RegistroPontoService.cs
│           │   ├── RelatorioExcelService.cs
│           │   └── 📂 External/             # Serviços de integração externa
│           │       ├── MinioService.cs
│           │       └── SupabaseStorageService.cs
│           │
│           └── 📂 Properties/
│               └── launchSettings.json
│
│
│ ═══════════════════════════════════════════
│                 FRONTEND
│ ═══════════════════════════════════════════
│
└── 📂 frontend/                             # App React Native / Expo
    ├── .env.local
    ├── .gitignore
    ├── Dockerfile                           # Dockerfile do frontend
    ├── app.config.js                        # Configuração do Expo
    ├── app.json                             # Metadados do app
    ├── babel.config.js                      # Configuração do Babel
    ├── metro.config.js                      # Configuração do Metro bundler
    ├── nginx.conf                           # Configuração Nginx (web build)
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    │
    ├── 📂 app/                              # Rotas (Expo Router - file-based)
    │   ├── _layout.tsx                      # Layout raiz
    │   ├── index.tsx                        # Tela inicial / redirect
    │   ├── modal.tsx                        # Tela modal genérica
    │   ├── +html.tsx                        # Template HTML (web)
    │   ├── +not-found.tsx                   # Página 404
    │   │
    │   ├── 📂 (auth)/                       # Grupo de rotas — Autenticação
    │   │   └── login.tsx
    │   │
    │   ├── 📂 perfil/                       # Grupo de rotas — Perfil do usuário
    │   │   ├── alterar-email.tsx
    │   │   ├── alterar-senha.tsx
    │   │   └── dados-pessoais.tsx
    │   │
    │   ├── 📂 (employee)/                   # Grupo de rotas — Funcionário
    │   │   ├── _layout.tsx
    │   │   └── 📂 meu-ponto/
    │   │       ├── bater-ponto.tsx
    │   │       ├── comprovantes.tsx
    │   │       ├── home.tsx
    │   │       └── solicitar-ponto.tsx
    │   │
    │   ├── 📂 (admin)/                      # Grupo de rotas — Administrador
    │   │   ├── _layout.tsx
    │   │   ├── 📂 escalas/
    │   │   │   ├── index.tsx
    │   │   │   ├── add-escala.tsx
    │   │   │   └── edit-escala.tsx
    │   │   ├── 📂 estabelecimentos/
    │   │   │   ├── index.tsx
    │   │   │   ├── add-estabelecimento.tsx
    │   │   │   └── edit-estabelecimento.tsx
    │   │   ├── 📂 feriados/
    │   │   │   ├── index.tsx
    │   │   │   └── add-feriado.tsx
    │   │   ├── 📂 funcionarios/
    │   │   │   ├── index.tsx
    │   │   │   ├── add-funcionario.tsx
    │   │   │   └── edit-funcionario.tsx
    │   │   ├── 📂 historico-pontos/
    │   │   │   └── index.tsx
    │   │   ├── 📂 meu-ponto/
    │   │   │   ├── bater-ponto.tsx
    │   │   │   ├── comprovantes.tsx
    │   │   │   ├── home.tsx
    │   │   │   └── solicitar-ponto.tsx
    │   │   ├── 📂 relatorios/
    │   │   │   └── index.tsx
    │   │   ├── 📂 solicitacoes/
    │   │   │   └── index.tsx
    │   │   └── 📂 todos-funcionarios/
    │   │       └── index.tsx
    │   │
    │   ├── 📂 (fiscal)/                     # Grupo de rotas — Fiscal
    │   │   ├── _layout.tsx
    │   │   ├── index.tsx
    │   │   ├── importar.tsx
    │   │   └── 📂 evento/
    │   │       └── [id].tsx
    │   │
    │   └── 📂 (superadmin)/                 # Grupo de rotas — Super Admin
    │       ├── _layout.tsx
    │       ├── 📂 empresas/
    │       │   ├── index.tsx
    │       │   ├── add-empresa.tsx
    │       │   └── edit-empresa.tsx
    │       ├── 📂 escalas/
    │       │   ├── index.tsx
    │       │   ├── add-escala.tsx
    │       │   └── edit-escala.tsx
    │       ├── 📂 estabelecimentos/
    │       │   ├── index.tsx
    │       │   ├── add-estabelecimento.tsx
    │       │   └── edit-estabelecimento.tsx
    │       ├── 📂 eventos/
    │       │   ├── index.tsx
    │       │   ├── importar.tsx
    │       │   └── 📂 evento/
    │       │       └── [id].tsx
    │       └── 📂 funcionarios/
    │           ├── index.tsx
    │           ├── add-funcionario.tsx
    │           └── edit-funcionario.tsx
    │
    ├── 📂 components/                       # Componentes reutilizáveis
    │   ├── ComprovanteModal.tsx
    │   ├── CustomLoader.tsx
    │   ├── EditScreenInfo.tsx
    │   ├── ExternalLink.tsx
    │   ├── StyledText.tsx
    │   ├── Themed.tsx
    │   ├── useClientOnlyValue.ts
    │   ├── useClientOnlyValue.web.ts
    │   ├── useColorScheme.ts
    │   ├── useColorScheme.web.ts
    │   │
    │   ├── 📂 __tests__/
    │   │   └── StyledText-test.js
    │   ├── 📂 forms/                        # Formulários
    │   │   ├── EmpresaForm.tsx
    │   │   ├── EscalaForm.tsx
    │   │   ├── EstabelecimentoForm.tsx
    │   │   ├── FeriadoForm.tsx
    │   │   └── FuncionarioForm.tsx
    │   ├── 📂 layouts/                      # Layouts reutilizáveis
    │   │   ├── FieldSet.tsx
    │   │   ├── MultiSelectDropdown.tsx
    │   │   ├── ScreenContainer.tsx
    │   │   └── SearchableDropdown.tsx
    │   ├── 📂 lists/                        # Componentes de listagem
    │   │   ├── listEscalas.tsx
    │   │   ├── listEstabelecimentos.tsx
    │   │   ├── listFeriados.tsx
    │   │   └── listFuncionarios.tsx
    │   ├── 📂 maps/                         # Componentes de mapa
    │   │   └── InteractiveMap.tsx
    │   ├── 📂 modals/                       # Modais
    │   │   └── DetalhesPontoModal.tsx
    │   ├── 📂 navigation/                   # Componentes de navegação
    │   │   ├── CustomDrawerContent.tsx
    │   │   └── CustomHeader.tsx
    │   └── 📂 screens/                      # Telas/conteúdos compartilhados
    │       ├── BaterPontoContent.tsx
    │       ├── ComprovantesContent.tsx
    │       ├── EspelhoPontoContent.tsx
    │       └── SolicitarPontoContent.tsx
    │
    ├── 📂 constants/                        # Constantes globais
    │   ├── Colors.ts
    │   └── ignoreWarnings.ts
    │
    ├── 📂 contexts/                         # Context API (estado global)
    │   ├── AuthContext.tsx
    │   ├── BadgeContext.tsx
    │   └── NotificationContext.tsx
    │
    ├── 📂 hooks/                            # Custom Hooks por perfil
    │   ├── 📂 admin/
    │   │   ├── useEscala.ts
    │   │   ├── useEstabelecimento.ts
    │   │   ├── useFeriado.ts
    │   │   ├── useFuncionario.ts
    │   │   └── useRelatorios.ts
    │   ├── 📂 employee/
    │   │   └── useBaterPonto.ts
    │   └── 📂 superadmin/
    │       ├── useEmpresa.ts
    │       ├── useEscala.ts
    │       ├── useEstabelecimento.ts
    │       └── useFuncionario.ts
    │
    ├── 📂 models/                           # Modelos / Tipos TypeScript
    │   ├── ModelEmpresa.ts
    │   ├── ModelEstabelecimento.ts
    │   ├── ModelFuncionario.ts
    │   └── 📂 Dtos/
    │       ├── BaterPontoDto.ts
    │       ├── ComprovanteDto.ts
    │       ├── EspelhoPontoDto.ts
    │       └── SolicitacaoPontoDto.ts
    │
    ├── 📂 services/                         # Serviços (API, storage, etc.)
    │   ├── api.ts
    │   ├── eventBus.ts
    │   └── storage.ts
    │
    ├── 📂 assets/                           # Assets estáticos
    │   ├── fingerprint.json
    │   ├── fingerprint1.json
    │   ├── fingerprint2.json
    │   ├── 📂 fonts/
    │   │   ├── MaterialDesignIcons.ttf
    │   │   └── SpaceMono-Regular.ttf
    │   └── 📂 images/
    │       ├── LoginAnimation.json
    │       ├── LoginAnimation1.json
    │       ├── adaptive-icon.png
    │       ├── favicon.png
    │       ├── location.svg
    │       └── splash-icon.png
    │
    └── 📂 public/                           # Arquivos públicos (web)
        ├── favicon.ico
        └── 📂 fonts/
```
