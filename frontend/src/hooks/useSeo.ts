import { useEffect } from "react";

interface SeoConfig {
  title: string;
  description: string;
  image?: string;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function useSeo({ title, description, image }: SeoConfig) {
  useEffect(() => {
    document.title = `${title} | Groupe Prolongation`;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", `${title} | Groupe Prolongation`);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", window.location.href);
    if (image) {
      upsertMeta("property", "og:image", image);
    }
  }, [description, image, title]);
}
