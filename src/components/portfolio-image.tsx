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

function isAllowedImageSource(value: string): boolean {
  const source = value.trim();
  return source.startsWith("/") || source.startsWith("https://") || source.startsWith("blob:");
}

/**
 * Image renderer for the portfolio. A missing, invalid or failed image is
 * contained locally and replaced with a designed placeholder; it never
 * throws and cannot take down the page.
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
  const safeSrc = typeof src === "string" && isAllowedImageSource(src) ? src.trim() : "";

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
