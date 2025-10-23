import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getContainerRenderer as getMDXRenderer } from "@astrojs/mdx";
import { loadRenderers } from "astro:container";
import { getCollection, render } from "astro:content";
import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";

export async function GET(context) {
	const renderers = await loadRenderers([getMDXRenderer()]);
	const container = await AstroContainer.create({ renderers });
	const posts = await getCollection("blog");

	const items = [];

	for (const post of posts) {
		const { Content } = await render(post);
		const content = await container.renderToString(Content);
		items.push({
			...post.data,
			link: `/blog/${post.id}/`,
			content,
		});
	}

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items,
		customData: `<language>en-us</language>`,
	});
}
