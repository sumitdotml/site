export type SocialLink = {
	label: string;
	href: string;
	icon: "mail" | "github" | "twitter" | "rss";
	external?: boolean;
};

export const SOCIAL_LINKS: SocialLink[] = [
	{
		label: "Email",
		href: "mailto:sumit@sumit.ml",
		icon: "mail",
		external: false,
	},
	{
		label: "GitHub",
		href: "https://github.com/sumitdotml",
		icon: "github",
		external: true,
	},
	{
		label: "Twitter",
		href: "https://x.com/sumitdotml",
		icon: "twitter",
		external: true,
	},
	{
		label: "RSS",
		href: "/rss.xml",
		icon: "rss",
		external: false,
	},
];
