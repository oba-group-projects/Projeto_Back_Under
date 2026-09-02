# ⚽ Projeto Back Under - Terminal Web de Trading Esportivo Multi-Jogos

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

| Estratégia | Odds de Base | Multiplicador de Stake | Lucro Médio | Red Médio | Lucro Estimado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Back Under (Parede V6)** | 1.14 a 8.56 | Proporcional ao Stop | Pêndulo Bloco | Red Aceitável | 2% a 13% |
| **Lay Parelho 1º Tempo** | Abaixo de 5.0 | $Red \times 2.50$ | $Stake \times 20\%$ | $Stake \times 40\%$ | 15% à 25% |
| **Lay Zebra 1º Tempo** | De 5.5 a 10.0 | $Red \times 3.33$ | $Stake \times 10\%$ | $Stake \times 30\%$ | 8% à 12% |
| **Lay Super Zebra 1º Tempo** | De 11.0 a 15.0 | $Red \times 5.55$ | $Stake \times 6\%$ | $Stake \times 18\%$ | 5% à 7% |
| **Drakito 1º Tempo Parelho** | De 8.0 a 13.0 | $Red \times 4.00$ | $Stake \times 7.5\%$ | $Stake \times 25\%$ | 5% à 10% |
| **Drakito 1º Tempo Favorito** | De 13.0 a 20.0 | $Red \times 6.66$ | $Stake \times 5\%$ | $Stake \times 15\%$ | 4% à 6% |
| **Vovô Back Favorito** | Back 1.04 - 1.05 | $Red \times 8.34$ | $Stake \times 3.5\%$ | $Stake \times 12\%$ | 2% à 5% |
| **Vovô Lay Tempo** | Lay 35/50 - 70min | $Red \times 12.50$ | $Stake \times 2\%$ | $Stake \times 8\%$ | 2% à 3% |

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
*Garante que todas as fórmulas de stake, escada de odds da Betfair e lookup de pêndulos estejam com 100% de exatidão.*
