# sumit.ml 

1. <a href="#why-i-built-this">Why I Built This</a>
2. <a href="#using-this-code">Using This Code</a>
3. <a href="#running-locally">Running Locally</a>
4. <a href="#navigating-writing-content">Navigating & Writing Content</a>
5. <a href="#development-commands">Development Commands</a>
6. <a href="#deploying">Deploying</a>

Minimal site built with Astro. I mainly record my blog posts, research worklogs, and nonsense here.

Everything here is static, since pretty much everything I wanna do involves writing and a couple of img srcs. Some monospace and a blank white/black background was enough to satisfy my eyes.

There's some basic linting and prettier checks in place (commands <a href="#development-commands">below</a>) to help you keep your code clean and consistent.

## Why I Built This <a id="why-i-built-this"></a>

I needed something dead simple for jotting down research notes, worklogs, and random thoughts without getting caught up in making the site itself look perfect. My previous site was built with Next.js and looked way too polished, which meant I spent more time tweaking animations and styling than actually writing anything useful. Archived that version now.

## Using This Code <a id="using-this-code"></a>

If you found something useful here, take it. I built this for myself, but there's no reason to keep it locked down. The components are simple, the structure is straightforward, and if any of it helps you build your own site, go ahead.

No need to ask permission or give credit, though I won't mind if you do and star this repo. I will, however, request you read <a href="#deploying">the deployment info below</a> and if possible, use a different deployment service. All I ask. Other than that, do whatever makes sense for your project.

## Running Locally <a id="running-locally"></a>

1. Clone the repository

```bash
git clone https://github.com/sumitdotml/sumit.ml.git
cd sumit.ml
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

and you're good to go.

## Navigating & Writing Content <a id="navigating-writing-content"></a>

This one is intentionally bare bones. You drop a markdown or mdx file in `/content/blog` or `/content/pages` (for standalone pages other than blog), add some required frontmatter (check the files currently existing in these directories for examples), and the file name becomes your slug. That's it. No build complexity, no state management, no temptation to over-engineer things. Just write and publish :)

I made this specifically to stay focused on learning and documenting my research instead of falling into the rabbit hole of site optimization. If you're someone who wants to spend time on content rather than endlessly tuning your personal site, this approach might work for you too.

## Development Commands <a id="development-commands"></a>

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check for code issues |
| `npm run lint:fix` | Run ESLint and automatically fix issues |
| `npm run format` | Check code formatting with Prettier |
| `npm run format:write` | Format all code with Prettier |


## Deploying <a id="deploying"></a>

It's a fully static site, so deploying is a breeze.

I am currently using Cloudflare Pages to deploy this site. Whenever I push my code to GitHub, Cloudflare Pages automatically builds and deploys the site. Pretty handy.

I don't recommend using Vercel, however, since one of the main reasons I built this site was to avoid using Vercel's services. So if you're looking to use this repo as a starting point for your own site, I'd sleep a bit better knowing you're not using it. Can't stop you, but just letting you know.
