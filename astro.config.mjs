// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// https://astro.build/config
export default defineConfig({
	site: "https://sumit.ml",
	integrations: [
		mdx({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
		sitemap(),
		react(),
	],
	markdown: {
		shikiConfig: {
			themes: {
				light: "catppuccin-latte",
				dark: "catppuccin-mocha",
			},
			defaultColor: false,
			wrap: false,
		},
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
});
