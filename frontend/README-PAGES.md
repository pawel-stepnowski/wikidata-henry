GitHub Pages build (static)

1) Base path in vite.config.ts is set to /wiki-humans/ for GitHub Pages project sites.
2) Build and copy to /docs for GitHub Pages hosting at the repo root.

Commands:

- pnpm build
- pnpm build:pages

This produces frontend/dist and also copies it to ../docs. Commit and push the docs/ folder, then enable Pages to serve from the docs/ directory in repository settings.

If your repository name changes, update base in vite.config.ts to match the new path.
