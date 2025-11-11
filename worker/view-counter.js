/**
 * Cloudflare Worker for tracking blog post views
 *
 * This worker handles incrementing and retrieving view counts for blog posts.
 * View counts are stored in Cloudflare KV with the pattern: views:{slug}
 */
/* global URL, Response, console, TextEncoder, crypto */

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 20;
const DEDUP_WINDOW_SECONDS = 24 * 60 * 60;
const API_KEY_HEADER = "X-Worker-Api-Key";

const textEncoder = new TextEncoder();

const bufferToHex = (buffer) => {
	return [...new Uint8Array(buffer)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
};

const deriveDedupKey = async (slug, clientIp, salt = "") => {
	const data = textEncoder.encode(`${clientIp}:${slug}:${salt}`);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashHex = bufferToHex(hashBuffer);
	return `dedup:${slug}:${hashHex}`;
};

const SLUG_MAX_LENGTH = 256;
const slugRegex = /^[a-zA-Z0-9-_/]+$/;

const validateSlug = (slug) => {
	if (!slug || typeof slug !== "string") {
		return { valid: false, error: "Missing slug" };
	}

	if (slug.length > SLUG_MAX_LENGTH) {
		return { valid: false, error: "Slug too long" };
	}

	if (!slugRegex.test(slug)) {
		return { valid: false, error: "Slug contains invalid characters" };
	}

	return { valid: true };
};

const parseAllowedOrigins = (value) => {
	if (!value) {
		return [];
	}

	return value
		.split(",")
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0);
};

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
		if (allowedOrigins.length === 0) {
			console.error("ALLOWED_ORIGINS environment variable is not set");
			return new Response(
				JSON.stringify({ error: "View counter misconfigured" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const requestOrigin = request.headers.get("Origin");
		const originAllowed = requestOrigin
			? allowedOrigins.includes(requestOrigin)
			: false;

		const corsHeaders = {
			"Access-Control-Allow-Origin": originAllowed
				? requestOrigin
				: allowedOrigins[0],
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": `Content-Type, ${API_KEY_HEADER}`,
		};

		if (requestOrigin && !originAllowed) {
			return new Response(JSON.stringify({ error: "Origin not allowed" }), {
				status: 403,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		if (!["GET", "POST"].includes(request.method)) {
			return new Response("Method not allowed", {
				status: 405,
				headers: corsHeaders,
			});
		}

		// extracting slug from URL path: /views/{slug}
		const pathMatch = url.pathname.match(/^\/views\/(.+)$/);
		if (!pathMatch) {
			return new Response(
				JSON.stringify({ error: "Invalid path. Use /views/{slug}" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		const slug = pathMatch[1];
		const slugValidation = validateSlug(slug);
		if (!slugValidation.valid) {
			return new Response(JSON.stringify({ error: slugValidation.error }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}
		const kvKey = `views:${slug}`;

		const dedupSalt = env.DEDUP_SALT;
		if (!dedupSalt) {
			console.error("DEDUP_SALT environment variable is not set");
			return new Response(
				JSON.stringify({ error: "View counter misconfigured" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		const expectedApiKey = env.VIEW_COUNTER_API_KEY || "";

		const getClientIp = () => {
			const cfConnectingIp = request.headers.get("CF-Connecting-IP");
			if (cfConnectingIp) {
				return cfConnectingIp;
			}

			const forwardedFor = request.headers.get("X-Forwarded-For");
			if (forwardedFor) {
				return forwardedFor.split(",")[0].trim();
			}

			return null;
		};

		// simple sliding window rate limiter keyed by client IP
		const enforceRateLimit = async () => {
			const clientIp = getClientIp();
			if (!clientIp) {
				return false;
			}

			const currentWindow = Math.floor(
				Date.now() / 1000 / RATE_LIMIT_WINDOW_SECONDS,
			);
			const rateLimitKey = `ratelimit:${clientIp}:${currentWindow}`;
			const currentCount = await env.BLOG_VIEWS.get(rateLimitKey);
			const count = currentCount ? parseInt(currentCount, 10) : 0;

			if (count >= RATE_LIMIT_MAX_REQUESTS) {
				return true;
			}

			await env.BLOG_VIEWS.put(rateLimitKey, (count + 1).toString(), {
				expirationTtl: RATE_LIMIT_WINDOW_SECONDS + 5,
			});

			return false;
		};

		const getDedupState = async () => {
			const clientIp = getClientIp();
			if (!clientIp) {
				return { dedupKey: null, alreadyViewed: false };
			}

			const dedupKey = await deriveDedupKey(slug, clientIp, dedupSalt);
			const alreadyViewed = Boolean(await env.BLOG_VIEWS.get(dedupKey));

			return { dedupKey, alreadyViewed };
		};

		try {
			if (request.method === "POST") {
				if (expectedApiKey) {
					const providedApiKey = request.headers.get(API_KEY_HEADER);
					if (providedApiKey !== expectedApiKey) {
						return new Response(JSON.stringify({ error: "Unauthorized" }), {
							status: 401,
							headers: { ...corsHeaders, "Content-Type": "application/json" },
						});
					}
				}

				const isLimited = await enforceRateLimit();
				if (isLimited) {
					return new Response(JSON.stringify({ error: "Too many requests" }), {
						status: 429,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					});
				}

				const dedupState = await getDedupState();
				const currentCount = await env.BLOG_VIEWS.get(kvKey);
				const parsedCount = currentCount ? parseInt(currentCount, 10) : 0;

				if (dedupState.alreadyViewed) {
					return new Response(JSON.stringify({ slug, views: parsedCount }), {
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					});
				}

				const newCount = parsedCount + 1;
				await env.BLOG_VIEWS.put(kvKey, newCount.toString());

				if (dedupState.dedupKey) {
					await env.BLOG_VIEWS.put(dedupState.dedupKey, "1", {
						expirationTtl: DEDUP_WINDOW_SECONDS,
					});
				}

				return new Response(JSON.stringify({ slug, views: newCount }), {
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			} else {
				// GET: retrieving view count
				const count = await env.BLOG_VIEWS.get(kvKey);
				const views = count ? parseInt(count, 10) : 0;

				return new Response(JSON.stringify({ slug, views }), {
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}
		} catch (error) {
			console.error("View counter worker error", error);
			return new Response(JSON.stringify({ error: "Internal server error" }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}
	},
};
