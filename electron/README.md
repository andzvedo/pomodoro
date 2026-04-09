# Pomodoro — shell Electron (macOS)

## Desenvolvimento

1. Na raiz do repositório: `npm install`
2. `npm run electron:dev` — sobe o Next em `http://127.0.0.1:3000` e abre a janela Electron.

Ou em dois terminais: `npm run dev` e, quando o Next estiver pronto, `npm run electron:start`.

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
