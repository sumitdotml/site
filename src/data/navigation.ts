export const HOME_ICON = "👾";

export type NavLink = {
	href: string;
	label: string;
};

export const NAV_LINKS: NavLink[] = [
	{ href: "/blog", label: "Blog" },
	{ href: "/about", label: "About" },
];

export function findNavLabel(pathSegment: string): string | undefined {
	const normalized = `/${pathSegment}`;
	return NAV_LINKS.find((link) => link.href === normalized)?.label;
}
