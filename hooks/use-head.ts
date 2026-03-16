import { useEffect } from "react";

interface HeadOptions {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogType?: string;
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

const defaultTitle = "DevToolbox - Privacy-First Developer Tools";
const defaultDescription = "Free, privacy-first developer toolkit. JSON editor, JWT decoder, Base64 encoder, UUID generator, regex validator, and 30+ tools. 100% client-side, no data leaves your browser.";

export function useHead(options: HeadOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    if (options.title) document.title = options.title;
    if (options.description) setMeta("description", options.description);
    if (options.canonical) setLink("canonical", options.canonical);
    if (options.ogTitle) setMeta("og:title", options.ogTitle, "property");
    if (options.ogDescription) setMeta("og:description", options.ogDescription, "property");
    if (options.ogUrl) setMeta("og:url", options.ogUrl, "property");
    if (options.ogType) setMeta("og:type", options.ogType, "property");

    return () => {
      document.title = prevTitle;
      setMeta("description", defaultDescription);
    };
  }, [options.title, options.description, options.canonical, options.ogTitle, options.ogDescription, options.ogUrl, options.ogType]);
}
