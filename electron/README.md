# Pomodoro — shell Electron (macOS)

## Desenvolvimento

1. Na raiz do repositório: `npm install`
2. Executa **só** o comando (sem texto à frente na mesma linha):

```bash
npm run electron:dev
```

Isto sobe o Next em `http://127.0.0.1:3000` e abre o Electron (script `electron/run-dev.mjs`).

**Alternativa em dois terminais:** `npm run dev` e, quando o Next estiver pronto, `npm run electron:start`.

> Não coloques comentários (`# …`) na mesma linha que `npm run …` no terminal — o zsh pode interpretar mal o comando.

### Depuração

Em **localhost**, as DevTools abrem automaticamente (podes fechar o painel). Para forçar noutro URL:

```bash
ELECTRON_OPEN_DEVTOOLS=1 npm run electron:start
```

A UI do Pomodoro carrega com **`next/dynamic` + `ssr: false`** para evitar bloqueios de hidratação no Electron (`localStorage` + timers).

## URL carregada

- Por defeito: `http://127.0.0.1:3000`
- Para apontar para produção (teste local do instalador):  
  `POMODORO_APP_URL=https://seu-dominio.vercel.app npm run electron:start`

## Build `.app` / `.dmg` (macOS)

```bash
POMODORO_APP_URL=https://seu-dominio.vercel.app npm run electron:build
```

Os artefactos ficam em `dist-electron/`. Sem `POMODORO_APP_URL`, o pacote continua a usar `127.0.0.1:3000` — útil só para validar o empacotamento.

Assinatura e notarização Apple são passos separados (Developer ID, `notarytool`).
