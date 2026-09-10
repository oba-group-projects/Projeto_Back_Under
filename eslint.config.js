import globals from 'globals';
import pluginJest from 'eslint-plugin-jest';
import prettierConfig from 'eslint-config-prettier';

export default [
  // ── Arquivos ignorados ───────────────────────────────────────────────────
  {
    ignores: ['node_modules/**', 'qwen-code/**', 'odd-globl-live/**', 'coverage/**', 'docs/**'],
  },

  // ── Código-fonte principal (js/ e raiz) ──────────────────────────────────
  //
  // Regra no-console:
  //   console.warn  → permitido — usado como guard em blocos catch de localStorage
  //                   (app.js, GameSlot.js, OperationsHistory.js, themeManager.js).
  //                   É a única forma de sinalizar falhas silenciosas numa SPA sem backend.
  //   console.error → permitido — usado em OperationsHistory.js para falhas de dado crítico
  //                   (perda de histórico de trades é irreversível).
  //   console.log   → proibido em produção (warning) — só permitido em scripts de demo
  //                   (ver bloco específico de logic_fix_demo.js abaixo).
  {
    files: ['js/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      // Erros reais que devem quebrar o build
      'no-undef': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-duplicate-imports': 'error',

      // console.log proibido; console.warn/error permitidos (guards de catch)
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Boas práticas — avisos, não bloqueantes no CI
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      'no-var': 'warn',
      'prefer-const': 'warn',
    },
  },

  // ── Script de demonstração (logic_fix_demo.js) ───────────────────────────
  //
  // Arquivo standalone de validação de lógica — não é importado pelo bundle.
  // console.log é a saída esperada de runDemo() e deve ser liberado completamente.
  {
    files: ['logic_fix_demo.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // ── Arquivos de teste Jest ───────────────────────────────────────────────
  {
    files: ['**/*.test.js'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...pluginJest.environments.globals.globals,
      },
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
      // Permite console nos testes
      'no-console': 'off',
      // jest/expect-expect pode dar falso positivo em testes de exceção
      'jest/expect-expect': 'warn',
    },
  },

  // ── Desativa regras que conflitam com Prettier (sempre por último) ────────
  prettierConfig,
];
