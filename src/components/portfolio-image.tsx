import { useEffect, useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";

type PortfolioImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  fallbackCaption?: string;
  variant?: "portrait" | "artwork";
  priority?: boolean;
};

// Public portfolio assets live in a dedicated bucket, separate from the
// private media bucket used by Rosa Azul Caderno.
const PORTFOLIO_STORAGE_URL =
  "https://utmcnicgabcmkfmsxzop.supabase.co/storage/v1/object/public/portfolio-media/";

function resolveImageSource(value: string): string {
  const source = value.trim();

  // Keep compatibility with the existing /images/* references in the page,
  // but serve those files from Supabase Storage so they work on every device.
  if (source.startsWith("/images/")) {
    const fileName = source.slice("/images/".length);
    const safePath = fileName.split("/").map(encodeURIComponent).join("/");
    return `${PORTFOLIO_STORAGE_URL}${safePath}`;
  }

  return source;
}

function isAllowedImageSource(value: string): boolean {
  const source = value.trim();
  return source.startsWith("https://") || source.startsWith("blob:");
}

/**
 * Portfolio image renderer. It resolves local portfolio asset names to the
 * public Supabase bucket, lazy-loads gallery images, and contains failures
 * inside a designed placeholder so a missing asset never breaks the page.
 */
export function PortfolioImage({
  src,
  alt,
  className = "",
  fallbackTitle,
  fallbackCaption = "Imagem indisponível no momento",
  variant = "artwork",
  priority = false,
}: PortfolioImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc =
    typeof src === "string" && src.trim() ? resolveImageSource(src) : "";
  const safeSrc = resolvedSrc && isAllowedImageSource(resolvedSrc) ? resolvedSrc : "";

  useEffect(() => {
    setFailed(false);
  }, [safeSrc]);

  const showImage = Boolean(safeSrc) && !failed;

  return (
    <div
      className={`portfolio-image portfolio-image--${variant} ${className}`.trim()}
      role="img"
      aria-label={alt}
    >
      {showImage ? (
        <img
          src={safeSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="portfolio-image-fallback" aria-hidden="true">
          <div className="portfolio-image-fallback-glow" />
          {variant === "portrait" ? (
            <span className="portfolio-image-monogram">DF</span>
          ) : (
            <ImageOff className="portfolio-image-fallback-icon" strokeWidth={1.3} />
          )}
          <span className="portfolio-image-fallback-title">{fallbackTitle ?? alt}</span>
          <span className="portfolio-image-fallback-caption">
            <Sparkles size={12} /> {fallbackCaption}
          </span>
        </div>
      )}
    </div>
  );
}
