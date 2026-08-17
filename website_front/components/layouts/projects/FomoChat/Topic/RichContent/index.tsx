import React, { useMemo } from "react";
import { Link2, Youtube } from "lucide-react";
import {
  RichWrap,
  RichHtml,
  RichText,
  Gallery,
  EmbedList,
  VideoEmbed,
  LinkCard,
  TagsRow,
  Carousel,
} from "./styles";

/**
 * RichContent — the canonical renderer for Buzz forum posts.
 *
 * A post produced by the "Create a Post" composer carries several layers of
 * content: sanitized rich `bodyHtml`, an image gallery, external `mediaUrls`
 * (YouTube / links) and `tags`. Previously only the plain `text` was shown;
 * this component renders the whole thing safely.
 *
 * Security: `bodyHtml` is sanitized on write (backend) AND again here with
 * DOMPurify (defense in depth). Links are forced to open in a new tab with
 * rel="noopener noreferrer".
 */

interface RichContentProps {
  bodyHtml?: string;
  text?: string;
  images?: string[];
  coverImage?: string;
  image?: string;
  mediaUrls?: string[];
  tags?: string[];
  /** Feed-card mode: tighter spacing + capped media height. */
  compact?: boolean;
  /** Thread mode: multiple images/videos go into a horizontal scroll (carousel)
   *  instead of stacking vertically and eating the whole page. */
  carousel?: boolean;
  className?: string;
}

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li",
  "blockquote", "code", "pre", "h1", "h2", "h3", "h4", "span", "img", "hr",
];

/**
 * Isomorphic (SSR + client) sanitizer. The backend already strips dangerous
 * markup on write; this is defense-in-depth that runs identically on server and
 * client (no jsdom, no hydration mismatch): it removes dangerous elements,
 * inline event handlers and javascript: URLs, and drops any tag not on the
 * allow-list while keeping its inner text.
 */
const sanitize = (html: string): string => {
  if (!html) return "";
  let out = String(html).slice(0, 20000);
  // Remove dangerous elements entirely (with their content).
  out = out.replace(
    /<(script|style|iframe|object|embed|form|link|meta)[\s\S]*?<\/\1>/gi,
    ""
  );
  out = out.replace(/<(script|style|iframe|object|embed|form|link|meta)[^>]*\/?>/gi, "");
  // Strip inline event handlers and javascript: / data: (non-image) URLs.
  out = out.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  out = out.replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
  // Drop any tag not on the allow-list (keep inner text).
  out = out.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag) => {
    return ALLOWED_TAGS.includes(String(tag).toLowerCase()) ? match : "";
  });
  return out;
};

const getYoutubeId = (url: string): string | null => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1) || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
    }
    return null;
  } catch {
    return null;
  }
};

const prettyUrl = (url: string): string => {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname !== "/" ? u.pathname : ""}`;
  } catch {
    return url;
  }
};

const isHtmlMeaningful = (html: string): boolean =>
  !!html && html.replace(/<[^>]*>/g, "").trim().length > 0;

const RichContent: React.FC<RichContentProps> = ({
  bodyHtml,
  text,
  images,
  coverImage,
  image,
  mediaUrls,
  tags,
  compact = false,
  carousel = false,
  className = "",
}) => {
  const cleanHtml = useMemo(
    () => (bodyHtml ? sanitize(bodyHtml) : ""),
    [bodyHtml]
  );

  // De-duplicated, non-empty image list (cover first, then gallery/legacy).
  const gallery = useMemo(() => {
    const all = [coverImage, ...(images || []), image].filter(
      (x): x is string => !!x && x.trim().length > 0
    );
    return Array.from(new Set(all));
  }, [images, coverImage, image]);

  const embeds = useMemo(() => {
    const seen = new Set<string>();
    return (mediaUrls || [])
      .map((u) => (u || "").trim())
      .filter((u) => {
        if (!u || seen.has(u)) return false;
        seen.add(u);
        return /^https?:\/\//i.test(u);
      });
  }, [mediaUrls]);

  const showHtml = isHtmlMeaningful(cleanHtml);
  const showText = !showHtml && !!text && text.trim().length > 0;

  return (
    <RichWrap
      className={`${compact ? "compact" : ""} ${className}`.trim()}
      data-testid="rich-content"
    >
      {showHtml ? (
        <RichHtml dangerouslySetInnerHTML={{ __html: cleanHtml }} />
      ) : showText ? (
        <RichText>{text}</RichText>
      ) : null}

      {carousel && gallery.length + embeds.length > 0 && (
        <Carousel data-testid="rich-carousel">
          {gallery.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="slide" key={`c-img-${i}`}>
              <img src={src} alt={`attachment ${i + 1}`} loading="lazy" />
            </div>
          ))}
          {embeds.map((url, i) => {
            const ytId = getYoutubeId(url);
            if (ytId) {
              return (
                <div className="slide" key={`c-yt-${i}`}>
                  <div className="video">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title={`YouTube video ${i + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            }
            return (
              <LinkCard key={`c-lnk-${i}`} href={url} target="_blank" rel="noopener noreferrer">
                <Link2 size={16} />
                <span className="url">{prettyUrl(url)}</span>
              </LinkCard>
            );
          })}
        </Carousel>
      )}

      {!carousel && gallery.length > 0 && (
        <Gallery
          $count={gallery.length}
          className={compact ? "compact" : ""}
          data-testid="rich-gallery"
        >
          {(compact ? gallery.slice(0, 2) : gallery.slice(0, 6)).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="media-cell" key={`${i}-${src.slice(0, 24)}`}>
              <img src={src} alt={`attachment ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </Gallery>
      )}

      {!compact && !carousel && embeds.length > 0 && (
        <EmbedList data-testid="rich-embeds">
          {embeds.map((url, i) => {
            const ytId = getYoutubeId(url);
            if (ytId) {
              return (
                <VideoEmbed key={`yt-${i}`}>
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title={`YouTube video ${i + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </VideoEmbed>
              );
            }
            return (
              <LinkCard
                key={`lnk-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link2 size={16} />
                <span className="url">{prettyUrl(url)}</span>
              </LinkCard>
            );
          })}
        </EmbedList>
      )}

      {compact && embeds.length > 0 && (
        <EmbedList data-testid="rich-embeds-compact">
          {embeds.slice(0, 1).map((url, i) => (
            <LinkCard
              key={`clnk-${i}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {getYoutubeId(url) ? <Youtube size={16} /> : <Link2 size={16} />}
              <span className="url">{prettyUrl(url)}</span>
            </LinkCard>
          ))}
        </EmbedList>
      )}

      {tags && tags.length > 0 && (
        <TagsRow className={compact ? "compact" : ""} data-testid="rich-tags">
          {tags.slice(0, compact ? 4 : 12).map((t, i) => (
            <span className="tag" key={`${i}-${t}`}>
              #{t}
            </span>
          ))}
        </TagsRow>
      )}
    </RichWrap>
  );
};

export default RichContent;
