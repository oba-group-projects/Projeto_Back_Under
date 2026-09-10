# ⚽ Projeto Back Under - Terminal Web de Trading Esportivo Multi-Jogos

[![Jest Tests](https://github.com/bora-group-projects/Projeto_Back_Under/actions/workflows/test.yml/badge.svg)](https://github.com/bora-group-projects/Projeto_Back_Under/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/bora-group-projects/Projeto_Back_Under/branch/main/graph/badge.svg)](https://codecov.io/gh/bora-group-projects/Projeto_Back_Under)
[![Lint & Format](https://github.com/bora-group-projects/Projeto_Back_Under/actions/workflows/test.yml/badge.svg?label=lint)](https://github.com/bora-group-projects/Projeto_Back_Under/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/projeto_back_under)](https://www.npmjs.com/package/projeto_back_under)

Aplicação web leve, ultra-rápida e 100% automatizada para operações no mercado de **Back Under** e Trade Esportivo na Betfair/Exchange.

O sistema elimina cálculos manuais: o usuário preenche apenas os campos essenciais destacados em amarelo (**Odd de Entrada/Referência 365** e **Red Aceitável/Stop Loss**) e a aplicação calcula instantaneamente a stake recomendada, o mapa de pêndulos (Parede V6), a odd de saída ideal, a contagem de ticks, o retorno financeiro e o cashout equalizado em tempo real.

---

## 🚀 Funcionalidades Principais

- ⚡ **Automação Máxima**: Cálculo em tempo real de Stakes, Lucro Médio, Red Médio, Ticks e Zonas sem necessidade de fórmulas manuais.
- 🎮 **Suporte a até 4 Jogos Simultâneos**: Grid responsivo com cálculos e cronômetros 100% independentes para cada slot de jogo.
- 📖 **Motor de Pêndulos Parede V6**: Tabela interativa de lookup instantâneo (Bet365 $\rightarrow$ Odd Justa $\rightarrow$ Caminho $\rightarrow$ Saída $\rightarrow$ Ticks $\rightarrow$ Zona).
- ⚖️ **Calculadora de Hedge / Greenbook Live**: Equalização automática de lucros e prejuízos com taxa de comissão da Betfair.
- 📜 **Histórico & Gestão de Banca**: Registro automático das operações com métricas consolidadas (Win Rate, ROI, P/L Líquido) e exportação em **CSV**.
- 🔔 **Alertas Sonoros e Visuais**: Feedback acústico sintetizado (via Web Audio API) para Greens, Reds e confirmações.
- 📱 **100% Responsivo**: Otimizado para monitores ultra-wide, telas Full HD, notebooks e dispositivos móveis.

---

## 📊 Estratégias e Regras de Gestão (Planilha Base Integrada)

| Estratégia                    | Odds de Base      | Multiplicador de Stake | Lucro Médio          | Red Médio           | Lucro Estimado |
| :---------------------------- | :---------------- | :--------------------- | :------------------- | :------------------ | :------------- |
| **Back Under (Parede V6)**    | 1.14 a 8.56       | Proporcional ao Stop   | Pêndulo Bloco        | Red Aceitável       | 2% a 13%       |
| **Lay Parelho 1º Tempo**      | Abaixo de 5.0     | $Red \times 2.50$      | $Stake \times 20\%$  | $Stake \times 40\%$ | 15% à 25%      |
| **Lay Zebra 1º Tempo**        | De 5.5 a 10.0     | $Red \times 3.33$      | $Stake \times 10\%$  | $Stake \times 30\%$ | 8% à 12%       |
| **Lay Super Zebra 1º Tempo**  | De 11.0 a 15.0    | $Red \times 5.55$      | $Stake \times 6\%$   | $Stake \times 18\%$ | 5% à 7%        |
| **Drakito 1º Tempo Parelho**  | De 8.0 a 13.0     | $Red \times 4.00$      | $Stake \times 7.5\%$ | $Stake \times 25\%$ | 5% à 10%       |
| **Drakito 1º Tempo Favorito** | De 13.0 a 20.0    | $Red \times 6.66$      | $Stake \times 5\%$   | $Stake \times 15\%$ | 4% à 6%        |
| **Vovô Back Favorito**        | Back 1.04 - 1.05  | $Red \times 8.34$      | $Stake \times 3.5\%$ | $Stake \times 12\%$ | 2% à 5%        |
| **Vovô Lay Tempo**            | Lay 35/50 - 70min | $Red \times 12.50$     | $Stake \times 2\%$   | $Stake \times 8\%$  | 2% à 3%        |

---

## 📁 Estrutura Modular do Código

```
Projeto_Back_Under/
├── index.html                   # Interface principal do Terminal Multi-Jogos
├── package.json                 # Configuração do projeto e scripts npm
├── README.md                    # Documentação do projeto
├── css/
│   ├── design-system.css        # Variáveis de tema escuro premium, cores e tipografia
│   ├── components.css           # Estilos de slots, botões de ação, inputs amarelos e badges
│   └── grid.css                 # Layouts para 1, 2 ou 4 jogos simultâneos e responsividade
├── js/
│   ├── core/
│   │   ├── oddsCalculator.js    # Escada Betfair, cálculo de ticks e distâncias
│   │   ├── pendulosData.js      # Base de dados estruturada do Mapa de Pêndulos Parede V6
│   │   ├── stakeManager.js      # Motor de cálculo de stakes e risco da planilha base
│   │   └── hedgeEngine.js       # Motor de Hedge/Cashout equalizado com comissão
│   ├── components/
│   │   ├── GameSlot.js          # Componente isolado de cada slot de jogo
│   │   ├── PenduloModal.js      # Modal com tabela e busca do Mapa de Pêndulos
│   │   └── OperationsHistory.js # Histórico de trades, métricas e exportação CSV
│   └── app.js                   # Orquestrador global da aplicação
└── test/
    └── test-calculations.js     # Suíte de testes automatizados de precisão matemática
```

---

## 💻 Como Rodar no VS Code

1. Abra a pasta `Projeto_Back_Under` no **VS Code**.
2. **Opção 1 (Extensão Live Server)**:
   - Clique com o botão direito em `index.html` e selecione **"Open with Live Server"**.
3. **Opção 2 (Via Node.js)**:
   - Execute no terminal:
     ```bash
     npm test          # Executa a suíte de testes de cálculo
     npx serve .       # Inicia um servidor web local ultra-leve
     ```
   - Acesse no navegador: `http://localhost:3000`

---

## ☁️ Como Fazer Deploy na Nuvem (Gratuito)

Como a aplicação é 100% estática (HTML5, Vanilla CSS3 e ES6 Modules), o deploy pode ser feito em segundos:

### GitHub Pages:

1. Vá nas configurações do seu repositório no GitHub (**Settings** > **Pages**).
2. Em **Source**, selecione a branch `main` e a pasta `/ (root)`.
3. Clique em **Save**. O link da aplicação será gerado automaticamente.

### Vercel / Netlify:

1. Conecte sua conta do GitHub na [Vercel](https://vercel.com) ou [Netlify](https://netlify.com).
2. Importe o repositório `Projeto_Back_Under`.
3. Clique em **Deploy**. Nenhuma configuração extra de build é necessária.

---

## 🧪 Testes Automatizados

Para rodar os testes de integridade matemática:

```bash
node test/test-calculations.js
```

_Garante que todas as fórmulas de stake, escada de odds da Betfair e lookup de pêndulos estejam com 100% de exatidão._

Para rodar os testes Jest dos componentes:

```bash
npm run test:jest       # Roda os 23 testes de GameSlot.js
npm run test:coverage   # Gera relatório de cobertura em /coverage
```

---

## 🛡️ Qualidade de Código (Husky + ESLint + Prettier)

O projeto usa **Husky** para garantir qualidade local antes de cada commit. O hook `pre-commit` roda automaticamente três verificações em sequência — o commit é bloqueado se qualquer uma falhar:

| Passo | Comando                | O que verifica                                                   |
| :---: | :--------------------- | :--------------------------------------------------------------- |
|   1   | `npm run lint`         | Erros de ESLint (variáveis não usadas, imports duplicados, etc.) |
|   2   | `npm run test:jest`    | 23 testes Jest do componente GameSlot                            |
|   3   | `npm run format:check` | Formatação consistente via Prettier                              |

**Comandos úteis para corrigir problemas antes de commitar:**

```bash
npm run lint:fix   # Corrige automaticamente o que o ESLint consegue
npm run format     # Formata todos os arquivos com Prettier
```

> O Husky é instalado automaticamente via `npm install` graças ao script `prepare` no `package.json`. Em ambientes de CI o hook não é executado — os mesmos checks rodam diretamente no workflow `.github/workflows/test.yml`.

---

## 📜 Commits Padronizados (Conventional Commits)

O projeto usa **Commitlint** com o padrão [Conventional Commits](https://www.conventionalcommits.org/). O hook `commit-msg` do Husky valida cada mensagem automaticamente — commits com formato inválido são **rejeitados antes de serem criados**.

### Formato obrigatório

```
<tipo>(<escopo opcional>): <descrição curta>
```

### Tipos aceitos

| Tipo       | Quando usar                                                  |
| :--------- | :----------------------------------------------------------- |
| `feat`     | Nova funcionalidade                                          |
| `fix`      | Correção de bug                                              |
| `docs`     | Alterações em documentação                                   |
| `style`    | Formatação, espaços, ponto-e-vírgula (sem mudança de lógica) |
| `refactor` | Refatoração de código sem nova feature ou fix                |
| `test`     | Adição ou correção de testes                                 |
| `chore`    | Tarefas de manutenção, dependências, configurações           |
| `perf`     | Melhorias de performance                                     |
| `ci`       | Alterações em pipelines de CI/CD                             |
| `build`    | Mudanças no sistema de build ou ferramentas externas         |
| `revert`   | Reversão de um commit anterior                               |

### Exemplos válidos

```bash
git commit -m "feat(GameSlot): adiciona guard para métricas nulas em updateUI"
git commit -m "fix(authManager): corrige catch não utilizado no loadUsers"
git commit -m "docs: adiciona seção de Conventional Commits no README"
git commit -m "chore: atualiza dependências do ESLint para v9"
git commit -m "test(GameSlot): adiciona testes para syncAddedMinutes"
```

### Exemplos inválidos (bloqueados automaticamente)

```bash
git commit -m "arrumei o bug"          # ❌ sem tipo
git commit -m "WIP"                    # ❌ sem tipo e sem descrição
git commit -m "FEAT: nova tela"        # ❌ tipo em maiúsculo
```

---

## 🔧 Modo sem Autenticação

> **Status atual da ferramenta:** em fase de correções e melhorias contínuas.

O cockpit abre **diretamente**, sem exigir login ou senha. A ferramenta foi projetada para uso profissional local e não depende de credenciais para funcionar.

### Como funciona

| Ação                     | Comportamento                                                               |
| :----------------------- | :-------------------------------------------------------------------------- |
| Abrir a aplicação        | Cockpit carrega imediatamente, sem tela de login                            |
| Botão "Entrar" no header | Abre modal de identificação opcional por e-mail                             |
| Identificação por e-mail | Cria sessão local; se o e-mail não existir, perfil é criado automaticamente |
| Cadastro de perfil       | Aceito imediatamente, sem senha e sem aprovação pendente                    |
| Dados de usuários        | Armazenados apenas no `localStorage` do navegador                           |

### Migração de dados antigos

Se o navegador tiver dados de versões anteriores (com senhas e usuários pendentes), a atualização é aplicada automaticamente na primeira carga:

- Campos `password` são removidos de todos os registros
- Usuários com status `pending` são convertidos para `active`
- Nenhuma ação manual é necessária

### Roadmap de autenticação

Autenticação segura está planejada para quando o projeto tiver infraestrutura de backend:

- [ ] Backend Node.js/Express com banco de dados real
- [ ] Hash de senhas com bcrypt/argon2
- [ ] JWT com expiração e refresh token
- [ ] Recuperação de senha por e-mail
- [ ] 2FA para administradores

---

## 🚀 Releases Automáticos (semantic-release)

O projeto usa **semantic-release** para gerar versões, changelog e GitHub Releases automaticamente a partir dos Conventional Commits — sem nenhuma intervenção manual.

### Como funciona

Após cada push para `main` que passe nos jobs de lint e testes, o pipeline executa:

```
push → main
     │
     ├─ [lint]     ESLint + Prettier
     ├─ [test]     23 testes Jest
     └─ [release]  semantic-release (apenas se lint + test passarem)
                     │
                     ├─ Analisa commits desde o último release
                     ├─ Determina a próxima versão (semver)
                     ├─ Atualiza CHANGELOG.md
                     ├─ Commita CHANGELOG.md + package.json  →  [skip ci]
                     └─ Publica GitHub Release com as notas
```

### Regras de versionamento (semver)

| Tipo de commit                         | Impacto na versão | Exemplo                                    |
| :------------------------------------- | :---------------: | :----------------------------------------- |
| `fix`, `perf`                          |  Patch `x.x.+1`   | `fix(GameSlot): corrige crash em updateUI` |
| `feat`                                 |  Minor `x.+1.0`   | `feat: adiciona slot de jogo 5`            |
| `BREAKING CHANGE` (rodapé)             |  Major `+1.0.0`   | `feat!: remove suporte a IE11`             |
| `chore`, `docs`, `style`, `test`, `ci` |      Nenhum       | Não gera release                           |

### O que é gerado automaticamente

- **`CHANGELOG.md`** — histórico completo de mudanças organizado por versão
- **Tag git** — ex: `v1.2.3`
- **GitHub Release** — com notas de release geradas a partir dos commits
- **Commit de release** — `chore(release): 1.2.3 [skip ci]` (não re-dispara o CI)

> O token `GITHUB_TOKEN` é provido automaticamente pelo GitHub Actions — nenhuma configuração extra de secrets é necessária para repositórios públicos.

---

## 📦 Publicação no NPM

Cada release automático gerado pelo semantic-release também **publica o pacote no NPM** sem nenhuma intervenção manual.

### Como funciona

O plugin `@semantic-release/npm` é executado como último passo do pipeline de release, após a criação da tag e do GitHub Release:

```
push → main  →  lint  →  test  →  release
                                     │
                                     ├─ Analisa commits e determina versão
                                     ├─ Atualiza CHANGELOG.md
                                     ├─ Cria tag git e GitHub Release
                                     └─ Publica no NPM Registry  ← @semantic-release/npm
```

### Configurar o NPM_TOKEN

O NPM_TOKEN **não** é provido automaticamente — precisa ser configurado manualmente uma vez:

1. Gere um token de automação em [npmjs.com](https://www.npmjs.com) → **Access Tokens** → **Generate New Token (Automation)**
2. No repositório GitHub, vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret** e adicione:
   - **Name:** `NPM_TOKEN`
   - **Value:** o token gerado no NPM

> Sem o `NPM_TOKEN` configurado, o job de release falha na etapa de publicação. O GitHub Release e o CHANGELOG ainda são criados, mas o pacote não é publicado no NPM.

### Instalar o pacote

```bash
npm install projeto_back_under
```

---

## ⚙️ Correções Técnicas

Registro das correções aplicadas nos módulos internos para conformidade com ESLint e melhoria de robustez.

### `ladderData.js`

| Correção                   | Detalhe                                                                                                                                             |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prefer-const`             | `let oddsList` e `let current` em `generateBetfairLadder()` convertidos para `const` — ambos são mutados mas nunca reatribuídos                     |
| Validação de entrada       | `findClosestLadder()` agora retorna `null` para entradas não-finitas ou inválidas (`NaN`, `Infinity`, negativos), evitando loop com dado corrompido |
| Otimização de busca        | Loop em `findClosestLadder()` interrompe com `break` quando a diferença começa a crescer (ladder ordenada de forma decrescente)                     |
| Guard em `getOddByTicks()` | Validação de `Number.isFinite(ticks)` antes do clamp; uso de `Array.find()` no lugar de loop imperativo                                             |
| JSDoc                      | Parâmetros e tipos de retorno documentados em todas as funções exportadas                                                                           |

### `minuteDecayEngine.js`

| Correção                       | Detalhe                                                                                                                 |
| :----------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| Variável morta removida        | `const _rowOffset = elapsed` — declarada mas nunca utilizada; removida completamente                                    |
| Guard em `applyGoalOddShift()` | Retorno seguro quando `findClosestLadder()` retorna `null` (antes causaria `TypeError: Cannot read properties of null`) |

### `GameSlot.js`

| Correção                      | Detalhe                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Warnings lint zerados         | 2 warnings de `no-console` eram os únicos pendentes — ambos intencionais (`console.warn` em `savePeriodStartTimes` e `saveSheetLog`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Cobertura de testes expandida | 61 novos testes adicionados em 12 novos `describe` blocos cobrindo: `getNominalEndMinute`, `getDisplayMinute`, `getInternalMinute`, `getEffectiveAddedMinutes`, `getCurveEndMinute`, `getMaxMinute`, `getLiveGameMinute`, `setPeriod`, `setInitialOdd`, `adjustInitialOdd`, `setAddedMinutes`, `adjustAddedMinutes`, `setTVMinute`, `setMinute`, `setSimulatedMinute`, `adjustCurrentMinute`, `returnToLiveMinute`, `activateAddedMinutesIfReached`, `clearEvents`, `startNewGame`, `registerPeriodStart`, `formatPeriodStartTime`, `pauseTimer`, `resetTimer`, `updateTimerDisplay`, `hydrateEventCorrections`, `loadSheetLog`, `loadPeriodStartTimes` |
| Cobertura de statements       | 51% → **81%**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Cobertura de lines            | 54% → **85%**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Cobertura de funções          | 42% → **61%**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### UI Inicial — Modo sem Autenticação

O fluxo de entrada foi completamente reformulado. Não existe mais nenhum campo de senha, mensagem de "aguardando aprovação" ou bloqueio de acesso na interface.

| Componente       | Estado atual                                                                                                       |
| :--------------- | :----------------------------------------------------------------------------------------------------------------- |
| `LoginModal.js`  | Reescrito — aba "Entrar" usa apenas e-mail; aba "Cadastrar" sem campo senha                                        |
| `authManager.js` | Reescrito — método `identify(email)` substitui `login(email, password)`; `isAuthenticated()` retorna `true` sempre |
| `app.js`         | Gate `if (!isAuthenticated()) loginModal.show()` removido — cockpit abre diretamente                               |
| `index.html`     | Sem campos `type="password"`, sem IDs `loginPasswordInput` ou similares                                            |

Ao abrir a aplicação:

1. O cockpit carrega direto, sem tela de login
2. O usuário pode opcionalmente clicar em "Entrar" no header para registrar seu perfil
3. Cadastros novos ficam ativos imediatamente, sem aprovação pendente
4. Dados salvos apenas no `localStorage` do navegador

### Warnings de `no-console` — Resolvidos por Configuração

A regra `no-console` do ESLint foi atualizada em `eslint.config.js` para refletir o uso real dos consoles no projeto:

```js
// console.log → proibido em produção (warning)
// console.warn/error → permitidos (guards de catch de localStorage)
'no-console': ['warn', { allow: ['warn', 'error'] }]
```

Com essa configuração, o lint global passa com **0 erros e 0 warnings** nos módulos de produção.

#### Módulos de produção — 0 warnings (`console.warn`/`error` liberados)

| Arquivo                              | Tipo            | Função(ões)                                       | Justificativa                                                                                |
| :----------------------------------- | :-------------- | :------------------------------------------------ | :------------------------------------------------------------------------------------------- |
| `js/app.js`                          | `console.warn`  | `loadSettings()`, `saveSettings()`                | Guard de catch — único sinal quando configurações não carregam/salvam no localStorage        |
| `js/components/GameSlot.js`          | `console.warn`  | `savePeriodStartTimes()`, `saveSheetLog()`        | Guard de catch — perda do sheetLog corromperia toda a lógica de correção de odds             |
| `js/components/OperationsHistory.js` | `console.error` | `loadTrades()`, `saveTrades()`                    | `error` (mais grave que `warn`) — perda do histórico de trades é dado crítico e irreversível |
| `js/core/themeManager.js`            | `console.warn`  | `loadTheme()`, `saveTheme()`, `resetToDefaults()` | Guard de catch — tema tem fallback visual mas warn avisa que preferência não persistirá      |

#### Script de demonstração — `no-console: off`

| Arquivo             | Tipo          | Descrição                                                                                                                                                                     |
| :------------------ | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logic_fix_demo.js` | `console.log` | Script standalone de validação de lógica. Não importado pelo bundle. Bloco próprio no `eslint.config.js` com `no-console: off` — os logs são a saída esperada de `runDemo()`. |

### Estado atual dos módulos

Todos os módulos do projeto passam lint e testes sem erros ou warnings:

```
ESLint   → 0 errors, 0 warnings  (console.warn/error permitidos; console.log off em demo)
Prettier → todos os arquivos conformes
Jest     → 84/84 testes passando
```

---

## 🚀 Próximos Passos

O projeto está estável e documentado, mas há um caminho claro para evoluir em segurança, persistência e qualidade.

### 🔐 Autenticação Segura

Duas opções viáveis, com trade-offs distintos:

**Backend Node.js** (maior controle, exige manutenção de servidor)

- Rotas reais (`/auth/forgot-password`, `/auth/reset-password`) com Express + SQLite
- Hash seguro de senhas com bcrypt
- Envio de e-mails de reset via SMTP (ex: Gmail, Resend)
- 2FA com TOTP via `speakeasy`, compatível com Google Authenticator

**Firebase Authentication** (sem servidor, mais rápido de implementar)

- Login, reset de senha e 2FA prontos, sem backend próprio
- Funciona com GitHub Pages — sem infraestrutura para manter
- Gratuito no plano básico, mas cria dependência do Google

|                             |      Backend Node.js      | Firebase Authentication |
| :-------------------------- | :-----------------------: | :---------------------: |
| Servidor próprio necessário |          ✅ Sim           |         ❌ Não          |
| Funciona no GitHub Pages    |          ❌ Não           |         ✅ Sim          |
| Controle total dos dados    |         ✅ Total          |   ⚠️ Parcial (Google)   |
| Forgot/reset password       |        Implementar        |        ✅ Pronto        |
| 2FA (TOTP)                  | Implementar (`speakeasy`) |        ✅ Pronto        |
| Custo operacional           |   Hosting + manutenção    | Gratuito (plano básico) |
| Tempo de implementação      |          Semanas          |          Dias           |
| Dependência externa         |           Baixa           |      Alta (Google)      |

### 💾 Persistência de Dados

- Migrar de `localStorage` para banco real (SQLite ou Postgres)
- Sincronização entre dispositivos
- Rotina de backup, exportação e importação de dados

### 📊 Testes e Qualidade

- Expandir cobertura para 90%+, incluindo `startTimer()` com fake timers do Jest
- Testes de UI para validar `render()` e interações visuais
- Pipeline CI/CD com lint, testes e build já configurado — expandir para deploy automático

### 🔎 Roadmap de Features

- 2FA para admin quando houver backend
- Gestão de usuários com perfis e permissões
- Logger estruturado em produção (substituir `console.warn` por solução centralizada quando houver backend)
- Modo offline com Service Worker e cache inteligente
