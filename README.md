# Pomodoro

Aplicação web minimalista para a [técnica Pomodoro](https://pt.wikipedia.org/wiki/T%C3%A9cnica_pomodoro): temporizador com foco, pausas curtas e longas, lista de tarefas e registo de distrações. Construída com **Next.js (App Router)**, **Tailwind CSS v4**, **shadcn/ui** e TypeScript.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando      | Descrição        |
| ------------ | ---------------- |
| `npm run dev`    | Servidor de desenvolvimento (Turbopack) |
| `npm run dev:webpack` | Next em modo Webpack (browser ou `electron:dev:hot`) |
| `npm run build`  | Build de produção           |
| `npm run start`  | Servidor após build         |
| `npm run lint`   | ESLint                      |
| `npm run electron:dev` | Build (se preciso) + `next start` + Electron — **caminho estável** |
| `npm run electron:dev:hot` | `next dev --webpack` + Electron (HMR; pode falhar no Electron) |
| `npm run electron:start` | Só Electron (Next já a correr em :3000) |
| `npm run electron:build` | Empacota `.app`/`.dmg` (macOS) |

### App desktop (macOS)

Shell **Electron** que carrega a mesma UI (URL local ou deploy). Ver [`electron/README.md`](electron/README.md).

## Publicar no GitHub

Se o repositório `https://github.com/andzvedo/pomodoro` ainda não existir, crie-o vazio (sem README) na interface do GitHub. Depois:

```bash
git remote add origin https://github.com/andzvedo/pomodoro.git
git push -u origin main
```

Se já existir um remoto, use `git remote set-url origin …` em alternativa.

## Licença

MIT
