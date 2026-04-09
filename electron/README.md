# Pomodoro — shell Electron (macOS)

## Desenvolvimento (recomendado)

Na raiz do repositório:

```bash
npm install
npm run electron:dev
```

Por defeito o script faz **`next build`** (se ainda não existir `.next/BUILD_ID`, ou se usares `ELECTRON_FORCE_BUILD=1`) e depois **`next start`** na porta 3000, e só então abre o Electron. Isto **não usa** o WebSocket de HMR do `next dev`, que no Chromium do Electron costuma falhar (`ERR_INVALID_HTTP_RESPONSE`).

- **Primeira execução:** demora mais (build completo).
- **Mudaste código e a janela está desatualizada:** `npm run build` ou `ELECTRON_FORCE_BUILD=1 npm run electron:dev`.
- **Reabrir rápido sem rebuild:** `ELECTRON_SKIP_BUILD=1 npm run electron:dev` (só se já tiveres um `.next` válido).

### Modo com hot reload (opcional, pode falhar)

```bash
npm run electron:dev:hot
```

Equivale a `ELECTRON_USE_NEXT_DEV=1` + `next dev --webpack`. Usa só se precisares de HMR; se voltar a falhar, volta ao `npm run electron:dev`.

### Dois terminais (manual)

1. `npm run build` (uma vez ou após alterações)
2. `npm run start`
3. Noutro terminal: `npm run electron:start`

> Não coloques comentários (`# …`) na mesma linha que `npm run …` no zsh — pode interpretar mal o comando.

### Depuração

Em **localhost**, as DevTools abrem automaticamente. Para forçar noutro URL:

```bash
ELECTRON_OPEN_DEVTOOLS=1 npm run electron:start
```

## URL carregada

- Por defeito: `http://127.0.0.1:3000`
- Produção (teste do instalador):  
  `POMODORO_APP_URL=https://seu-dominio.vercel.app npm run electron:start`

## Build `.app` / `.dmg` (macOS)

```bash
POMODORO_APP_URL=https://seu-dominio.vercel.app npm run electron:build
```

Os artefactos ficam em `dist-electron/`. Sem `POMODORO_APP_URL`, o pacote continua a usar `127.0.0.1:3000` — útil só para validar o empacotamento.

Assinatura e notarização Apple são passos separados (Developer ID, `notarytool`).
