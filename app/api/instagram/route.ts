import { env } from "cloudflare:workers";

export const runtime = "edge";

type InstagramEnvironment = {
  INSTAGRAM_USER_ID?: string;
  INSTAGRAM_ACCESS_TOKEN?: string;
  INSTAGRAM_GRAPH_BASE_URL?: string;
  INSTAGRAM_API_VERSION?: string;
  INSTAGRAM_PINNED_MEDIA_IDS?: string;
};

type InstagramMedia = {
  id?: unknown;
  caption?: unknown;
  media_type?: unknown;
  media_url?: unknown;
  thumbnail_url?: unknown;
  permalink?: unknown;
  timestamp?: unknown;
};

const INSTAGRAM_PROFILE_URL =
  "https://www.instagram.com/phoenix_utdfc/";
const ALLOWED_GRAPH_HOSTS = new Set([
  "graph.instagram.com",
  "graph.facebook.com",
]);

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeHttpsUrl(value: unknown) {
  const candidate = text(value, 2_000);
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function graphBaseUrl(value: string | undefined) {
  try {
    const url = new URL(value || "https://graph.instagram.com");
    if (
      url.protocol !== "https:" ||
      !ALLOWED_GRAPH_HOSTS.has(url.hostname) ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}

function apiVersion(value: string | undefined) {
  return value && /^v\d{1,2}\.\d$/.test(value) ? value : "v25.0";
}

function pinnedMediaIds(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^\d{4,80}(?:_\d{4,80})?$/.test(id))
    .slice(0, 8);
}

function normalizeMedia(media: InstagramMedia) {
  const id = text(media.id, 170);
  const mediaType = text(media.media_type, 40).toUpperCase();
  const permalink = safeHttpsUrl(media.permalink);
  const imageUrl = safeHttpsUrl(
    mediaType === "VIDEO" || mediaType === "REELS"
      ? media.thumbnail_url
      : media.media_url,
  );
  const timestamp = text(media.timestamp, 40);

  if (!id || !permalink || !imageUrl) return null;

  return {
    id,
    caption: text(media.caption, 300),
    mediaType,
    imageUrl,
    permalink,
    timestamp: Number.isNaN(Date.parse(timestamp)) ? "" : timestamp,
  };
}

export async function GET() {
  const runtimeEnv = env as unknown as InstagramEnvironment;
  const userId = text(runtimeEnv.INSTAGRAM_USER_ID, 170);
  const accessToken = text(runtimeEnv.INSTAGRAM_ACCESS_TOKEN, 2_000);
  const baseUrl = graphBaseUrl(runtimeEnv.INSTAGRAM_GRAPH_BASE_URL);

  if (!/^\d{4,80}$/.test(userId) || !accessToken || !baseUrl) {
    return Response.json(
      {
        connected: false,
        posts: [],
        profileUrl: INSTAGRAM_PROFILE_URL,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      },
    );
  }

  const mediaUrl = new URL(
    `${baseUrl}/${apiVersion(runtimeEnv.INSTAGRAM_API_VERSION)}/${userId}/media`,
  );
  mediaUrl.searchParams.set(
    "fields",
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
  );
  mediaUrl.searchParams.set("limit", "24");
  mediaUrl.searchParams.set("access_token", accessToken);

  try {
    const response = await fetch(mediaUrl, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Instagram request failed");

    const payload = (await response.json()) as { data?: unknown };
    const posts = (Array.isArray(payload.data) ? payload.data : [])
      .map((media) => normalizeMedia(media as InstagramMedia))
      .filter((media): media is NonNullable<typeof media> => Boolean(media));
    const pinOrder = pinnedMediaIds(runtimeEnv.INSTAGRAM_PINNED_MEDIA_IDS);
    const pinIndex = new Map(pinOrder.map((id, index) => [id, index]));

    posts.sort((left, right) => {
      const leftPin = pinIndex.get(left.id);
      const rightPin = pinIndex.get(right.id);
      if (leftPin !== undefined || rightPin !== undefined) {
        if (leftPin === undefined) return 1;
        if (rightPin === undefined) return -1;
        return leftPin - rightPin;
      }
      return Date.parse(right.timestamp) - Date.parse(left.timestamp);
    });

    return Response.json(
      {
        connected: true,
        posts: posts.slice(0, 8),
        profileUrl: INSTAGRAM_PROFILE_URL,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return Response.json(
      {
        connected: false,
        posts: [],
        profileUrl: INSTAGRAM_PROFILE_URL,
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      },
    );
  }
}
