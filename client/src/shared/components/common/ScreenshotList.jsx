import { useState } from "react";
import ImageLightbox from "./ImageLightbox";

export default function ScreenshotList({ screenshots, stepNo }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const valid = screenshots?.filter((s) => s.imageUrl) ?? [];
  if (valid.length === 0) return null;

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {valid.map((shot) => (
          <button
            key={shot.id}
            type="button"
            onClick={() => setLightboxSrc(shot.imageUrl)}
            className="group relative block overflow-hidden rounded-lg border border-slate-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <img
              src={shot.imageUrl}
              alt={`Step ${stepNo} screenshot`}
              className="h-28 w-44 object-cover transition-opacity group-hover:opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg">
              <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-700 text-xs font-medium px-2 py-1 rounded-md transition-opacity">
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
