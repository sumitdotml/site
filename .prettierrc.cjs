module.exports = {
	tabWidth: 2,
	useTabs: true,
	singleQuote: false,
	bracketSpacing: true,
	htmlWhitespaceSensitivity: "css",
	plugins: ["prettier-plugin-astro"],
	overrides: [
		{
			files: "*.astro",
			options: {
				parser: "astro",
			},
		},
		{
			files: "*.mdx",
			options: {
				parser: "mdx",
			},
		},
	],
};
