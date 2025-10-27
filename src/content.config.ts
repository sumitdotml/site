import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const dateLabelsSchema = z
	.object({
		published: z.string().optional(),
		updated: z.string().optional(),
		page: z.string().optional(),
	})
	.optional();

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			breadcrumbTitle: z.string().optional(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			dateLabels: dateLabelsSchema,
			image: image().optional(),
		}),
});

const pages = defineCollection({
	loader: glob({ base: "./src/content/pages", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			breadcrumbTitle: z.string().optional(),
			date: z.coerce.date().optional(),
			dateLabel: z.string().optional(),
			dateLabels: dateLabelsSchema,
			image: image().optional(),
		}),
});

export const collections = { blog, pages };
