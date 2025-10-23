// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://sumit.ml",
	integrations: [mdx(), sitemap(), react()],
	markdown: {
		shikiConfig: {
			themes: {
				light: "catppuccin-latte",
				dark: "catppuccin-mocha",
			},
			defaultColor: false,
			wrap: false,
		},
	},
});
