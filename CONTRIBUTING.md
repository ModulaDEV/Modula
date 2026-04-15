# Contributing to Modula

Thanks for the interest. Modula is an open protocol — the landing
site, the contracts, and the SDKs are all MIT-licensed and welcome
external contribution.

## How to contribute

1. **File an issue first for non-trivial changes.** For a typo or a
   CSS tweak, a PR is fine. For anything that touches copy, structure,
   or the protocol story, open an issue so we can align before you
   spend time on a PR.
2. **Keep PRs narrow.** One change per PR. If you notice something
   unrelated while you're in there, open a second PR.
3. **Match the existing voice.** Modula's public copy is spare and
   factual — "a protocol, not a product". Avoid marketing adjectives.

## Local development

```bash
git clone https://github.com/ModulaDEV/Modula.git
cd modula
npm install
npm run dev
```

The site runs on `http://localhost:3000`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server with hot reload. |
| `npm run dev:turbo` | Dev server with Turbopack. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm run lint` | Run ESLint over the project. |

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/).
Every commit should be scoped and descriptive enough to stand alone:

```
feat(economics): add bonding-curve explainer with animated SVG chart
fix(reveal): drop polymorphic 'as' prop, use a plain div wrapper
chore(deps): bump next to 15.2.4
```

Bodies are encouraged — explain *why* a change was made, not just
what it does. Short PR descriptions and long commit bodies are the
project house style.

## Code style

- TypeScript strict mode. No `any`.
- Functional React components with hooks.
- Data-driven sections: copy lives in `data/` or `site.config.ts`,
  never inlined in a component.
- Framer Motion for animations; IntersectionObserver for reveal.
- Keep the Base blue / white palette as the only colour axis.

## License

By contributing, you agree your contributions are licensed under the
project's MIT license.
