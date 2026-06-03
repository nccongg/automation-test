import { useState } from "react";
import ImageLightbox from "./ImageLightbox";

export default function ScreenshotList({
  screenshots,
  stepNo,
  gridClassName = "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4",
}) {
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const valid = screenshots?.filter((s) => s.imageUrl) ?? [];
  if (valid.length === 0) return null;

  return (
    <>
      <div className={gridClassName}>
        {valid.map((shot) => (
          <button
            key={shot.id}
            type="button"
            onClick={() => setLightboxSrc(shot.imageUrl)}
            className="group relative block aspect-video w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-muted/40 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src={shot.imageUrl}
              alt={`Step ${stepNo} screenshot`}
              className="h-full w-full object-cover object-top transition-transform group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
              <span className="rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                View
              </span>
            </div>
          </button>
        ))}
      </div>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={`Step ${stepNo} screenshot`}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
