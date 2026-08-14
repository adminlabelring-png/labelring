import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Every route currently ships the exact same <title>/description/canonical
// baked into index.html — worst of all, canonical always points at "/", so
// every non-home page tells Google its canonical version IS the homepage.
// This hook lets each route own its own title, description, canonical URL,
// and (optionally) structured data, overwriting index.html's static
// defaults after mount and restoring them on unmount.

export const SITE_URL = "https://labelring.vercel.app";

interface SeoOptions {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
  image?: string;
  type?: "website" | "article";
  jsonLd?: object | object[];
}

const upsertMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const useSeo = ({
  title,
  description,
  path,
  noindex = false,
  image,
  type = "website",
  jsonLd,
}: SeoOptions) => {
  const location = useLocation();
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const prevTitle = document.title;
    const url = `${SITE_URL}${path ?? location.pathname}`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertLink("canonical", url);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", type);
    if (image) upsertMeta("property", "og:image", image);

    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);

    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLdKey) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.text = jsonLdKey;
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = prevTitle;
      scriptEl?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, noindex, image, type, jsonLdKey, location.pathname]);
};
