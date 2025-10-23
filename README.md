# Site

Minimal site build with Astro. I will mainly record my blog posts, research worklogs, and nonsense here.

Everything here is static, since pretty much everything I wanna do involves writing and a couple of img srcs. Some monospace and a blank white/black background was enough to satisfy my eyes.

Very minimal, but I think it doesn't look too bad.

## Development

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check for code issues |
| `npm run lint:fix` | Run ESLint and automatically fix issues |
| `npm run format` | Check code formatting with Prettier |
| `npm run format:write` | Format all code with Prettier |

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Code Quality

This project uses ESLint and Prettier to maintain code quality and consistency.

Before committing changes, run:
```bash
npm run lint
npm run format:write
```
