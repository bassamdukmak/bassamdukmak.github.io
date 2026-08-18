"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

type InstagramPost = {
  id: string;
  caption: string;
  mediaType: string;
  imageUrl: string;
  permalink: string;
  timestamp: string;
};

type InstagramResponse = {
  connected?: boolean;
  posts?: InstagramPost[];
  profileUrl?: string;
};

const PROFILE_URL = "https://www.instagram.com/phoenix_utdfc/";

const FALLBACK_POSTS: InstagramPost[] = [
  {
    id: "fallback-DbTUyXZMALJ",
    caption: "Phoenix United is officially competing in the UAE Third Division League.",
    mediaType: "IMAGE",
    imageUrl: "/media/instagram-latest/01-DbTUyXZMALJ.jpg",
    permalink: "https://www.instagram.com/phoenix_utdfc/p/DbTUyXZMALJ/",
    timestamp: "2026-07-27T00:00:00+04:00",
  },
  {
    id: "fallback-DcED-LpDNxZ",
    caption: "Phoenix football leadership together in Dubai.",
    mediaType: "IMAGE",
    imageUrl: "/media/instagram-latest/02-DcED-LpDNxZ.jpg",
    permalink: "https://www.instagram.com/phoenix_utdfc/p/DcED-LpDNxZ/",
    timestamp: "2026-08-15T00:00:00+04:00",
  },
  {
    id: "fallback-Db3XkPUjCwh",
    caption: "One trial, two clubs: Phoenix United and Radcliffe FC.",
    mediaType: "IMAGE",
    imageUrl: "/media/instagram-latest/03-Db3XkPUjCwh.jpg",
    permalink: "https://www.instagram.com/phoenix_utdfc/p/Db3XkPUjCwh/",
    timestamp: "2026-08-10T00:00:00+04:00",
  },
  {
    id: "fallback-DcJUFVBCxjb",
    caption: "A Phoenix United player interview.",
    mediaType: "REELS",
    imageUrl: "/media/instagram-latest/04-DcJUFVBCxjb.jpg",
    permalink: "https://www.instagram.com/phoenix_utdfc/reel/DcJUFVBCxjb/",
    timestamp: "2026-08-17T00:00:00+04:00",
  },
  {
    id: "fallback-DcJM863DIOp",
    caption: "Welcome to Phoenix, Taofiq Yekini.",
    mediaType: "IMAGE",
    imageUrl: "/media/instagram-latest/05-DcJM863DIOp.jpg",
    permalink: "https://www.instagram.com/phoenix_utdfc/p/DcJM863DIOp/",
    timestamp: "2026-08-17T00:00:00+04:00",
  },
  {
    id: "fallback-DcGvCg5CT8P",
    caption: "A Phoenix United player interview from Dubai.",
    mediaType: "REELS",
    imageUrl: "/media/instagram-latest/06-DcGvCg5CT8P.jpg",
    permalink: "https://www.instagram.com/phoenix_utdfc/reel/DcGvCg5CT8P/",
    timestamp: "2026-08-16T00:00:00+04:00",
  },
];

function postAlt(post: InstagramPost) {
  const caption = post.caption.replace(/\s+/g, " ").trim();
  return caption
    ? `Phoenix United Instagram post: ${caption.slice(0, 140)}`
    : "Phoenix United Instagram post";
}

export function InstagramFeed() {
  // Keep verified local Phoenix posts visible while the optional Meta feed loads.
  const [posts, setPosts] = useState<InstagramPost[]>(FALLBACK_POSTS);
  const [profileUrl, setProfileUrl] = useState(PROFILE_URL);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/instagram", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Instagram feed unavailable");
        return (await response.json()) as InstagramResponse;
      })
      .then((payload) => {
        if (payload.profileUrl) setProfileUrl(payload.profileUrl);
        const latestPosts =
          payload.connected && Array.isArray(payload.posts) ? payload.posts : [];
        setPosts(latestPosts.length > 0 ? latestPosts : FALLBACK_POSTS);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPosts(FALLBACK_POSTS);
      });

    return () => controller.abort();
  }, []);

  return (
    <section
      id="instagram"
      className="instagram-band"
      aria-labelledby="instagram-band-title"
    >
      <div className="instagram-profile">
        <div className="instagram-profile-identity">
          <img
            className="instagram-profile-avatar"
            src="/images/phoenix-crest.png"
            width={72}
            height={72}
            loading="lazy"
            decoding="async"
            alt="Phoenix United crest"
          />
          <div>
            <h2 id="instagram-band-title">Phoenix United FC</h2>
            <p className="instagram-handle">@phoenix_utdfc</p>
          </div>
        </div>
        <div
          className="instagram-profile-meta"
          aria-label="Phoenix Instagram profile facts"
        >
          <p>
            <strong>Dubai</strong>
            <span>Base</span>
          </p>
          <p>
            <strong>26/27</strong>
            <span>Season</span>
          </p>
          <p>
            <strong>DXB · MAN · ALG</strong>
            <span>Network</span>
          </p>
        </div>
        <a
          className="instagram-follow"
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="instagram-glyph" aria-hidden="true" />
          Follow Phoenix on Instagram.
        </a>
      </div>

      <div
        className={`instagram-band-grid${posts[0]?.id.startsWith("fallback-") ? " is-fallback" : ""}`}
      >
          {posts.map((post) => (
            <a
              href={post.permalink}
              target="_blank"
              rel="noreferrer"
              aria-label="View Phoenix United post on Instagram"
              key={post.id}
            >
              <img
                src={post.imageUrl}
                width={900}
                height={1125}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                alt={postAlt(post)}
              />
              <span className="instagram-post-mark" aria-hidden="true">
                {post.mediaType === "VIDEO" || post.mediaType === "REELS" ? (
                  <span className="instagram-video-mark">▶</span>
                ) : (
                  <span className="instagram-glyph instagram-glyph-light" />
                )}
              </span>
            </a>
          ))}
      </div>
    </section>
  );
}
