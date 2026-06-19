import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookTestButton } from "@/components/shared/BookTestButton";
import { cn } from "@/lib/utils";

// Cache for loaded images (persists across component remounts)
const loadedImages = new Set<string>();

// Loading image component with blur effect
function LoadingImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const alreadyLoaded = loadedImages.has(src);
  const [isLoaded, setIsLoaded] = useState(alreadyLoaded);

  const handleLoad = () => {
    loadedImages.add(src);
    setIsLoaded(true);
  };

  if (alreadyLoaded) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div className="relative w-full h-full">
      {/* Shimmer skeleton */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl overflow-hidden transition-opacity duration-500",
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-border/60 via-muted/80 to-border/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" />
      </div>

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-all duration-700 ease-out",
          isLoaded
            ? "opacity-100 blur-0 scale-100"
            : "opacity-0 blur-md scale-[1.02]",
          className,
        )}
        onLoad={handleLoad}
      />

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

export interface ActionCardItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  // Preserve raw data for detail views
  rawData?: unknown;
}

interface ActionCarouselProps {
  title: string;
  categoryId?: string;
  items: ActionCardItem[];
  onItemClick?: (item: ActionCardItem, categoryId: string) => void;
}

export function ActionCarousel({
  title,
  categoryId = "",
  items,
  onItemClick,
}: ActionCarouselProps) {
  const isTestPackage = categoryId === "test_packages";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

    // Only enable scroll if there's actually content to scroll
    const hasOverflow = scrollWidth > clientWidth + 1;
    setCanScrollLeft(hasOverflow && scrollLeft > 1);
    setCanScrollRight(
      hasOverflow && scrollLeft < scrollWidth - clientWidth - 1,
    );

    // Calculate active index for pagination dots
    if (hasOverflow && clientWidth > 0) {
      const cardWidth = 280 + 16; // card width + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(newIndex, items.length - 1));
    }
  }, [items.length]);

  // Check scrollability on mount and when items change
  useEffect(() => {
    checkScrollPosition();
    // Also check after images might have loaded
    const timer = setTimeout(checkScrollPosition, 100);
    return () => clearTimeout(timer);
  }, [items, checkScrollPosition]);

  // Add resize observer to recalculate on container size changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [checkScrollPosition]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section title */}
      <h2 className="font-serif font-normal text-2xl text-[#2F2F2F]">{title}</h2>

      {/* Carousel container */}
      <div className="relative group">
        {/* Navigation arrows - desktop only */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        {canScrollRight && items.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Scrollable container - extra padding for shadows (overflow-x clips y) */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-6 -my-6 -mx-4 px-4 md:-mx-2 md:px-2"
          onScroll={checkScrollPosition}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "flex-shrink-0 w-[280px] md:w-[320px] snap-start bg-white border border-[#c0d8ec] shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl",
                "transition-all duration-300 hover:shadow-lg group/action",
                onItemClick && "cursor-pointer",
              )}
              onClick={() => onItemClick?.(item, categoryId)}
            >
              <CardContent className="p-3">
                {item.imageUrl && (
                  <div className="relative h-40 md:h-48 overflow-hidden rounded-xl mb-3">
                    <LoadingImage
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/action:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                <h3 className="body-md text-foreground font-medium line-clamp-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 group-hover/action:line-clamp-none">
                    {item.description}
                  </p>
                )}
                {/* Show Book Test button for test packages */}
                {isTestPackage && (
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <BookTestButton className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination dots for mobile - show active state based on scroll */}
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3 md:hidden">
            {items.slice(0, Math.min(5, items.length)).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === activeIndex
                    ? "w-4 bg-foreground"
                    : "w-1.5 bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
