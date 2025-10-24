# Footnote System

## Components

- **FootnoteRef.astro** - Creates a superscript reference link (e.g., [1])
- **Footnotes.astro** - Renders the footnotes section at the bottom

## Usage in Astro Files

### 1. Import the components

```astro
---
import FootnoteRef from "../components/footnotes/FootnoteRef.astro";
import Footnotes from "../components/footnotes/Footnotes.astro";
---
```

### 2. Define footnotes in the frontmatter

```astro
---
const footnotes = [
	{
		id: "1",
		content: "sample footnote 1"
	},
	{
		id: "2",
		content: "sample footnote 2"
	}
];
---
```

### 3. Use components in content

```astro
<p>
	Some text that needs a footnote.<FootnoteRef id="1" /> More text with another footnote.<FootnoteRef id="2" /> Text without a footnote.
</p>

<!-- At the end of the content, render all footnotes -->
<Footnotes notes={footnotes} />
```

## Usage in Markdown files

### Option 1: Use HTML directly in Markdown

Markdown supports inline HTML:

```markdown
Some text that needs a footnote.<a href="#footnote-1" class="footnote-ref">[1]</a> Text without a footnote.

---

<div class="footnotes-section">
  <div id="footnote-1" class="footnote-item">
    <span class="footnote-number">[1]</span>sample footnote 1.
  </div>
</div>
```

### Option 2: MDX

1. Install MDX support:
```bash
npm install @astrojs/mdx
```

2. Update `astro.config.mjs`:
```js
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [mdx()],
});
```

3. Use components directly in `.mdx` files:
```mdx
import FootnoteRef from "../components/footnotes/FootnoteRef.astro";
import Footnotes from "../components/footnotes/Footnotes.astro";

export const footnotes = [
  { id: "1", content: "sample footnote 1" }
];

Some text with a footnote.<FootnoteRef id="1" />

<Footnotes notes={footnotes} />
```

## Customization

To customize the appearance, edit the footnote styles in `src/styles/global.css`:

- `.footnote-ref` - The superscript reference links
- `.footnotes-section` - The container for all footnotes
- `.footnote-item` - Individual footnote items
- `.footnote-number` - The footnote numbers at the bottom
