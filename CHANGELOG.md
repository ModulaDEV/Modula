# Changelog

All notable changes to the Modula landing site are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-04-15

### Added
- Dynamic Open Graph image route rendered on the Vercel edge.
- Programmatic `robots.txt` and `sitemap.xml` generated from `site.config.ts`.
- Flat ESLint config extending `next/core-web-vitals` + `next/typescript`.
- Production Vercel deployment wiring.

### Changed
- Reveal component simplified to a plain `<div>` wrapper to satisfy
  React 19's stricter JSX namespace under Next 15.

## [0.2.0] - 2026-04-15

### Added
- Hero with animated reveal + Base-blue gradient headline.
- Stats band (0% fee / ERC-7527 / MCP / x402).
- 'How it works' four-step protocol flow.
- Six-card Protocol Pillars grid.
- 'Built for agents' section with animated MCP terminal demo.
- Economics section with animated ERC-7527 bonding-curve SVG.
- Registry preview table with per-row sparklines.
- Eight-question FAQ accordion.
- Final call-to-action banner in Base blue.

## [0.1.0] - 2026-04-15

### Added
- Next.js 15 + React 19 + Framer Motion project scaffold.
- Base blue / white design system in `app/globals.css`.
- Root layout with Inter + JetBrains Mono, metadata, and ambient FX.
- Fixed scroll-reactive navigation with frosted-glass backdrop.
- Multi-column sitewide footer with protocol metadata strip.
- Reveal-on-scroll utility (IntersectionObserver, reduced-motion aware).
- SVG favicon, Modula logo component with gradient + mono variants.

[Unreleased]: https://github.com/ModulaDEV/Modula/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/ModulaDEV/Modula/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ModulaDEV/Modula/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ModulaDEV/Modula/releases/tag/v0.1.0
