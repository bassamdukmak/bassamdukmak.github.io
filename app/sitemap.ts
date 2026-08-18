import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://phoenixutd.com",
      lastModified: new Date("2026-08-11"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://phoenixutd.com/pathway",
      lastModified: new Date("2026-08-11"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://phoenixutd.com/network",
      lastModified: new Date("2026-08-16"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://phoenixutd.com/store",
      lastModified: new Date("2026-08-11"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://phoenixutd.com/contact",
      lastModified: new Date("2026-08-15"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://phoenixutd.com/privacy",
      lastModified: new Date("2026-08-11"),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
